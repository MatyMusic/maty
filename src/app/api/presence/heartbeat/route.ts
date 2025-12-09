// src/app/api/presence/heartbeat/route.ts
import { NextResponse } from "next/server";
import { touchPresence, getOnlineCount } from "@/lib/liveStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ ok: false, error: "missing_uid" }, { status: 400 });
    }
    touchPresence(uid);
    return NextResponse.json({ ok: true, online: getOnlineCount() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "err" }, { status: 500 });
  }
}
