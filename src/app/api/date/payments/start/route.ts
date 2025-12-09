// src/app/api/date/payments/start/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import { startPayment } from "@/lib/payments";
import { getPlanPrice, type Interval, type PlanKey } from "@/lib/date/plans";
import { dateCollections } from "@/lib/date/db";

export async function POST(req: Request) {
  const s = await getServerSession(authConfig);
  if (!s?.user?.email)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );

  const { planKey, interval } = await req.json().catch(() => ({} as any));
  const plan: PlanKey = planKey;
  const per: Interval = interval;

  if (!["plus", "pro"].includes(plan) || !["month", "year"].includes(per)) {
    return NextResponse.json(
      { ok: false, error: "bad_request" },
      { status: 400 }
    );
  }
  const price = getPlanPrice(plan, per);
  if (!price)
    return NextResponse.json(
      { ok: false, error: "plan_not_configured" },
      { status: 400 }
    );

  const userId = (s.user as any).id || s.user.email!;
  const email = s.user.email!;
  const name = (s.user.name as string) || undefined;

  // פותחים/מעדכנים רשומת subscription במצב pending
  const { subscriptions } = await dateCollections();
  const orderId = `${userId}-${Date.now()}`; // מזהה זמני
  const now = new Date().toISOString();

  await subscriptions.updateOne(
    { userId },
    {
      $set: {
        userId,
        planKey: plan,
        status: "pending",
        provider: process.env.PAYMENTS_PROVIDER || "custom",
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";
  const ret = await startPayment({
    userId,
    email,
    name,
    plan,
    interval: per,
    orderId,
    returnUrl: `${appUrl}/api/date/payments/return`,
    notifyUrl: `${appUrl}/api/date/payments/notify`,
    cancelUrl: `${appUrl}/date/profile?tab=billing&canceled=1`,
  });

  if (!ret.ok)
    return NextResponse.json({ ok: false, error: ret.error }, { status: 400 });
  return NextResponse.json({ ok: true, url: ret.url });
}
