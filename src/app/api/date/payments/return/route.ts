// src/app/api/date/payments/return/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { parseIncoming } from "@/lib/payments";
import { dateCollections } from "@/lib/date/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const payload = parseIncoming(url.searchParams);
  const { subscriptions } = await dateCollections();

  const now = new Date();
  const monthMs = 30 * 24 * 3600 * 1000;
  const yearMs = 365 * 24 * 3600 * 1000;

  // ברירת יעד
  let redirectTo = "/date/profile?tab=billing";

  try {
    if (
      payload.status === "success" &&
      payload.userId &&
      payload.plan &&
      payload.interval
    ) {
      const end = new Date(
        now.getTime() + (payload.interval === "month" ? monthMs : yearMs)
      ).toISOString();
      await subscriptions.updateOne(
        { userId: payload.userId },
        {
          $set: {
            status: "active",
            planKey: payload.plan,
            currentPeriodEnd: end,
            lastTxnId: payload.transactionId || null,
            updatedAt: now.toISOString(),
          },
          $setOnInsert: { createdAt: now.toISOString() },
        },
        { upsert: true }
      );
      redirectTo = "/date/profile?tab=billing&success=1";
    } else if (payload.status === "canceled") {
      redirectTo = "/date/profile?tab=billing&canceled=1";
    } else {
      redirectTo = "/date/profile?tab=billing&failed=1";
    }
  } catch (e) {
    redirectTo = "/date/profile?tab=billing&failed=1";
  }

  return NextResponse.redirect(redirectTo);
}
