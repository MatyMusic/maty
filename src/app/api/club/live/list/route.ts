// src/app/api/club/live/list/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import connectDB from "@/lib/db/mongoose";
import LiveSession from "@/models/club/LiveSession";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/* ───────────────── Types בסיס ───────────────── */

type LiveKind = "public" | "one_to_one" | "friends" | "friends_of_friends";

type RawLiveDoc = {
  _id: any;
  userId: any;
  userName?: string;
  userImage?: string;
  isAdmin?: boolean;
  lat?: number;
  lon?: number;
  areaName?: string;
  kind?: LiveKind | string;
  startedAt?: Date | string;
  lastPingAt?: Date | string;
  blocked?: boolean;
  roomTag?: string;
};

type LiveItem = {
  _id: string;
  userId: string;
  userName: string;
  userImage: string;
  isAdmin: boolean;
  lat?: number;
  lon?: number;
  areaName: string;
  kind: LiveKind;
  startedAt?: string;
  lastPingAt?: string;
  distanceKm: number | null;
  distanceLabel: string | null;
  isMe: boolean;
  isNearby: boolean;
  isVeryClose: boolean;
  freshnessMinutes: number | null;
  freshnessLabel: string;
  roomTag?: string | null;
};

type FiltersConfig = {
  radiusM: number;
  maxRadiusM: number;
  minRadiusM: number;
  wantAll: boolean;
  onlyNearby: boolean;
  includeBlocked: boolean;
  includeInactive: boolean;
  maxMinutesAgo: number | null;
  kinds: LiveKind[] | null;
  sortBy: "distance" | "recency" | "adminsFirst" | "meFirst" | "mixed";
  limit: number;
  hardLimit: number;
};

type CursorPayload = {
  lastPingAt: string;
  id: string;
};

type AreaGroup = {
  areaName: string;
  count: number;
  items: LiveItem[];
};

type Meta = {
  ok: boolean;
  totalItems: number;
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  serverNow: string;
  requestDurationMs: number;
  filters: FiltersConfig;
  myLocation: { lat: number; lon: number } | null;
  isSuper: boolean;
  meId: string | null;
  meEmail: string | null;
  areas: AreaGroup[];
};

/* ───────────────── Session helpers ───────────────── */

async function readSession() {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    return await getServerSession(authOptions);
  } catch (e) {
    console.error("[LIVE.LIST] readSession error:", e);
    return null;
  }
}

function uid(user: any): string | null {
  if (!user) return null;
  const id = user.id || user._id || user.sub;
  return id ? String(id) : null;
}

function isSuperAdminEmail(email?: string | null) {
  if (!email) return false;
  const list = String(process.env.SUPERADMINS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/* ───────────────── Response helper ───────────────── */

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers || {}),
    },
  });
}

/* ───────────────── Utils – parsing ───────────────── */

