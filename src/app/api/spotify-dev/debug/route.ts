import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET() {
  const envs = {
    SPOTIFY_CLIENT_ID: !!process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: !!process.env.SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REFRESH_TOKEN: !!process.env.SPOTIFY_REFRESH_TOKEN,
    // לעזרה: אורך הטוקן (בלי לחשוף אותו)
    REFRESH_LEN: process.env.SPOTIFY_REFRESH_TOKEN?.length || 0,
  };
  return NextResponse.json({ ok: true, envs });
}
