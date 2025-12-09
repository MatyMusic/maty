import { getCurrentUserId } from "@/lib/auth/currentUserId";
import { rejectIncomingVideoRequest } from "@/lib/db/date-video-request";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUserId();
    if (!me) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const { peerId, reason } = await req.json().catch(() => ({
      peerId: null as any,
      reason: null as any,
    }));
    if (!peerId || typeof peerId !== "string") {
      return NextResponse.json(
        { ok: false, error: "peerId is required" },
        { status: 400 },
      );
    }

    const vr = await rejectIncomingVideoRequest(me, peerId, reason);
    if (!vr) {
      return NextResponse.json(
        { ok: false, error: "no_pending_request" },
        { status: 404 },
      );
    }

    // גם פה בעתיד SOCKET לצד השני

    return NextResponse.json({
      ok: true,
      status: {
        state: "rejected",
        reason: vr.reason || "declined",
      },
    });
  } catch (err: any) {
    console.error("video-request reject error", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "server_error" },
      { status: 500 },
    );
  }
}
