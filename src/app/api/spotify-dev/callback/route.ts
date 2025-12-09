// GET /api/spotify-dev/callback?code=...&state=...
export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const code = u.searchParams.get("code");
  const err = u.searchParams.get("error");

  if (err) {
    return Response.json({ ok: false, error: err }, { status: 400 });
  }
  if (!code) {
    return Response.json({ ok: false, error: "missing_code" }, { status: 400 });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = "http://127.0.0.1:3000/api/spotify-dev/callback";

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    return Response.json({ ok: false, error: data }, { status: 500 });
  }

  // תראה כאן את ה-refresh_token — להעתיק ל-.env.local
  return Response.json({
    ok: true,
    received: {
      access_token: !!data.access_token,
      token_type: data.token_type,
      scope: data.scope,
      expires_in: data.expires_in,
    },
    refresh_token: data.refresh_token || null,
    note: "העתק את refresh_token אל SPOTIFY_REFRESH_TOKEN ב-.env.local",
  });
}
