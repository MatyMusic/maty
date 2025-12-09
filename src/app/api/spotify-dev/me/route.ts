// app/api/spotify-dev/me/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET() {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } =
    process.env;
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Missing SPOTIFY envs" },
      { status: 500 }
    );
  }

  // רענון טוקן
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString(
          "base64"
        ),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
    cache: "no-store",
  });
  const token = await tokenRes.json();
  if (!token.access_token) {
    return NextResponse.json(
      { ok: false, error: "failed_refresh", received: token },
      { status: 500 }
    );
  }

  // קריאת הפרופיל
  const meRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  const me = await meRes.json();
  return NextResponse.json({ ok: true, me });
}
