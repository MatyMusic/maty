// src/app/api/club/presence/list/route.ts
import { NextResponse } from "next/server";
// כאן תייבא db / מודלים שלך

export async function GET() {
  try {
    // TODO: לשלוף מה־DB שלך / collection של presence
    // כרגע – דמו
    const items = [
      {
        id: "1",
        name: "מתי",
        city: "מודיעין",
        distanceKm: 2.1,
        avatarUrl: "/assets/avatars/maty.png",
        genre: "חב״ד",
        isOnline: true,
      },
      {
        id: "2",
        name: "ינון",
        city: "מודיעין",
        distanceKm: 4.8,
        avatarUrl: "",
        genre: "מזרחי",
        isOnline: true,
      },
    ];

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error("presence list error:", e);
    return NextResponse.json(
      { ok: false, error: "failed to load presence" },
      { status: 500 },
    );
  }
}
