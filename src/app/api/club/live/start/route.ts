// src/app/api/club/live/start/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import connectDB from "@/lib/db/mongoose";
import LiveSession from "@/models/club/LiveSession";
import { NextRequest, NextResponse } from "next/server";

/* ───────── Session helpers ───────── */

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

function isSuperAdminEmail(email?: string | null) {
  if (!email) return false;
  const list = String(process.env.SUPERADMINS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
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

/**
 * POST /api/club/live/start
 *
 * Body (JSON / form):
 *  - lat, lon (אופציונלי אך מומלץ)
 *  - title (כותרת לשידור)
 *  - note  (הערה קצרה)
 *  - visibility: "nearby" | "global" | "friends" (טקסט חופשי כרגע)
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await readSession();
    const meId = uid(session?.user);
    const meEmail = (session?.user as any)?.email as string | undefined;

    if (!meId) {
      return j({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const isSuper = isSuperAdminEmail(meEmail);
    const body =
      (await req.json().catch(async () => {
        try {
          const form = await req.formData();
          const o: any = {};
          for (const [k, v] of form.entries()) {
            if (typeof v === "string") o[k] = v;
          }
          return o;
        } catch {
          return {};
        }
      })) || {};

    const lat = Number(body.lat ?? body.latitude ?? NaN);
    const lon = Number(body.lon ?? body.longitude ?? NaN);
    const title = (typeof body.title === "string" ? body.title : "")
      .trim()
      .slice(0, 120);
    const note = (typeof body.note === "string" ? body.note : "")
      .trim()
      .slice(0, 240);
    const visibility =
      (typeof body.visibility === "string"
        ? body.visibility
        : "nearby"
      ).trim() || "nearby";

    const userName =
      (session?.user as any)?.name ||
      (session?.user as any)?.email ||
      "משתמש ללא שם";
    const userImage =
      (session?.user as any)?.image || (session?.user as any)?.avatarUrl || "";

    const isAdminRole =
      (session?.user as any)?.role === "admin" ||
      (session?.user as any)?.role === "superadmin" ||
      isSuper;

    const now = new Date();

    const update: any = {
      userId: meId,
      userName,
      userImage,
      isAdmin: !!isAdminRole,
      active: true,
      blocked: false,
      visibility,
      title: title || "שידור חי",
      note,
      lastPingAt: now,
    };

    if (Number.isFinite(lat)) update.lat = lat;
    if (Number.isFinite(lon)) update.lon = lon;

    const doc = await LiveSession.findOneAndUpdate(
      { userId: meId },
      {
        $set: update,
        $setOnInsert: {
          createdAt: now,
        },
      },
      { new: true, upsert: true },
    ).lean();

    return j({ ok: true, item: doc });
  } catch (e: any) {
    console.error("[LIVE.START.POST] error:", e);
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
