// src/app/api/online/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getPresenceFeature } from "@/lib/db/features"; // קיים לפי ההודעות הקודמות

/** ===== Mongo helpers ===== */
type UserLoc = {
  userId: string; // אנונימי/משתמש אמיתי
  loc?: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  updatedAt: Date;
};

function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}

async function getCol() {
  const cli = await clientPromise;
  const db = cli.db(dbName());
  const C = db.collection<UserLoc>("user_locations");
  // אינדקסים בטוחים (ירוצו פעם אחת)
  try {
    await C.createIndex({ userId: 1 }, { unique: true, name: "user_unique" });
  } catch {}
  try {
    await C.createIndex({ updatedAt: -1 }, { name: "updated_desc" });
  } catch {}
  try {
    await C.createIndex({ loc: "2dsphere" } as any, { name: "loc_2dsphere" });
  } catch {}
  return C;
}

/** ===== Utils ===== */
function toFloat(x: any) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}
function validCoords(lat: number | null, lng: number | null) {
  return (
    lat !== null &&
    lng !== null &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
function minutesAgo(min: number) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - min);
  return d;
}

/** יצירת מזהה "לקוח" פשוט — לפי session/ip/agent (ללא הצפנה) */
function getClientId(req: Request) {
  const h = req.headers;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "0.0.0.0";
  const ua = h.get("user-agent") || "ua";
  const cookie = h.get("cookie") || "";
  // אם יש appSession או next-auth token — נשתמש בהם כדי לייצב userId
  const appSession = /appSession=([^;]+)/.exec(cookie)?.[1];
  const nextAuth = /next-auth\.session-token=([^;]+)/.exec(cookie)?.[1];
  const secureNextAuth = /__Secure-next-auth\.session-token=([^;]+)/.exec(
    cookie,
  )?.[1];

  const id = appSession || nextAuth || secureNextAuth || `${ip}|${ua}`;
  return `u:${id}`.slice(0, 512);
}

/** ===== GET: ספירה + קרובים =====
 * Query:
 *   - lat,lng (אופציונלי) להצגת קרובים
 *   - km (ברירת מחדל 50)
 */
export async function GET(req: Request) {
  try {
    // פיצ'ר כבוי? החזר תשובה קצרה
    const feature = await getPresenceFeature().catch(() => ({ enabled: true }));
    if (!feature?.enabled) {
      return NextResponse.json(
        { ok: true, enabled: false, count: 0, nearby: [] },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const url = new URL(req.url);
    const lat = toFloat(url.searchParams.get("lat"));
    const lng = toFloat(url.searchParams.get("lng"));
    const km = toFloat(url.searchParams.get("km")) ?? 50;

    const C = await getCol();
    const activeSince = minutesAgo(5); // נחשב אונליין ב-5 דק' האחרונות
    const count = await C.countDocuments({ updatedAt: { $gte: activeSince } });

    let nearby: Array<{ id: string; dist: number }> = [];
    if (validCoords(lat, lng)) {
      // שימוש ב-geoNear רק אם יש קואורדינטות
      const meters = km * 1000;
      const rows = await C.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lng!, lat!] },
            key: "loc",
            spherical: true,
            maxDistance: meters,
            distanceField: "dist",
            query: { updatedAt: { $gte: activeSince } },
          },
        },
        { $limit: 50 },
        { $project: { _id: 0, userId: 1, dist: 1 } },
      ]).toArray();

      nearby = rows.map((r: any) => ({
        id: r.userId,
        dist: typeof r.dist === "number" ? r.dist / 1000 : 0, // ק"מ
      }));
    }

    return NextResponse.json(
      { ok: true, enabled: true, count, nearby },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    );
  }
}

/** ===== POST: פינג “אני אונליין” =====
 * Body JSON: { coords?: { lat: number, lon|lng: number } }
 */
export async function POST(req: Request) {
  try {
    // פיצ'ר כבוי? אל תעשה כלום — אבל תחזיר ok
    const feature = await getPresenceFeature().catch(() => ({ enabled: true }));
    if (!feature?.enabled) {
      return NextResponse.json(
        { ok: true, ignored: true },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const clientId = getClientId(req);
    const lat = toFloat(body?.coords?.lat);
    const lng = toFloat(body?.coords?.lng ?? body?.coords?.lon);

    const C = await getCol();
    const update: Partial<UserLoc> = {
      userId: clientId,
      updatedAt: new Date(),
    };
    if (validCoords(lat, lng)) {
      update.loc = { type: "Point", coordinates: [lng!, lat!] };
    }

    await C.updateOne({ userId: clientId }, { $set: update }, { upsert: true });

    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    );
  }
}
