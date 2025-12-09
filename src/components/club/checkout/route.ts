// src/app/api/club/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
// אם יש לך next-auth: אפשר לדרוש התחברות כאן עם getServerSession

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const stripe = new Stripe(STRIPE_SECRET, { apiVersion: "2024-06-20" });

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const priceId = searchParams.get("priceId") || (await req.json())?.priceId;
    if (!priceId)
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${SITE_URL}/club?status=success`,
      cancel_url: `${SITE_URL}/club?status=cancel`,
      // customer_email: אם רוצים להזריק אימייל כשאין התחברות
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e) {
    console.error("checkout error", e);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
