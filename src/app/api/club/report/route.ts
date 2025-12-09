import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { rateCheck, rlKeyFromReq } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const s = await auth();
  if (!s?.user?.id)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );

  const { targetUser, postId, reason } = await req.json().catch(() => ({}));
  if (!reason)
    return NextResponse.json(
      { ok: false, error: "bad_reason" },
      { status: 400 },
    );

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0] || "0";
  const key = rlKeyFromReq({ path: "/api/club/report", userId: s.user.id, ip });
  const ok = await rateCheck(key, 60, 5);
  if (!ok)
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 },
    );

  const db = (await clientPromise).db(process.env.MONGODB_DB || "maty-music");
  await db.collection("club_reports").insertOne({
    by: s.user.id,
    targetUser: targetUser || null,
    postId: postId || null,
    reason: String(reason).slice(0, 300),
    status: "open",
    createdAt: new Date(),
  });
  return NextResponse.json({ ok: true });
}
