import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { PLANS, PlanTier } from "@/lib/payments/types";
import { createPayment } from "@/lib/payments/db";
import { cardcomCreateSession } from "@/lib/payments/providers/cardcom";
import { paypalCreateOrder } from "@/lib/payments/providers/paypal";

// אתה אמור לזהות משתמש מחובר כאן – דוגמה:
async function getUserIdFromSession(req: NextRequest) {
  // TODO: החלף למנגנון האמיתי שלך
  return "me@example.com";
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromSession(req);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const plan = (body?.plan || "plus") as PlanTier;
    const provider = (body?.provider || "cardcom") as "cardcom" | "paypal";
    if (!PLANS[plan]) {
      return NextResponse.json(
        { ok: false, error: "bad_plan" },
        { status: 400 }
      );
    }

    const pmid = "pm_" + randomUUID();
    const amount = PLANS[plan].price;
    const currency = process.env.CURRENCY || "ILS";

    // צור רשומת תשלום במצב pending
    await createPayment({
      pmid,
      userId,
      provider,
      plan,
      amount,
      currency,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (provider === "cardcom") {
      const { payUrl, lowProfileCode } = await cardcomCreateSession({
        userId,
        plan,
        pmid,
      });
      return NextResponse.json({
        ok: true,
        url: payUrl,
        pmid,
        providerRef: lowProfileCode,
      });
    } else {
      const { approveUrl, orderId } = await paypalCreateOrder({
        userId,
        plan,
        pmid,
      });
      return NextResponse.json({
        ok: true,
        url: approveUrl,
        pmid,
        providerRef: orderId,
      });
    }
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "server_error" },
      { status: 500 }
    );
  }
}
