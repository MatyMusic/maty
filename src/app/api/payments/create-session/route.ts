// src/app/api/payments/create-session/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import authConfig from "@/auth-config";

// אם הספריות שלך קיימות — נשאר כמו אצלך
import {
  makePaymentDocBase,
  resolveCurrency,
  isProvider,
  type Provider,
  type Currency,
  type PlanTier,
} from "@/lib/payments/types";
import { createPayment, updatePayment } from "@/lib/payments/db";
import { cardcomCreateSession } from "@/lib/payments/providers/cardcom";
import { paypalCreateOrder } from "@/lib/payments/providers/paypal";

/** ---------- ENV helper (שמות מאוחדים + דיפולטים) ---------- */
const ENV = {
  BASE_URL:
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000",

  PAYMENTS_PROVIDER: (process.env.PAYMENTS_PROVIDER || "manual")
    .toLowerCase()
    .trim() as Provider | "manual",

  // מחירים לתכניות (אפשר מה-ENV או דיפולט קשיח)
  PLAN_PLUS_PRICE: Number(process.env.PLAN_PLUS_PRICE || 29),
  PLAN_PRO_PRICE: Number(process.env.PLAN_PRO_PRICE || 49),
  PLAN_VIP_PRICE: Number(process.env.PLAN_VIP_PRICE || 89),

  // Cardcom vars (רק לצורך בדיקות סביבה. ה-impl אצלך בספרייה)
  CARDCOM_TERMINAL_NUMBER:
    process.env.CARDCOM_TERMINAL_NUMBER || process.env.CARDCOM_TERMINAL || "",
  CARDCOM_USERNAME:
    process.env.CARDCOM_USERNAME || process.env.CARDCOM_USER || "",
  CARDCOM_API_KEY: process.env.CARDCOM_API_KEY || "",
};

/** מחזיר מחיר לפי תכנית כשאין amountOverride */
function priceForPlan(plan: PlanTier): number {
  switch (plan) {
    case "plus":
      return ENV.PLAN_PLUS_PRICE;
    case "pro":
      return ENV.PLAN_PRO_PRICE;
    case "vip":
      return ENV.PLAN_VIP_PRICE;
    default:
      return ENV.PLAN_PRO_PRICE;
  }
}

/**
 * נתמך:
 *  - plan:    "plus" | "pro" | "vip"
 *  - provider:"paypal" | "cardcom" | "manual"
 *  - catalog: "date" | "events"
 *  - currency:"ILS" | "USD" | "EUR" (resolve אוטומטי)
 *  - amount:  דריסת סכום ידנית
 *  - meta/src/feature: שדות חופשיים לדוחות
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const body = (await req.json().catch(() => ({}))) || {};

    const plan = String(body.plan || "pro").toLowerCase() as PlanTier;

    const providerReq = String(body.provider || "")
      .toLowerCase()
      .trim();
    const provider: Provider | "manual" = (
      isProvider(providerReq) ? providerReq : ENV.PAYMENTS_PROVIDER
    ) as any;

    const catalog: "date" | "events" =
      body.catalog === "events" ? "events" : "date";

    const amountOverride =
      typeof body.amount === "number" &&
      isFinite(body.amount) &&
      body.amount > 0
        ? Number(body.amount)
        : undefined;

    const userId =
      ((session.user as any).id as string) ||
      (session.user.email as string) ||
      "unknown";

    const currency = resolveCurrency(
      body.currency as string | null,
    ) as Currency;

    // pmid = מזהה תשלום מקומי שלנו
    const pmid = "pm_" + randomUUID();

    /** ---------- בסיס רשומת התשלום ---------- */
    const base = makePaymentDocBase({
      pmid,
      userId,
      provider: (provider === "manual" ? "paypal" : provider) as Provider, // לשמירה במסד עם ערך חוקי
      plan,
      amount: amountOverride ?? priceForPlan(plan),
      currency,
    });

    /** צור רשומת תשלום ראשונית (pending) */
    await createPayment({
      ...base,
      meta: {
        ...(body.meta || {}),
        catalog,
        src: body.src || "",
        feature: body.feature || "",
        amountOverride: amountOverride ?? null,
        createdBy: "api/payments/create-session",
      },
    });

    /** ---------- ספקים ---------- */

    // סימולציה (לוקאל/דמו)
    if (provider === "manual") {
      const sid = randomUUID();
      const url = `/date/checkout/simulated?sid=${encodeURIComponent(
        sid,
      )}&pmid=${encodeURIComponent(pmid)}&plan=${plan}&catalog=${catalog}`;
      // תאימות לאחור + שדה redirectUrl מודרני
      return NextResponse.json({ ok: true, url, redirectUrl: url, pmid });
    }

    // Cardcom – יצירת LowProfile/Session דרך הספרייה שלך
    if (provider === "cardcom") {
      // בדיקות סביבה בסיסיות כדי ליפול יפה
      if (
        !ENV.CARDCOM_TERMINAL_NUMBER ||
        !ENV.CARDCOM_USERNAME ||
        !ENV.CARDCOM_API_KEY
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "cardcom_env_missing (check CARDCOM_TERMINAL_NUMBER, CARDCOM_USERNAME, CARDCOM_API_KEY)",
          },
          { status: 400 },
        );
      }

      const { payUrl, lowProfileCode } = await cardcomCreateSession({
        userId,
        plan,
        pmid,
        // אופציונלי: אם מימוש הספק שלך תומך בסכום ידני/מטא
        amount: base.amount,
        currency: base.currency,
        successUrl: `${ENV.BASE_URL}/date/checkout/success?pmid=${encodeURIComponent(
          pmid,
        )}`,
        cancelUrl: `${ENV.BASE_URL}/date/checkout/cancel?pmid=${encodeURIComponent(
          pmid,
        )}`,
        indicatorUrl: `${ENV.BASE_URL}/api/webhooks/cardcom`,
        meta: { catalog, plan },
      });

      // שמור providerRef לחיבור ל־webhook/return
      await updatePayment(pmid, { providerRef: lowProfileCode });

      return NextResponse.json({
        ok: true,
        url: payUrl,
        redirectUrl: payUrl,
        pmid,
        providerRef: lowProfileCode,
      });
    }

    // PayPal – Orders API
    if (provider === "paypal") {
      const { approveUrl, orderId } = await paypalCreateOrder({
        userId,
        plan,
        pmid,
        amount: base.amount,
        currency: base.currency,
        successUrl: `${ENV.BASE_URL}/date/checkout/success?pmid=${encodeURIComponent(
          pmid,
        )}`,
        cancelUrl: `${ENV.BASE_URL}/date/checkout/cancel?pmid=${encodeURIComponent(
          pmid,
        )}`,
        meta: { catalog, plan },
      });

      await updatePayment(pmid, { providerRef: orderId });

      return NextResponse.json({
        ok: true,
        url: approveUrl,
        redirectUrl: approveUrl,
        pmid,
        providerRef: orderId,
      });
    }

    // Provider לא נתמך
    return NextResponse.json(
      { ok: false, error: "unsupported_provider" },
      { status: 400 },
    );
  } catch (e: any) {
    console.error("[payments/create-session] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "internal_error" },
      { status: 500 },
    );
  }
}
