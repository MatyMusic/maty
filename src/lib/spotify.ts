// lib/spotify.ts
let cached: { token: string; exp: number } | null = null;

export async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN!;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing SPOTIFY envs (client id/secret or refresh token)."
    );
  }

  // החזר מטמון אם עדיין בתוקף (בופר קטן)
  if (cached && Date.now() < cached.exp - 30_000) return cached.token;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
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
    throw new Error(
      `Spotify token error: ${res.status} ${JSON.stringify(data)}`
    );
  }

  const access = String(data.access_token);
  const ttl = Number(data.expires_in || 3600) * 1000;
  cached = { token: access, exp: Date.now() + ttl };
  return access;
}
