// src/app/api/payments/checkout/route.ts
import { getPaypalClient, isPaypalConfigured } from "@/lib/paypal";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const provider = process.env.PAYMENTS_PROVIDER || "none";

  // אם PayPal לא הספק הנבחר – אין סיבה בכלל לגעת ב-PayPal
  if (provider !== "paypal") {
    return NextResponse.json(
      { ok: false, error: "PayPal provider is disabled on this deployment" },
      { status: 400 },
    );
  }

  if (!isPaypalConfigured) {
    return NextResponse.json(
      { ok: false, error: "PayPal is not configured (missing env vars)" },
      { status: 500 },
    );
  }

  const client = getPaypalClient();

  // כאן ממשיכים עם יצירת הזמנה, סכומים וכו'...
  // ...
  return NextResponse.json({ ok: true });
}
