import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST { userId } — חסימת משתמש (צד חד)
export async function POST(req: NextRequest) {
  const s = await auth();
  if (!s?.user?.id)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  const { userId } = await req.json().catch(() => ({}));
  if (!userId)
    return NextResponse.json({ ok: false, error: "bad_user" }, { status: 400 });

  const db = (await clientPromise).db(process.env.MONGODB_DB || "maty-music");
  await db
    .collection("club_blocks")
    .updateOne(
      { userId: s.user.id, blocked: userId },
      { $set: { at: new Date() } },
      { upsert: true },
    );

  return NextResponse.json({ ok: true });
}
