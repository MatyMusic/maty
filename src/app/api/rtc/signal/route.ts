// src/app/api/rtc/signal/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import connectDB from "@/lib/db/mongoose";
import RtcSignal, { RtcSignalKind } from "@/models/RtcSignal";
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
 * GET /api/rtc/signal?roomId=XXX&since=TIMESTAMP
 *
 * מחזיר סיגנלים בחדר נתון מאז זמן מסוים.
 * מיועד לשני הצדדים (caller/callee) לצורך polling.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await readSession();
    const userId = uid(session?.user);
    if (!userId) {
      return j({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    const sinceParam = searchParams.get("since");
    const since = sinceParam ? Number(sinceParam) : 0;
    const now = Date.now();

    if (!roomId) {
      return j({ ok: false, error: "missing_roomId" }, { status: 400 });
    }

    const sinceDate = since > 0 ? new Date(since) : new Date(now - 60_000); // ברירת מחדל: דקה אחורה

    const docs = await RtcSignal.find({
      roomId,
      createdAt: { $gt: sinceDate },
    })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean()
      .exec();

    return j({
      ok: true,
      now,
      items: docs.map((d) => ({
        _id: String(d._id),
        roomId: d.roomId,
        fromUserId: d.fromUserId,
        toUserId: d.toUserId ?? null,
        kind: d.kind,
        payload: d.payload,
        createdAt: d.createdAt?.toISOString?.() ?? new Date().toISOString(),
      })),
    });
  } catch (e: any) {
    console.error("[RTC.SIGNAL.GET] error:", e);
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

/**
 * POST /api/rtc/signal
 * body:
 *  - roomId: string
 *  - kind: "offer" | "answer" | "candidate" | "bye" | "ring"
 *  - payload: any
 *  - toUserId?: string | null
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await readSession();
    const userId = uid(session?.user);
    if (!userId) {
      return j({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
      roomId?: string | null;
      kind?: RtcSignalKind | string;
      payload?: any;
      toUserId?: string | null;
    } | null;

    if (!body || !body.roomId || !body.kind) {
      return j({ ok: false, error: "missing_params" }, { status: 400 });
    }

    const kind = body.kind as RtcSignalKind;
    const allowedKinds: RtcSignalKind[] = [
      "offer",
      "answer",
      "candidate",
      "bye",
      "ring",
    ];
    if (!allowedKinds.includes(kind)) {
      return j({ ok: false, error: "invalid_kind" }, { status: 400 });
    }

    const doc = await RtcSignal.create({
      roomId: body.roomId,
      fromUserId: userId,
      toUserId: body.toUserId ?? null,
      kind,
      payload: body.payload ?? null,
    });

    // ניקוי ישן (לא חובה, אבל נחמד) – לדוגמה כל מה שיותר מ־יום
    const cutoff = new Date(Date.now() - 24 * 60 * 60_000);
    void RtcSignal.deleteMany({ createdAt: { $lt: cutoff } }).exec();

    return j({
      ok: true,
      item: {
        _id: String(doc._id),
        roomId: doc.roomId,
        fromUserId: doc.fromUserId,
        toUserId: doc.toUserId ?? null,
        kind: doc.kind,
        payload: doc.payload,
        createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
      },
    });
  } catch (e: any) {
    console.error("[RTC.SIGNAL.POST] error:", e);
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
