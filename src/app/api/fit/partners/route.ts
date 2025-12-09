// src/app/api/fit/partners/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PartnerDoc = {
  userId: string;
  displayName?: string | null;
  sports?: string[];
  level?: "beginner" | "intermediate" | "advanced" | null;
  gym?: string | null;
  available?: boolean;
  avatarUrl?: string | null;
  city?: string | null;
  updatedAt?: string | Date | null;
  // גיאו:
  loc?: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
};

type ApiOk = {
  ok: true;
  items: Array<{
    userId: string;
    displayName: string | null;
    sports: string[];
    level: "beginner" | "intermediate" | "advanced" | null;
    gym: string | null;
    available: boolean;
    avatarUrl: string | null;
    city: string | null;
    distKm: number | null;
    updatedAt: string | null;
    lat?: number | null;
    lng?: number | null;
  }>;
};

type ApiErr = { ok: false; error: string };

function num(v: string | null, def: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function b01(v: string | null, def: boolean) {
  if (v === "1") return true;
  if (v === "0") return false;
  return def;
}
function clip(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

async function ensureIndexes(dbName: string) {
  const db = await getDb(dbName);
  // הקולקציות האפשריות אצלך – עדכן אם השמות שונים
  const colls = ["fit_profiles", "fit_profilesTree", "user_locations"];
  for (const name of colls) {
    try {
      await db
        .collection(name)
        .createIndex({ loc: "2dsphere" }, { name: "loc_2dsphere" });
    } catch {}
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dbName = process.env.MONGODB_DB || "maty-music";

  try {
    // פרמטרים
    const lat = num(url.searchParams.get("lat"), NaN);
    const lng = num(url.searchParams.get("lng"), NaN);
    const km = clip(num(url.searchParams.get("km"), 15), 1, 100);
    const limit = clip(num(url.searchParams.get("limit"), 40), 1, 100);
    const available = b01(url.searchParams.get("available"), false);
    const sport = url.searchParams.get("sport")?.trim() || "";
    const sportsAny =
      url.searchParams
        .get("sports_any")
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) || [];
    const level = url.searchParams.get("level") as
      | "beginner"
      | "intermediate"
      | "advanced"
      | ""
      | null;
    const sort = (url.searchParams.get("sort") || "distance") as
      | "distance"
      | "updated";

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      const err: ApiErr = { ok: false, error: "missing lat/lng" };
      return NextResponse.json(err, { status: 400 });
    }

    // אינדקסים (פעם אחת לפרוסס)
    // מאפשר למנוע שגיאת unable to find index for $geoNear
    await ensureIndexes(dbName);

    const db = await getDb(dbName);
    // החלטה על קולקציה: קודם ננסה fit_profilesTree, אם אין – fit_profiles, אם אין – user_locations
    const candidates = [
      "fit_profilesTree",
      "fit_profiles",
      "user_locations",
    ] as const;
    let collName: (typeof candidates)[number] | null = null;
    for (const name of candidates) {
      const exists = await db.listCollections({ name }).hasNext();
      if (exists) {
        collName = name;
        break;
      }
    }
    if (!collName) collName = "user_locations";

    const meters = km * 1000;

    // בונים match אחרי ה-geoNear (שימו לב: $geoNear חייב להיות ראשון)
    const postMatch: any = {};
    if (available) postMatch.available = true;
    if (level) postMatch.level = level;
    if (sport) postMatch.sports = sport;
    if (sportsAny.length) postMatch.sports = { $in: sportsAny };

    const pipeline: any[] = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "dist",
          spherical: true,
          maxDistance: meters,
          key: "loc",
        },
      },
      { $match: postMatch },
      {
        $project: {
          _id: 0,
          userId: 1,
          displayName: { $ifNull: ["$displayName", null] },
          sports: { $ifNull: ["$sports", []] },
          level: { $ifNull: ["$level", null] },
          gym: { $ifNull: ["$gym", null] },
          available: { $ifNull: ["$available", false] },
          avatarUrl: { $ifNull: ["$avatarUrl", null] },
          city: { $ifNull: ["$city", null] },
          updatedAt: {
            $cond: [
              { $gt: ["$updatedAt", null] },
              { $toString: "$updatedAt" },
              null,
            ],
          },
          // מרחק במטרים → ק"מ
          distKm: { $divide: ["$dist", 1000] },
          // תן גם lat/lng אם יש loc
          lat: {
            $cond: [
              {
                $and: [
                  { $ifNull: ["$loc", false] },
                  { $eq: ["$loc.type", "Point"] },
                ],
              },
              { $arrayElemAt: ["$loc.coordinates", 1] },
              null,
            ],
          },
          lng: {
            $cond: [
              {
                $and: [
                  { $ifNull: ["$loc", false] },
                  { $eq: ["$loc.type", "Point"] },
                ],
              },
              { $arrayElemAt: ["$loc.coordinates", 0] },
              null,
            ],
          },
        },
      },
      // מיון בשרת
      sort === "updated"
        ? { $sort: { updatedAt: -1 } }
        : { $sort: { distKm: 1 } },
      { $limit: limit },
    ];

    const items = await db
      .collection<PartnerDoc>(collName)
      .aggregate(pipeline, { allowDiskUse: true })
      .toArray();

    const body: ApiOk = {
      ok: true,
      items: items.map((p) => ({
        userId: p.userId,
        displayName: p.displayName ?? null,
        sports: p.sports ?? [],
        level: (p.level as any) ?? null,
        gym: p.gym ?? null,
        available: Boolean(p.available),
        avatarUrl: p.avatarUrl ?? null,
        city: p.city ?? null,
        distKm:
          typeof (p as any).distKm === "number"
            ? Number((p as any).distKm)
            : null,
        updatedAt: p.updatedAt
          ? new Date(p.updatedAt as any).toISOString()
          : null,
        lat: (p as any).lat ?? null,
        lng: (p as any).lng ?? null,
      })),
    };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    const msg = e?.message || String(e);
    // תמיד נחזיר JSON, לא גוף ריק
    const err: ApiErr = { ok: false, error: msg };
    return NextResponse.json(err, { status: 500 });
  }
}
