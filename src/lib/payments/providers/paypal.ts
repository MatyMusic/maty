// src/lib/payments/providers/paypal.ts
import paypal from "@paypal/checkout-server-sdk";
import { PLANS, type PlanTier } from "../types";
import { randomUUID } from "crypto";

/** =========================
 *  Env & Config
 *  ========================= */
type Mode = "sandbox" | "live";
const MODE: Mode =
  ((process.env.PAYPAL_MODE || "sandbox").toLowerCase() as Mode) || "sandbox";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[paypal] Missing required env: ${name}`);
  return v;
}

const CLIENT_ID = requiredEnv("PAYPAL_CLIENT_ID");
const CLIENT_SECRET = requiredEnv("PAYPAL_CLIENT_SECRET");

// PayPal דורש כתובת מלאה (עדיף HTTPS).
function resolveAppBase(): string {
  const base =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!base || !/^https?:\/\//i.test(base)) {
    throw new Error(
      "[paypal] APP_BASE_URL (או NEXT_PUBLIC_APP_URL/VERCEL_URL) חייב להיות URL מלא (כולל https://).",
    );
  }
  return base.replace(/\/+$/, "");
}
const APP_BASE = resolveAppBase();

// PayPal לא תומך בכל המטבעות לכל חשבון—כאן מאבטחים ל-ILS/ USD בלבד.
const RAW_CURRENCY = (process.env.CURRENCY || "ILS").toUpperCase();
const CURRENCY: "ILS" | "USD" = RAW_CURRENCY === "ILS" ? "ILS" : "USD";

// Debug toggle
const DEBUG = process.env.PAYPAL_DEBUG === "1";

/** =========================
 *  Client (singleton)
 *  ========================= */
let _client: paypal.core.PayPalHttpClient | null = null;
function ppClient() {
  if (_client) return _client;
  const env =
    MODE === "live"
      ? new paypal.core.LiveEnvironment(CLIENT_ID, CLIENT_SECRET)
      : new paypal.core.SandboxEnvironment(CLIENT_ID, CLIENT_SECRET);
  _client = new paypal.core.PayPalHttpClient(env);
  return _client;
}

/** =========================
 *  Helpers
 *  ========================= */
function roundMoney(n: number) {
  // מבטיח שני ספרות אחרי הנקודה
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

function orderReturnUrl(pmid: string) {
  const u = new URL("/api/payments/success", APP_BASE);
  u.searchParams.set("pmid", pmid);
  u.searchParams.set("provider", "paypal");
  return u.toString();
}
function orderCancelUrl(pmid: string) {
  const u = new URL("/api/payments/success", APP_BASE);
  u.searchParams.set("pmid", pmid);
  u.searchParams.set("provider", "paypal");
  u.searchParams.set("canceled", "1");
  return u.toString();
}

/** =========================
 *  Public API
 *  ========================= */

export async function paypalCreateOrder(opts: {
  userId: string;
  plan: PlanTier;
  pmid: string;
}): Promise<{ approveUrl: string; orderId: string }> {
  const plan = PLANS[opts.plan];
  if (!plan) throw new Error(`[paypal] Unknown plan: ${opts.plan}`);

  const amount = roundMoney(plan.price);

  const client = ppClient();
  const req = new paypal.orders.OrdersCreateRequest();
  req.prefer("return=representation");

  // Idempotency (מונע יצירה כפולה במקרה של ריטריי ברשת)
  const idemKey = `order-${opts.pmid}-${randomUUID()}`;
  (req as any).headers = {
    ...(req as any).headers,
    "PayPal-Request-Id": idemKey,
  };

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: opts.pmid,
        description: `MATY-DATE ${plan.label}`,
        amount: {
          currency_code: CURRENCY, // ILS או USD
          value: amount.toFixed(2),
        },
      },
    ],
    application_context: {
      brand_name: "MATY-DATE",
      user_action: "PAY_NOW",
      shipping_preference: "NO_SHIPPING",
      return_url: orderReturnUrl(opts.pmid),
      cancel_url: orderCancelUrl(opts.pmid),
    },
  } as paypal.orders.OrdersCreateRequestBody;

  req.requestBody(body);

  if (DEBUG) {
    // לא מדפיס סודות. רק מטא.
    // eslint-disable-next-line no-console
    console.log("[paypal][create] body:", {
      intent: body.intent,
      amount,
      currency: CURRENCY,
      pmid: opts.pmid,
      plan: plan.id,
      mode: MODE,
    });
  }

  try {
    const res = await client.execute(req);
    const order: any = res.result;
    const approve = order?.links?.find((l: any) => l.rel === "approve")?.href;
    if (!approve || !order?.id) {
      throw new Error("[paypal] approve link or order id not found");
    }
    return { approveUrl: approve, orderId: order.id };
  } catch (e: any) {
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.error(
        "[paypal][create] error:",
        e?.message || e,
        e?.statusCode,
        e?.result,
      );
    }
    throw new Error(e?.message || "paypal_create_failed");
  }
}

export async function paypalCaptureOrder(orderId: string): Promise<{
  ok: boolean;
  raw: any;
  status?: string;
  captureId?: string;
  reason?: string;
}> {
  const client = ppClient();
  const req = new paypal.orders.OrdersCaptureRequest(orderId);
  req.requestBody({}); // required even if empty

  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log("[paypal][capture] orderId:", orderId);
  }

  try {
    const res = await client.execute(req);
    const out: any = res.result;

    // מצבים נפוצים: COMPLETED / PENDING / DECLINED וכו'
    const status: string = out?.status;
    const capture =
      out?.purchase_units?.[0]?.payments?.captures?.[0] ||
      out?.purchase_units?.[0]?.payments?.authorizations?.[0];
    const captureId: string | undefined = capture?.id;
    const ok = status === "COMPLETED";

    if (!ok && DEBUG) {
      // eslint-disable-next-line no-console
      console.warn("[paypal][capture] not completed:", {
        status,
        orderId,
        captureId,
        debug_id: (res as any)?.headers?.["paypal-debug-id"],
      });
    }

    return {
      ok,
      raw: out,
      status,
      captureId,
      reason: capture?.status_details?.reason || out?.reason,
    };
  } catch (e: any) {
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.error(
        "[paypal][capture] error:",
        e?.message || e,
        e?.statusCode,
        e?.result,
      );
    }
    return { ok: false, raw: e, reason: e?.message || "paypal_capture_failed" };
  }
}
