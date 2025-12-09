import { getCurrentUserId } from "@/lib/auth/currentUserId";
import { acceptIncomingVideoRequest } from "@/lib/db/date-video-request";
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

    const { peerId } = await req.json().catch(() => ({ peerId: null as any }));
    if (!peerId || typeof peerId !== "string") {
      return NextResponse.json(
        { ok: false, error: "peerId is required" },
        { status: 400 },
      );
    }

    const vr = await acceptIncomingVideoRequest(me, peerId);
    if (!vr) {
      return NextResponse.json(
        { ok: false, error: "no_pending_request" },
        { status: 404 },
      );
    }

    // כאן בעתיד נוסיף SOCKET למי ששלח את הבקשה

    return NextResponse.json({
      ok: true,
      status: {
        state: "accepted",
        roomId: vr.roomId,
      },
    });
  } catch (err: any) {
    console.error("video-request accept error", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "server_error" },
      { status: 500 },
    );
  }
}
