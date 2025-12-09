// דף מלא — ללא cache
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

/**
 * API: GET /api/club/presence/list
 * מחזיר רשימת משתמשים "קרובים אליך" / "מחוברים" לצורך ה־RightSidebar
 */
export async function GET() {
  try {
    // דמו — אפשר להחליף במונגו אחר כך
    const items = [
      {
        id: "maty",
        name: "מתי",
        city: "מודיעין",
        distanceKm: 1.8,
        avatarUrl: "/assets/avatars/maty.png",
        genre: "חב״ד / מזרחי",
        isOnline: true,
      },
      {
        id: "yinon",
        name: "ינון",
        city: "מודיעין",
        distanceKm: 4.2,
        avatarUrl: "/assets/avatars/yinon.png",
        genre: "מזרחי",
        isOnline: true,
      },
      {
        id: "aharon",
        name: "אהרון",
        city: "מודיעין",
        distanceKm: 7.5,
        avatarUrl: "/assets/avatars/aharon.png",
        genre: "FUN / קומי",
        isOnline: false,
      },
    ];

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error("presence list error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "presence_failed" },
      { status: 500 },
    );
  }
}
