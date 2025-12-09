// scripts/spotify-get-refresh.ts
import { config } from "dotenv";
config({ path: ".env.local" }); // <- חשוב

async function main() {
  const [code, redirect = "http://127.0.0.1:3000/api/auth/callback/spotify"] =
    process.argv.slice(2);
  const id = process.env.SPOTIFY_CLIENT_ID || "";
  const secret = process.env.SPOTIFY_CLIENT_SECRET || "";
  if (!code) {
    console.error(
      '❌ Usage: tsx scripts/spotify-get-refresh.ts "<CODE>" [redirect_uri]'
    );
    process.exit(1);
  }
  if (!id || !secret) {
    console.error(
      "❌ Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in .env.local"
    );
    process.exit(1);
  }

  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirect,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  const json = await res.json();
  if (!res.ok) {
    console.error("❌ Token exchange failed:", json);
    process.exit(1);
  }

  console.log("✅ access_token:", json.access_token ? "received" : "missing");
  console.log("🔁 refresh_token:", json.refresh_token || "(none)");
  if (json.refresh_token)
    console.log(
      "\n👉 הוסף ל-.env.local:\nSPOTIFY_REFRESH_TOKEN=" +
        json.refresh_token +
        "\n"
    );
}
main();
