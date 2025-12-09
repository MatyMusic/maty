// src/app/api/club/live/ping/route.ts
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
 * POST /api/club/live/ping
 *
 * Body (JSON / form):
 *  - lat, lon (אופציונלי)
 *  - camOn: boolean (האם מצלמה פעילה)
 *  - note: טקסט קצר (אופציונלי)
 *
 * אם אין סשן חי קיים – נפתח אחד בסיסי (auto-start).
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await readSession();
    const meId = uid(session?.user);

    if (!meId) {
      return j({ ok: false, error: "unauthorized" }, { status: 401 });
    }

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
    const camOnRaw = body.camOn ?? body.cameraOn ?? body.cam ?? null;
    const camOn =
      typeof camOnRaw === "boolean"
        ? camOnRaw
        : typeof camOnRaw === "string"
          ? ["1", "true", "yes", "on"].includes(camOnRaw.toLowerCase())
          : undefined;

    const note = (typeof body.note === "string" ? body.note : "")
      .trim()
      .slice(0, 240);

    const now = new Date();

    const update: any = {
      lastPingAt: now,
      active: true,
    };

    if (Number.isFinite(lat)) update.lat = lat;
    if (Number.isFinite(lon)) update.lon = lon;
    if (typeof camOn === "boolean") update.camOn = camOn;
    if (note) update.note = note;

    // ננסה לעדכן סשן קיים
    let doc = await LiveSession.findOneAndUpdate(
      { userId: meId, blocked: { $ne: true } },
      { $set: update, $setOnInsert: { createdAt: now } },
      { new: true, upsert: true },
    ).lean();

    return j({ ok: true, item: doc });
  } catch (e: any) {
    console.error("[LIVE.PING.POST] error:", e);
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
