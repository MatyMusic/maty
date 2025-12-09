// src/app/api/club/live/session/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import connectDB from "@/lib/db/mongoose";
import LiveSession from "@/models/club/LiveSession";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

/* ───────── עזרי session ───────── */

async function readSession() {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}

function uid(user: any): string | null {
  if (!user) return null;
  const id = (user as any).id || (user as any)._id || (user as any).sub;
  return id ? String(id) : null;
}

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers || {}),
    },
  });
}

/* ───────── GET – השידור החי של המשתמש ───────── */

export async function GET() {
  try {
    await connectDB();
    const session = await readSession();
    const userId = uid(session?.user);
    if (!userId) {
      return j({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const live = await LiveSession.findOne({
      userId,
      active: true,
      blocked: false,
    })
      .lean()
      .exec();

    return j({ ok: true, item: live || null });
  } catch (e: any) {
    console.error("[LIVE.SESSION.GET] error:", e);
    return j(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "production" ? "server_error" : e?.message,
      },
      { status: 500 },
    );
  }
}

/* ───────── פונקציית עזר: Reverse Geo לתיוג areaName ───────── */

async function resolveAreaNameFromGeo(
  req: NextRequest,
  lat: number,
  lon: number,
  fallback: string,
): Promise<string> {
  let areaName = fallback?.trim() || "";

  try {
    const origin =
      (req.nextUrl && req.nextUrl.origin) ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const url = `${origin}/api/geo/reverse?lat=${lat}&lon=${lon}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.warn("[LIVE.SESSION.POST] geo reverse non-OK:", res.status);
      return areaName || "מיקום לא ידוע";
    }

    const geo = await res.json().catch(() => null as any);
    if (!geo || geo.ok === false) {
      return areaName || "מיקום לא ידוע";
    }

    const label: string =
      geo.label ||
      [geo.area, geo.city].filter(Boolean).join(" • ") ||
      geo.city ||
      geo.area ||
      "";

    if (label && typeof label === "string") {
      areaName = label;
    }
  } catch (err) {
    console.warn("[LIVE.SESSION.POST] geo reverse failed:", err);
  }

  return areaName || "מיקום לא ידוע";
}

/* ───────── POST – יציאה לשידור חי / עדכון מיקום ───────── */
/**
 * body:
 *  - lat, lon, areaName (לא חובה – ימולא אוטומטית לפי מיקום)
 *  - radiusMeters
 *  - kind: "public" | "one_to_one" | "friends"
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await readSession();
    const userId = uid(session?.user);
    if (!userId) {
      return j({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as any;

    const lat =
      typeof body.lat === "number" ? body.lat : Number(body.lat ?? NaN);
    const lon =
      typeof body.lon === "number" ? body.lon : Number(body.lon ?? NaN);
    const rawAreaName =
      typeof body.areaName === "string" ? body.areaName.trim() : "";
    const radiusMeters =
      typeof body.radiusMeters === "number"
        ? body.radiusMeters
        : Number(body.radiusMeters ?? 500);

    const kind: "public" | "one_to_one" | "friends" =
      body.kind === "one_to_one" || body.kind === "friends"
        ? body.kind
        : "public";

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return j({ ok: false, error: "missing_location" }, { status: 400 });
    }

    // 🎯 מיקום "אמיתי" – תיוג עיר/אזור אוטומטי
    const areaName = await resolveAreaNameFromGeo(req, lat, lon, rawAreaName);

    // משוך מידע על המשתמש
    let userName = "";
    let userImage = "";
    let isAdmin = false;

    try {
      const userDoc = await User.findOne(
        { _id: userId },
        { name: 1, image: 1, avatarUrl: 1, role: 1, isAdmin: 1 },
      )
        .lean()
        .exec();

      userName =
        (userDoc as any)?.name ||
        (session?.user as any)?.name ||
        (session?.user as any)?.email ||
        "";
      userImage =
        (userDoc as any)?.avatarUrl ||
        (userDoc as any)?.image ||
        (session?.user as any)?.image ||
        "";
      isAdmin =
        (userDoc as any)?.isAdmin === true ||
        (userDoc as any)?.role === "admin" ||
        (session?.user as any)?.role === "admin";
    } catch (e) {
      console.warn("[LIVE.SESSION.POST] failed to fetch userDoc:", e);
    }

    // חפש אם כבר יש שידור חי פעיל למשתמש
    let live = await LiveSession.findOne({
      userId,
      active: true,
    }).exec();

    if (!live) {
      live = new LiveSession({
        userId,
        userName,
        userImage,
        isAdmin,
        lat,
        lon,
        areaName,
        radiusMeters: Number.isFinite(radiusMeters) ? radiusMeters : 500,
        kind,
        active: true,
        blocked: false,
        startedAt: new Date(),
        lastPingAt: new Date(),
      });
    } else {
      live.lat = lat;
      live.lon = lon;
      live.areaName = areaName || live.areaName;
      live.radiusMeters = Number.isFinite(radiusMeters)
        ? radiusMeters
        : live.radiusMeters;
      live.kind = kind;
      live.userName = userName || live.userName;
      live.userImage = userImage || live.userImage;
      live.isAdmin = isAdmin;
      live.lastPingAt = new Date();
    }

    await live.save();
    return j({ ok: true, item: live.toObject() });
  } catch (e: any) {
    console.error("[LIVE.SESSION.POST] error:", e);
    return j(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "production" ? "server_error" : e?.message,
      },
      { status: 500 },
    );
  }
}

/* ───────── DELETE – עצירת שידור חי ───────── */

export async function DELETE() {
  try {
    await connectDB();
    const session = await readSession();
    const userId = uid(session?.user);
    if (!userId) {
      return j({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    await LiveSession.updateMany(
      { userId, active: true },
      { $set: { active: false } },
    ).exec();

    return j({ ok: true });
  } catch (e: any) {
    console.error("[LIVE.SESSION.DELETE] error:", e);
    return j(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "production" ? "server_error" : e?.message,
      },
      { status: 500 },
    );
  }
}
