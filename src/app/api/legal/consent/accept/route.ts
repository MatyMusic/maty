// src/app/api/legal/consent/accept/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = process.env.NEXT_PUBLIC_CONSENT_COOKIE || "md:consent"; // ← תואם לקליינט
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/maty-date";
  const now = new Date().toISOString();

  // אופציונלי: עדכון פרופיל (אם ה-API שלך קיים; לא מפיל את הבקשה במקרה של כישלון)
  try {
    await fetch(new URL("/api/date/profile", req.url), {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        consents: {
          // אפשר לשים רק communityAt, או הכול — לשיקולך
          communityAt: now,
          tosAt: now,
          privacyAt: now,
        },
      }),
      // חשוב: אותו origin, אין צורך ב-credentials כאן כי זה בצד השרת
    });
  } catch {}

  const res = NextResponse.json(
    { ok: true, next, at: now },
    { headers: { "Cache-Control": "no-store" } },
  );

  // אם אתה עושה Gate בצד השרת — כדאי httpOnly: true. אם חייבים לקרוא מהקליינט – הפוך ל-false.
  res.cookies.set(COOKIE_NAME, "1", {
    path: "/",
    maxAge: ONE_YEAR,
    httpOnly: true, // הפוך ל-false אם אתה חייב לקרוא ב-client
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
