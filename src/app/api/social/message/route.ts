import { NextRequest, NextResponse } from "next/server";

// דמו: רק “OK”. החלף בהכנסה ל-DB/Socket שלך.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { toUserId, text } = body || {};
  if (!toUserId || !text) {
    return NextResponse.json(
      { ok: false, error: "נתונים חסרים" },
      { status: 400 },
    );
  }
  // TODO: persist message + notify (ws/pusher/socket)
  return NextResponse.json({ ok: true });
}
