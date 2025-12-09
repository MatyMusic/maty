import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongoose";
import Consent from "@/models/Consent";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const normPair = (u1: string, u2: string) => (u1 < u2 ? [u1, u2] : [u2, u1]);

// GET /api/club/consents?peer=<userId>
export async function GET(req: NextRequest) {
  await connectDB();
  const s = await auth();
  if (!s?.user?.id)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  const me = s.user.id;
  const peer = new URL(req.url).searchParams.get("peer") || "";
  if (!peer)
    return NextResponse.json({ ok: false, error: "bad_peer" }, { status: 400 });
  const [a, b] = normPair(me, peer);
  const doc = await Consent.findOne({ a, b }).lean();
  const chatOk = !!doc?.types?.includes("chat");
  const videoOk = !!doc?.types?.includes("video");
  return NextResponse.json({ ok: true, chatOk, videoOk });
}

// POST /api/club/consents { peer, type: "chat"|"video" }
export async function POST(req: NextRequest) {
  await connectDB();
  const s = await auth();
  if (!s?.user?.id)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  const me = s.user.id;
  const { peer, type } = await req.json().catch(() => ({}));
  if (!peer || (type !== "chat" && type !== "video"))
    return NextResponse.json(
      { ok: false, error: "bad_input" },
      { status: 400 },
    );
  const [a, b] = normPair(me, peer);
  const doc = await Consent.findOneAndUpdate(
    { a, b },
    { $addToSet: { types: type }, $set: { grantedBy: me } },
    { upsert: true, new: true },
  ).lean();
  return NextResponse.json({ ok: true, types: doc.types });
}

// DELETE /api/club/consents { peer, type }
export async function DELETE(req: NextRequest) {
  await connectDB();
  const s = await auth();
  if (!s?.user?.id)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  const me = s.user.id;
  const { peer, type } = await req.json().catch(() => ({}));
  if (!peer || (type !== "chat" && type !== "video"))
    return NextResponse.json(
      { ok: false, error: "bad_input" },
      { status: 400 },
    );
  const [a, b] = normPair(me, peer);
  const doc = await Consent.findOneAndUpdate(
    { a, b },
    { $pull: { types: type }, $set: { grantedBy: me } },
    { new: true },
  ).lean();
  return NextResponse.json({ ok: true, types: doc?.types || [] });
}
