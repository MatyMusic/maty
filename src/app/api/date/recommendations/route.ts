// src/app/api/date/recommendations/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ensureDateIndexes, getRecommendationsFor } from "@/lib/db/dateMatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  const userId = (session as any).user.id || (session as any).user._id;

  await ensureDateIndexes();
  const recs = await getRecommendationsFor(userId, 6);
  return NextResponse.json({ ok: true, ...recs });
}
