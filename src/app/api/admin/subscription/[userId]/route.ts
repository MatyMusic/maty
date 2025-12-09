import { NextRequest, NextResponse } from "next/server";
import { setUserSubscription } from "@/lib/payments/db";
import type { PlanTier } from "@/lib/payments/types";
import { addMonths, PLANS } from "@/lib/payments/types";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  // TODO: requireAdmin(req)
  const { userId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const tier = (body?.tier || "plus") as PlanTier;
  const months = Number(body?.months || PLANS[tier].months);

  const until = addMonths(new Date(), months).toISOString();
  await setUserSubscription(userId, {
    status: "active",
    tier,
    until,
    provider: body?.provider || "manual",
    lastPaymentId: body?.pmid || "",
  });

  return NextResponse.json({ ok: true });
}
