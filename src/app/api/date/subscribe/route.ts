// src/app/api/date/subscribe/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import { upsertProfile, type Tier } from "@/lib/db/date-repo";

function json(data: any, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user)
      return json({ ok: false, error: "unauthorized" }, { status: 401 });

    const { plan } = await req.json().catch(() => ({}));
    const allowed: Tier[] = ["plus", "pro", "vip"];
    if (!allowed.includes(plan)) {
      return json({ ok: false, error: "invalid_plan" }, { status: 400 });
    }

    const userId = (session.user as any).id || session.user.email!;
    const exp = new Date();
    exp.setMonth(exp.getMonth() + 1); // חודש ראשון
    const expiresAt = exp.toISOString();

    await upsertProfile(userId, {
      dateEnabled: true, // לוודא opt-in
      subscription: { status: "active", tier: plan, expiresAt },
    });

    return json({ ok: true });
  } catch (e) {
    console.error("[POST /api/date/subscribe] error:", e);
    return json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
