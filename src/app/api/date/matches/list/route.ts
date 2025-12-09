import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { listMatches } from "@/lib/db/date-like";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = (s.user as any).id || s.user.email!;
  const ids = await listMatches(me);

  const db = (await clientPromise).db(process.env.MONGODB_DB || "maty-music");
  const P = db.collection("date_profiles");
  const rows = await P.find({ userId: { $in: ids } })
    .project({ userId: 1, displayName: 1, avatarUrl: 1, city: 1, country: 1 })
    .toArray();

  return NextResponse.json({ ok: true, items: rows });
}
