import { getCurrentUserId } from "@/lib/auth/currentUserId";
import { getLastVideoRequestBetween } from "@/lib/db/date-video-request";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const me = await getCurrentUserId();
    if (!me) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const peerId = searchParams.get("peerId");
    if (!peerId) {
      return NextResponse.json(
        { ok: false, error: "peerId is required" },
        { status: 400 },
      );
    }

    const vr = await getLastVideoRequestBetween(me, peerId);
    if (!vr) {
      return NextResponse.json({ ok: true, status: { state: "none" } });
    }

    if (vr.state === "pending") {
      if (vr.from === me) {
        return NextResponse.json({
          ok: true,
          status: {
            state: "outgoing_pending",
            requestedAt: vr.requestedAt,
            roomId: vr.roomId,
          },
        });
      } else {
        return NextResponse.json({
          ok: true,
          status: {
            state: "incoming_pending",
            requestedAt: vr.requestedAt,
            fromUserId: vr.from,
            fromName: null,
            roomId: vr.roomId,
          },
        });
      }
    }

    if (vr.state === "accepted") {
      return NextResponse.json({
        ok: true,
        status: {
          state: "accepted",
          roomId: vr.roomId,
        },
      });
    }

    if (vr.state === "rejected" || vr.state === "cancelled") {
      return NextResponse.json({
        ok: true,
        status: {
          state: "rejected",
          reason: vr.reason || vr.state,
        },
      });
    }

    return NextResponse.json({ ok: true, status: { state: "none" } });
  } catch (err: any) {
    console.error("video-request status error", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "server_error" },
      { status: 500 },
    );
  }
}