function toNum(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toNumOrNull(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseBool(v: string | null): boolean {
  if (!v) return false;
  const low = v.toLowerCase();
  return low === "1" || low === "true" || low === "yes";
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function parseKinds(raw: string | null): LiveKind[] | null {
  if (!raw) return null;
  const allowed: LiveKind[] = [
    "public",
    "one_to_one",
    "friends",
    "friends_of_friends",
  ];
  const arr = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as LiveKind[];
  const filtered = arr.filter((k) => allowed.includes(k));
  return filtered.length ? filtered : null;
}

function parseSortBy(raw: string | null): FiltersConfig["sortBy"] {
  if (!raw) return "mixed";
  const v = raw.toLowerCase();
  if (v === "distance") return "distance";
  if (v === "recency") return "recency";
  if (v === "adminsfirst") return "adminsFirst";
  if (v === "mefirst") return "meFirst";
  if (v === "mixed") return "mixed";
  return "mixed";
}

function parseCursor(raw: string | null): CursorPayload | null {
  if (!raw) return null;
  try {
    const jsonStr = Buffer.from(raw, "base64").toString("utf8");
    const obj = JSON.parse(jsonStr) as CursorPayload;
    if (!obj || !obj.lastPingAt || !obj.id) return null;
    const dt = new Date(obj.lastPingAt);
    if (Number.isNaN(dt.getTime())) return null;
    return obj;
  } catch {
    return null;
  }
}

function encodeCursor(payload: CursorPayload | null): string | null {
  if (!payload) return null;
  try {
    const jsonStr = JSON.stringify(payload);
    return Buffer.from(jsonStr, "utf8").toString("base64");
  } catch {
    return null;
  }
}

/* ───────────────── Utils – geo & time ───────────────── */

function calcDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // ק"מ
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function distanceLabel(km: number | null): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 0.05) return "ממש לידך";
  if (km < 0.2) return "מאוד קרוב";
  if (km < 0.5) return "עד חצי ק״מ";
  if (km < 1) return "עד 1 ק״מ";
  if (km < 2) return "עד 2 ק״מ";
  if (km < 5) return "עד 5 ק״מ";
  return `${km.toFixed(1)} ק״מ ממך`;
}

function minutesDiffFromNow(d: Date | string | undefined): number | null {
  if (!d) return null;
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return null;
  return (Date.now() - dt.getTime()) / 1000 / 60;
}

function freshnessLabel(minutes: number | null): string {
  if (minutes == null || !Number.isFinite(minutes)) return "לא ידוע";
  if (minutes < 1) return "עכשיו";
  if (minutes < 3) return "לפני רגע";
  if (minutes < 10) return "פעיל";
  if (minutes < 30) return "אולי עדיין מחובר";
  return "כנראה לא פעיל";
}

/* ───────────────── Utils – קיבוץ לפי אזור ───────────────── */

function groupByArea(items: LiveItem[]): AreaGroup[] {
  const map = new Map<string, LiveItem[]>();
  for (const item of items) {
    const key = item.areaName || "ללא אזור";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }

  const groups: AreaGroup[] = [];
  for (const [areaName, arr] of map.entries()) {
    groups.push({
      areaName,
      count: arr.length,
      items: arr,
    });
  }

  // אזורים עם הכי הרבה תחילה
  groups.sort(
    (a, b) =>
      b.count - a.count || a.areaName.localeCompare(b.areaName, "he-IL"),
  );
  return groups;
}

/* ───────────────── GET /api/club/live/list ───────────────── */
/**
 * דוגמה לפרמטרים:
 *   /api/club/live/list?lat=31.9&lon=34.8&radius=5000
 *   &kinds=public,friends
 *   &sortBy=mixed
 *   &maxMinutesAgo=10
 *   &limit=80
 *   &cursor=...
 *   &onlyNearby=1
 *   &all=1          // להתעלם מרדיוס, בעיקר לסופר אדמין
 */
export async function GET(req: NextRequest) {
  const requestStartedAt = Date.now();

  try {
    await connectDB();

    const session = await readSession();
    const meId = uid(session?.user);
    const meEmail = (session?.user as any)?.email as string | undefined;
    const isSuper = isSuperAdminEmail(meEmail);

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const latRaw = searchParams.get("lat");
    const lonRaw = searchParams.get("lon");
    const radiusRaw = searchParams.get("radius");
    const wantAll = parseBool(searchParams.get("all"));
    const onlyNearby = parseBool(searchParams.get("onlyNearby"));
    const includeBlockedReq = parseBool(searchParams.get("includeBlocked"));
    const includeInactiveReq = parseBool(searchParams.get("includeInactive"));
    const maxMinutesAgoRaw = toNumOrNull(searchParams.get("maxMinutesAgo"));
    const kinds = parseKinds(searchParams.get("kinds"));
    const sortBy = parseSortBy(searchParams.get("sortBy"));
    const debug = parseBool(searchParams.get("debug"));
    const cursor = parseCursor(searchParams.get("cursor"));
    const limitRaw = toNumOrNull(searchParams.get("limit"));

    const lat = latRaw != null ? Number(latRaw) : NaN;
    const lon = lonRaw != null ? Number(lonRaw) : NaN;
    const haveCoords = Number.isFinite(lat) && Number.isFinite(lon);

    const radius = radiusRaw != null ? Number(radiusRaw) : 2000;
    const safeRadius = Number.isFinite(radius) ? radius : 2000;

    const filters: FiltersConfig = {
      radiusM: safeRadius,
      maxRadiusM: 20_000,
      minRadiusM: 200,
      wantAll,
      onlyNearby,
      includeBlocked: isSuper && includeBlockedReq,
      includeInactive: isSuper && includeInactiveReq,
      maxMinutesAgo:
        maxMinutesAgoRaw != null && Number.isFinite(maxMinutesAgoRaw)
          ? maxMinutesAgoRaw
          : 5,
      kinds,
      sortBy,
      limit: clamp(limitRaw ?? 100, 1, 200),
      hardLimit: 200,
    };

    const now = Date.now();

    console.log("[LIVE.LIST] query:", {
      lat: haveCoords ? lat : null,
      lon: haveCoords ? lon : null,
      radius: filters.radiusM,
      wantAll: filters.wantAll,
      onlyNearby: filters.onlyNearby,
      includeBlocked: filters.includeBlocked,
      includeInactive: filters.includeInactive,
      maxMinutesAgo: filters.maxMinutesAgo,
      kinds: filters.kinds,
      sortBy: filters.sortBy,
      limit: filters.limit,
      cursor: cursor ? { lastPingAt: cursor.lastPingAt, id: cursor.id } : null,
      isSuper,
      meId,
      meEmail,
    });

    /* ───────── בניית קוורי למונגו ───────── */

    const baseQuery: any = {
      active: true,
      blocked: filters.includeBlocked
        ? { $in: [true, false, null] }
        : { $ne: true },
    };

    // זמן אחרון – ברירת מחדל 5 דקות, או maxMinutesAgo מהקליינט
    if (!filters.includeInactive && filters.maxMinutesAgo != null) {
      const since = new Date(now - filters.maxMinutesAgo * 60 * 1000);
      baseQuery.lastPingAt = { $gt: since };
    }

    if (filters.kinds && filters.kinds.length > 0) {
      baseQuery.kind = { $in: filters.kinds };
    }

    // פאג'ינציה לפי lastPingAt + _id
    if (cursor) {
      const cursorDate = new Date(cursor.lastPingAt);
      if (!Number.isNaN(cursorDate.getTime())) {
        baseQuery.$or = [
          { lastPingAt: { $lt: cursorDate } },
          { lastPingAt: cursorDate, _id: { $lt: cursor.id } },
        ];
      }
    }

    // חיתוך רך לפי lat/lon – bounding box בסיסי
    const query: any = { ...baseQuery };

    if (!isSuper || !filters.wantAll) {
      // רק אם יש קואורדינטות – אחרת לא מסננים לפי מיקום
      if (haveCoords) {
        const clippedRadius = clamp(
          filters.radiusM,
          filters.minRadiusM,
          filters.maxRadiusM,
        );
        const deltaDeg = clippedRadius / 111_000; // 1° ≈ 111km
        query.lat = { $gt: lat - deltaDeg, $lt: lat + deltaDeg };
        query.lon = { $gt: lon - deltaDeg, $lt: lon + deltaDeg };
      }
    }

    /* ───────── שליפה ממונגו ───────── */

    const mongoLimit = filters.limit;
    const rows: RawLiveDoc[] = await LiveSession.find(query)
      .sort({ lastPingAt: -1, _id: -1 })
      .limit(mongoLimit)
      .lean()
      .exec();

    /* ───────── עיבוד תוצאות ───────── */

    const items: LiveItem[] = rows.map((r) => {
      let distanceKm: number | null = null;
      if (
        haveCoords &&
        typeof r.lat === "number" &&
        Number.isFinite(r.lat) &&
        typeof r.lon === "number" &&
        Number.isFinite(r.lon)
      ) {
        distanceKm = calcDistanceKm(lat, lon, r.lat, r.lon);
      }

      const startedIso = r.startedAt
        ? new Date(r.startedAt).toISOString()
        : undefined;
      const lastPingIso = r.lastPingAt
        ? new Date(r.lastPingAt).toISOString()
        : undefined;

      const freshMin = minutesDiffFromNow(lastPingIso);
      const freshLbl = freshnessLabel(freshMin);

      const distLbl = distanceLabel(distanceKm);

      const isMe = meId ? String(r.userId) === String(meId) : false;

      const isNearby =
        distanceKm != null && Number.isFinite(distanceKm)
          ? distanceKm <= filters.radiusM / 1000
          : false;

      const isVeryClose =
        distanceKm != null && Number.isFinite(distanceKm)
          ? distanceKm <= 0.3
          : false;

      return {
        _id: String(r._id),
        userId: String(r.userId),
        userName: r.userName || "",
        userImage: r.userImage || "",
        isAdmin: !!r.isAdmin,
        lat:
          typeof r.lat === "number" && Number.isFinite(r.lat)
            ? r.lat
            : undefined,
        lon:
          typeof r.lon === "number" && Number.isFinite(r.lon)
            ? r.lon
            : undefined,
        areaName: r.areaName || "",
        kind: (r.kind as LiveKind) || "public",
        startedAt: startedIso,
        lastPingAt: lastPingIso,
        distanceKm,
        distanceLabel: distLbl,
        isMe,
        isNearby,
        isVeryClose,
        freshnessMinutes: freshMin,
        freshnessLabel: freshLbl,
        roomTag: r.roomTag || null,
      };
    });

    /* ───────── סינון צד-שרת נוסף (אם צריך) ───────── */

    let filtered = items;

    if (filters.onlyNearby && haveCoords) {
      filtered = filtered.filter((it) => it.isNearby || it.isVeryClose);
    }

    // סדר לפי sortBy
    filtered = [...filtered].sort((a, b) => {
      // קודם כל – אני עצמי
      if (filters.sortBy === "meFirst" || filters.sortBy === "mixed") {
        if (a.isMe && !b.isMe) return -1;
        if (!a.isMe && b.isMe) return 1;
      }

      // אחרי זה אדמינים
      if (filters.sortBy === "adminsFirst" || filters.sortBy === "mixed") {
        const aAdmin = a.isAdmin ? 0 : 1;
        const bAdmin = b.isAdmin ? 0 : 1;
        if (aAdmin !== bAdmin) return aAdmin - bAdmin;
      }

      if (filters.sortBy === "distance" || filters.sortBy === "mixed") {
        const ad = Number.isFinite(a.distanceKm ?? NaN)
          ? (a.distanceKm as number)
          : 9999;
        const bd = Number.isFinite(b.distanceKm ?? NaN)
          ? (b.distanceKm as number)
          : 9999;
        if (ad !== bd) return ad - bd;
      }

      // ברירת מחדל – לפי recency
      const aPing = a.lastPingAt ? new Date(a.lastPingAt).getTime() : 0;
      const bPing = b.lastPingAt ? new Date(b.lastPingAt).getTime() : 0;
      return bPing - aPing;
    });

    // הגבלה סופית
    if (filtered.length > filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    /* ───────── Cursor הבא ───────── */

    let hasMore = false;
    let nextCursor: string | null = null;

    if (filtered.length === filters.limit) {
      const last = filtered[filtered.length - 1];
      if (last.lastPingAt) {
        hasMore = true;
        nextCursor = encodeCursor({
          lastPingAt: last.lastPingAt,
          id: last._id,
        });
      }
    }

    /* ───────── קיבוץ לפי אזור ───────── */

    const groups = groupByArea(filtered);

    /* ───────── Meta ───────── */

    const requestDurationMs = Date.now() - requestStartedAt;
    const meta: Meta = {
      ok: true,
      totalItems: filtered.length,
      limit: filters.limit,
      hasMore,
      nextCursor,
      serverNow: new Date().toISOString(),
      requestDurationMs,
      filters,
      myLocation:
        haveCoords && Number.isFinite(lat) && Number.isFinite(lon)
          ? { lat, lon }
          : null,
      isSuper,
      meId,
      meEmail: meEmail ?? null,
      areas: groups,
    };

    if (debug) {
      console.log("[LIVE.LIST] meta:", {
        totalItems: meta.totalItems,
        limit: meta.limit,
        hasMore: meta.hasMore,
        requestDurationMs: meta.requestDurationMs,
        areas: meta.areas.map((g) => ({
          areaName: g.areaName,
          count: g.count,
        })),
      });
    }

    // כדי לשמור תאימות – נשאיר { ok, items } כמו שהיה,
    // ונוסיף meta למי שרוצה להשתמש.
    return j({
      ok: true,
      items: filtered,
      meta,
    });
  } catch (e: any) {
    console.error("[LIVE.LIST.GET] error:", e);
    return j(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "production"
            ? "server_error"
            : e?.message || "unknown_error",
      },
      { status: 500 },
    );
  }
}
