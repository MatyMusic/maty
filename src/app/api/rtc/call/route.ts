// src/app/api/rtc/call/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import connectDB from "@/lib/db/mongoose";
import RtcSignal from "@/models/RtcSignal";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

async function readSession() {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}

function uid(user: any | null | undefined): string | null {
  if (!user) return null;
  const anyUser = user as any;
  if (anyUser.id) return String(anyUser.id);
  if (anyUser._id) return String(anyUser._id);
  return null;
}

/**
 * POST /api/rtc/call
 * body:
 *  - targetUserId: string  (למי אני מתקשר)
 *  - roomId?: string       (לא חובה, אם אין – ניצור אחד)
 *
 * מחזיר:
 *  { ok: true, roomId }
 *
 * בפועל מייצר סיגנל kind:"ring" בתור "שיחה נכנסת" לצד השני.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await readSession();
    const meId = uid(session?.user);
    if (!meId) {
      return j({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
      targetUserId?: string;
      roomId?: string | null;
    } | null;

    if (!body || !body.targetUserId) {
      return j({ ok: false, error: "missing_targetUserId" }, { status: 400 });
    }

    const targetUserId = String(body.targetUserId);
    const roomId =
      body.roomId || `${meId}_${targetUserId}_${Date.now().toString(36)}`;

    const payload = {
      type: "incoming_call",
      fromUserId: meId,
      targetUserId,
      roomId,
      at: new Date().toISOString(),
    };

    await RtcSignal.create({
      roomId,
      fromUserId: meId,
      toUserId: targetUserId,
      kind: "ring",
      payload,
    });

    return j({ ok: true, roomId });
  } catch (e: any) {
    console.error("[RTC.CALL.POST] error:", e);
    return j(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "production"
            ? "server_error"
            : (e?.message ?? "unknown_error"),
      },
      { status: 500 },
    );
  }
}
