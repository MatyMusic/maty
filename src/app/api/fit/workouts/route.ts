// src/app/api/fit/workouts/route.ts
import { NextResponse } from "next/server";
import { listWorkouts, saveWorkout } from "@/lib/db/fit-repo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.user?.id || (session as any)?.user?.email;
  if (!userId)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  const items = await listWorkouts(userId);
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.user?.id || (session as any)?.user?.email;
  if (!userId)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );

  const body = await req.json().catch(() => ({}));
  const saved = await saveWorkout({ ...body, userId });
  return NextResponse.json({ ok: true, item: saved });
}
