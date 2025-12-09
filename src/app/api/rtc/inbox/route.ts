// src/app/api/rtc/inbox/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongoose";
import RtcSignal from "@/models/RtcSignal";
import User from "@/models/User";

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

function uid(user: any | null | undefined): string | null {
  if (!user) return null;
  const anyUser = user as any;
  if (anyUser.id) return String(anyUser.id);
  if (anyUser._id) return String(anyUser._id);
  return null;
}

/**
 * GET /api/rtc/inbox?since=TIMESTAMP
 *
 * מחזיר "צלצולים" נכנסים (kind: "ring") למשתמש הנוכחי.
 * since – מתי הפעם האחרונה שבדקת (מילישניות), ברירת מחדל 5 דקות אחורה.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return j({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const meId = uid(session.user);
    if (!meId) {
      return j({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sinceParam = searchParams.get("since");
    const since = sinceParam ? Number(sinceParam) : 0;
    const now = Date.now();

    const sinceDate = since > 0 ? new Date(since) : new Date(now - 5 * 60_000); // ברירת מחדל: 5 דקות אחורה

    const rings = await RtcSignal.find({
      toUserId: meId,
      kind: "ring",
      createdAt: { $gt: sinceDate },
    })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean()
      .exec();

    const fromIds = Array.from(new Set(rings.map((r) => String(r.fromUserId))));

    const users = await User.find(
      { _id: { $in: fromIds } },
      { name: 1, email: 1, image: 1 },
    )
      .lean()
      .exec();

    const usersMap = new Map<string, any>();
    for (const u of users) {
      usersMap.set(String(u._id), u);
    }

    const items = rings.map((r) => {
      const u = usersMap.get(String(r.fromUserId));
      const displayName =
        (u?.name as string | undefined) ||
        (u?.email as string | undefined) ||
        "משתמש";
      return {
        _id: String(r._id),
        roomId: r.roomId,
        fromUserId: String(r.fromUserId),
        toUserId: r.toUserId ? String(r.toUserId) : null,
        kind: r.kind,
        payload: r.payload ?? null,
        createdAt: r.createdAt?.toISOString?.() ?? new Date().toISOString(),
        fromName: displayName,
        fromImage: (u?.image as string | undefined) || null,
      };
    });

    return j({
      ok: true,
      now,
      items,
    });
  } catch (e: any) {
    console.error("[RTC.INBOX.GET] error:", e);
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
