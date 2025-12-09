// src/app/api/geo/reverse/route.ts
import { NextResponse } from "next/server";

// אפשר לשנות מזהה לפי הפרויקט שלך
const UA = "MATY-MUSIC/1.0 (reverse geocoding; contact: admin@yourdomain.com)";

let lastCall = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    if (!lat || !lon) {
      return NextResponse.json(
        { ok: false, error: "missing lat/lon" },
        { status: 400 },
      );
    }

    // rate-limit קטן (נימוס לנומינטים)
    const now = Date.now();
    if (now - lastCall < 600) {
      await new Promise((r) => setTimeout(r, 600 - (now - lastCall)));
    }
    lastCall = Date.now();

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lon);
    url.searchParams.set("zoom", "10");
    url.searchParams.set("addressdetails", "1");

    const r = await fetch(url.toString(), {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
        "Accept-Language": "he,en;q=0.8",
        // אל תעביר Referer פרטי אם לא צריך
      },
      // אפשר cache-side קצר (דקה) — תעזיז לפי הטעם
      next: { revalidate: 60 },
    });

    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: `upstream ${r.status}` },
        { status: 502 },
      );
    }

    const j = await r.json().catch(() => null);
    const addr = j?.address || {};
    // בחירת תווית קצרה ונעימה
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county ||
      j?.name ||
      null;

    const country = addr.country || null;

    return NextResponse.json({
      ok: true,
      city,
      country,
      raw: { display_name: j?.display_name }, // דיבאג/מידע, לא חובה
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "error" },
      { status: 500 },
    );
  }
}
