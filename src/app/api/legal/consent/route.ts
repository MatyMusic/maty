// src/app/api/legal/consent/route.ts
import { NextResponse } from "next/server";

const CONSENT_COOKIE = process.env.NEXT_PUBLIC_CONSENT_COOKIE || "md:consent";
const CONSENT_VERSION = process.env.NEXT_PUBLIC_CONSENT_VERSION || "v1";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST() {
  const res = NextResponse.json({ ok: true, version: CONSENT_VERSION });
  res.cookies.set(CONSENT_COOKIE, CONSENT_VERSION, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: ONE_YEAR,
  });
  return res;
}
