import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import clientPromise from "@/lib/mongodb";
import { rateCheck, rlKeyFromReq } from "@/lib/rate-limit";
import { DATE_CONF } from "@/lib/date-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = (s.user as any).id || s.user.email!;
  const ip = req.headers.get("x-forwarded-for") || req.ip || "";
  const okRL = await rateCheck(
    rlKeyFromReq({ path: "/api/date/report", userId: me, ip }),
    DATE_CONF.RATE_LIMIT.WINDOW_SEC,
    DATE_CONF.RATE_LIMIT.MAX_REQ
  );
  if (!okRL)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const targetUser = body?.userId as string | undefined;
  const messageId = body?.messageId as string | undefined;
  const reason = (body?.reason as string | undefined)?.slice(0, 500);
  if (!reason || (!targetUser && !messageId)) {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }

  const db = (await clientPromise).db(process.env.MONGODB_DB || "maty-music");
  const col = db.collection("date_reports");
  await col.insertOne({
    by: me,
    userId: targetUser || null,
    messageId: messageId || null,
    reason,
    createdAt: new Date(),
    status: "open",
  });
  return NextResponse.json({ ok: true });
}
