// src/app/api/legal/consent/status/route.ts
import { NextResponse } from "next/server";

const CONSENT_COOKIE = process.env.NEXT_PUBLIC_CONSENT_COOKIE || "md:consent";
const CONSENT_VERSION = process.env.NEXT_PUBLIC_CONSENT_VERSION || "v1";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      has: false,
      version: CONSENT_VERSION,
    },
    {
      headers: {
        // נבדוק בצד השרת אם הקוקי קיים וגרסתו מתאימה
      },
    },
  );
}

export async function POST() {
  const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;
  const res = NextResponse.json({ ok: true, version: CONSENT_VERSION });
  res.cookies.set(CONSENT_COOKIE, CONSENT_VERSION, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: CONSENT_MAX_AGE,
  });
  return res;
}
