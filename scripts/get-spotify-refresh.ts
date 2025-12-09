// scripts/get-spotify-refresh.ts
import http from "http";
import { exec } from "child_process";
import fetch from "node-fetch";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = "http://localhost:5173/callback";
const SCOPE = "user-read-email playlist-read-private";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in env");
  process.exit(1);
}

const authUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
  }).toString();

const server = http.createServer(async (req, res) => {
  if (!req.url) return;
  if (req.url.startsWith("/callback")) {
    const url = new URL(req.url, REDIRECT_URI);
    const code = url.searchParams.get("code");
    if (!code) {
      res.writeHead(400);
      res.end("Missing code");
      return;
    }
    try {
      const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
        "base64"
      );
      const r = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basic}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
        }),
      });
      const j: any = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(j));
      const refresh = j.refresh_token;
      console.log("\n=== COPY THIS INTO .env.local ===");
      console.log(`SPOTIFY_REFRESH_TOKEN=${refresh}\n`);
      res.end("OK! You can close this tab.");
    } catch (e: any) {
      console.error("Token exchange failed:", e?.message || e);
      res.statusCode = 500;
      res.end("Token exchange failed. Check console.");
    } finally {
      setTimeout(() => server.close(), 500);
    }
  } else {
    res.writeHead(200);
    res.end("Ready.");
  }
});

server.listen(5173, () => {
  console.log("Listening on http://localhost:5173 …");
  // פותח את הדפדפן (Windows/Mac/Linux). אם לא נפתח — הדבק ידנית את ה-URL מתחת.
  const openCmd =
    process.platform === "win32"
      ? "start"
      : process.platform === "darwin"
      ? "open"
      : "xdg-open";
  exec(`${openCmd} "${authUrl}"`, () => {
    console.log("If the browser didn't open, paste this URL:\n", authUrl);
  });
});
