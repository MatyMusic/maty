// src/lib/payments/index.ts
import { getPlanPrice, type Interval, type PlanKey } from "@/lib/date/plans";

export type ProviderKey =
  | "custom"
  | "tranzila"
  | "payplus"
  | "pelecard"
  | "paypal";

export type StartInput = {
  userId: string;
  email: string;
  name?: string | null;
  plan: PlanKey;
  interval: Interval;
  // מזהה הזמנה/עסקה פנימי שלנו (כדי לשחזר בחזרה)
  orderId: string;
  // כתובות חזרה/עדכון
  returnUrl: string;
  notifyUrl: string;
  cancelUrl: string;
};

export type StartResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export function getProvider(): ProviderKey {
  const v = (process.env.PAYMENTS_PROVIDER || "custom").toLowerCase();
  if (["tranzila", "payplus", "pelecard", "paypal", "custom"].includes(v))
    return v as ProviderKey;
  return "custom";
}

/**
 * פרוביידר כללי בסגנון Hosted Page:
 * בינתיים מייצרים לינק Redirect עם פרמטרים סטנדרטיים (plan/interval/amount/userId/orderId)
 * הצד של הסולק צריך למפות אותם ולהחזיר אלינו ל-return/notify.
 */
export async function startPayment(input: StartInput): Promise<StartResult> {
  const price = getPlanPrice(input.plan, input.interval);
  if (!price) return { ok: false, error: "plan_not_configured" };

  const provider = getProvider();

  // ▼ תבנית גנרית: מעביר פרמטרים ל־Hosted Page שלכם (לקביעת כתובת: PSP_CHECKOUT_URL)
  if (
    provider === "custom" ||
    provider === "tranzila" ||
    provider === "payplus" ||
    provider === "pelecard"
  ) {
    const base = process.env.PSP_CHECKOUT_URL; // לדוגמה: "https://secure.provider.co.il/checkout"
    if (!base) return { ok: false, error: "provider_not_configured" };

    const u = new URL(base);
    u.searchParams.set("amount", String(price));
    u.searchParams.set("currency", "ILS");
    u.searchParams.set("email", input.email);
    u.searchParams.set("name", input.name || "");
    u.searchParams.set("plan", input.plan);
    u.searchParams.set("interval", input.interval);
    u.searchParams.set("orderId", input.orderId);
    u.searchParams.set("userId", input.userId);

    // כתובות חזרה/עדכון
    u.searchParams.set("return_url", input.returnUrl);
    u.searchParams.set("notify_url", input.notifyUrl);
    u.searchParams.set("cancel_url", input.cancelUrl);

    // במידת הצורך: חתימה/טוקן — כאן רק placeholder
    if (process.env.PSP_SECRET) {
      const signature = simpleSign({
        amount: price,
        userId: input.userId,
        orderId: input.orderId,
        plan: input.plan,
        interval: input.interval,
        secret: process.env.PSP_SECRET!,
      });
      u.searchParams.set("signature", signature);
    }

    return { ok: true, url: u.toString() };
  }

  // ▼ PayPal יחובר בהמשך
  if (provider === "paypal") {
    return { ok: false, error: "paypal_not_enabled" };
  }

  return { ok: false, error: "unknown_provider" };
}

export type NotifyPayload = {
  provider: ProviderKey;
  status: "success" | "failed" | "canceled" | "pending";
  orderId?: string | null;
  userId?: string | null;
  plan?: PlanKey | null;
  interval?: Interval | null;
  transactionId?: string | null;
  amount?: number | null;
  raw: Record<string, any>;
};

/** פירוק Payload מ־return/notify ל־NotifyPayload אחיד */
export function parseIncoming(
  params: URLSearchParams | Record<string, any>
): NotifyPayload {
  const get = (k: string) =>
    params instanceof URLSearchParams ? params.get(k) : (params as any)[k];

  const provider = (process.env.PAYMENTS_PROVIDER || "custom") as ProviderKey;
  const statusRaw = (get("status") || get("result") || "")
    .toString()
    .toLowerCase();
  const status: NotifyPayload["status"] =
    statusRaw === "success" || statusRaw === "ok"
      ? "success"
      : statusRaw === "canceled" || statusRaw === "cancel"
      ? "canceled"
      : statusRaw === "pending"
      ? "pending"
      : "failed";

  const orderId = (get("orderId") || get("order_id") || get("oid")) ?? null;
  const userId = (get("userId") || get("uid") || get("customer_id")) ?? null;
  const plan = (get("plan") || null) as PlanKey | null;
  const interval = (get("interval") || null) as any;
  const transactionId =
    (get("transactionId") || get("txn_id") || get("trans_id")) ?? null;
  const amount = Number(get("amount") || 0) || null;

  const raw: Record<string, any> =
    params instanceof URLSearchParams
      ? Object.fromEntries(params.entries())
      : (params as any);

  return {
    provider,
    status,
    orderId: orderId ? String(orderId) : null,
    userId: userId ? String(userId) : null,
    plan: plan === "plus" || plan === "pro" || plan === "free" ? plan : null,
    interval: interval === "month" || interval === "year" ? interval : null,
    transactionId: transactionId ? String(transactionId) : null,
    amount,
    raw,
  };
}

// Placeholder חתימה פשטנית (לא להצפנה אמיתית; תחליף בהתאם למסמכי הסולק)
function simpleSign(input: Record<string, any>) {
  const base = JSON.stringify(input);
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(base).digest("hex");
}
