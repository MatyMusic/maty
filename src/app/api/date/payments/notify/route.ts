// src/app/api/date/payments/notify/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { parseIncoming } from "@/lib/payments";
import { dateCollections } from "@/lib/date/db";

export async function POST(req: Request) {
  const contentType = (req.headers.get("content-type") || "").toLowerCase();
  let raw: any = {};
  if (contentType.includes("application/json")) {
    raw = await req.json().catch(() => ({}));
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.text();
    raw = Object.fromEntries(new URLSearchParams(form).entries());
  } else {
    // נסה כ־querystring
    const txt = await req.text().catch(() => "");
    try {
      raw = JSON.parse(txt);
    } catch {
      raw = Object.fromEntries(new URLSearchParams(txt).entries());
    }
  }

  const payload = parseIncoming(raw);
  const { subscriptions } = await dateCollections();
  const now = new Date();
  const monthMs = 30 * 24 * 3600 * 1000;
  const yearMs = 365 * 24 * 3600 * 1000;

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
    } else if (payload.status === "canceled" && payload.userId) {
      await subscriptions.updateOne(
        { userId: payload.userId },
        { $set: { status: "canceled", updatedAt: now.toISOString() } }
      );
    } else if (payload.status === "failed" && payload.userId) {
      await subscriptions.updateOne(
        { userId: payload.userId },
        { $set: { status: "failed", updatedAt: now.toISOString() } }
      );
    }
  } catch (e) {
    // בולעים — לא מחזירים 500 לסולק
  }

  return NextResponse.json({ ok: true });
}
