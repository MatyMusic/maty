// src/app/api/payments/activate/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import { upsertProfile } from "@/lib/db/date-repo";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const plan = String(body.plan || "pro").toLowerCase();
    const userId = (session.user as any).id || session.user.email!;

    await upsertProfile(userId, {
      subscription: { status: "active", tier: plan as any },
      online: true,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[payments/activate] error:", e);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}









