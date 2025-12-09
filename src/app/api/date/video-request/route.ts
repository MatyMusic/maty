import { getCurrentUserId } from "@/lib/auth/currentUserId";
import {
  cancelOutgoingVideoRequest,
  upsertOutgoingVideoRequest,
} from "@/lib/db/date-video-request";
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
    if (peerId === me) {
      return NextResponse.json(
        { ok: false, error: "cannot_request_self" },
        { status: 400 },
      );
    }

    const vr = await upsertOutgoingVideoRequest(me, peerId);

    return NextResponse.json({
      ok: true,
      status: {
        state: "outgoing_pending",
        requestedAt: vr.requestedAt,
        roomId: vr.roomId,
      },
    });
  } catch (err: any) {
    console.error("video-request POST error", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "server_error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
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

    await cancelOutgoingVideoRequest(me, peerId);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("video-request DELETE error", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "server_error" },
      { status: 500 },
    );
  }
}
