// src/app/api/geo/reverse/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

/**
 * Reverse Geocoding מדויק + תווית בעברית.
 * שימוש: /api/geo/reverse?lat=32.0853&lon=34.7818
 * מחזיר:
 * {
 *   ok: true,
 *   label: "לב תל אביב • תל אביב",
 *   city: "תל אביב",
 *   area: "לב תל אביב",
 *   lat: 32.0853,
 *   lon: 34.7818
 * }
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lat = Number(url.searchParams.get("lat"));
    const lon = Number(url.searchParams.get("lon"));

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json(
        { ok: false, error: "bad_coords" },
        { status: 400 },
      );
    }

    // בקשה ל־OpenStreetMap Nominatim
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1&accept-language=he`;

    const res = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "MATY-MUSIC/1.0 (contact: matymusic770@gmail.com)",
      },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Nominatim error ${res.status}`);

    const data = await res.json();
    const addr = data.address || {};

    // ניסיון לחלץ שכונה / אזור
    const area =
      addr.neighbourhood ||
      addr.suburb ||
      addr.quarter ||
      addr.city_district ||
      "";

    // ניסיון לחלץ עיר
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county ||
      "";

    // יצירת תווית יפה
    let label = "";
    if (area && city) label = `${area} • ${city}`;
    else if (city) label = city;
    else label = data.display_name?.split(",")?.[0] || "מיקום לא זוהה";

    return NextResponse.json(
      {
        ok: true,
        label,
        city,
        area,
        lat,
        lon,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err: any) {
    console.error("[GEO.REVERSE] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "geo_error" },
      { status: 500 },
    );
  }
}
