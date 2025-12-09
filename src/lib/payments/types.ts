// src/lib/payments/types.ts

/** =========================
 *  Plans / Pricing
 *  ========================= */
export type PlanTier = "plus" | "pro" | "vip";

type PlanDef = {
  id: PlanTier;
  label: string;
  price: number; // in `currency`
  months: number; // duration
  badge?: string; // optional UI hint
};

function envNum(key: string, fallback: number): number {
  const v = Number(process.env[key]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export const PLANS: Record<PlanTier, PlanDef> = {
  plus: {
    id: "plus",
    label: "PLUS",
    price: envNum("PLAN_PLUS_PRICE", 29),
    months: 1,
    badge: "Starter",
  },
  pro: {
    id: "pro",
    label: "PRO",
    price: envNum("PLAN_PRO_PRICE", 49),
    months: 1,
    badge: "Popular",
  },
  vip: {
    id: "vip",
    label: "VIP",
    price: envNum("PLAN_VIP_PRICE", 89),
    months: 1,
    badge: "Premium",
  },
};

/** =========================
 *  Providers / Currency
 *  ========================= */
export type Provider = "cardcom" | "paypal";
export type PaymentStatus = "pending" | "paid" | "failed" | "canceled";
export type Currency = "ILS" | "USD" | "EUR";

export const DEFAULT_CURRENCY: Currency =
  (process.env.CURRENCY as Currency) || "ILS";

/** =========================
 *  Payment / Subscription docs
 *  ========================= */
export type PaymentDoc = {
  _id?: any;
  pmid: string; // local payment id
  userId: string;
  provider: Provider;
  plan: PlanTier;
  amount: number; // in `currency`
  currency: Currency; // ILS / USD / EUR
  providerRef?: string; // orderId / lowProfileCode
  status: PaymentStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  meta?: Record<string, any>;
};

export type Subscription = {
  status: "active" | "inactive";
  tier: PlanTier;
  until: string; // ISO (expiration)
  provider?: Provider;
  lastPaymentId?: string;
};

/** =========================
 *  Helpers
 *  ========================= */

// Safely add months (keeps date if possible, similar to business logic)
export function addMonths(d: Date, months: number) {
  const x = new Date(d);
  const day = x.getDate();
  x.setMonth(x.getMonth() + months);

  // If month overflowed (e.g., adding 1 month to Jan 31 → Mar 3),
  // backtrack to last day of previous month.
  if (x.getDate() < day) x.setDate(0);
  return x;
}

export function isPlanTier(v: any): v is PlanTier {
  return v === "plus" || v === "pro" || v === "vip";
}

export function isProvider(v: any): v is Provider {
  return v === "cardcom" || v === "paypal";
}

export function isPaymentStatus(v: any): v is PaymentStatus {
  return v === "pending" || v === "paid" || v === "failed" || v === "canceled";
}

/** Get a full plan definition or throw a clear error for bad ids. */
export function getPlanOrThrow(id: string): PlanDef {
  const key = (id || "").toLowerCase() as PlanTier;
  if (!isPlanTier(key)) {
    throw new Error(`Unknown plan: ${id}`);
  }
  return PLANS[key];
}

/** Return subscription expiry for a given plan (from a given date) */
export function calcSubscriptionUntil(from: Date, planId: PlanTier): Date {
  const plan = getPlanOrThrow(planId);
  return addMonths(from, plan.months);
}

/** Intl currency formatting helper (nice for UI / receipts) */
export function formatCurrency(
  amount: number,
  currency: Currency = DEFAULT_CURRENCY,
  locale?: string,
) {
  const loc =
    locale ||
    (currency === "ILS" ? "he-IL" : currency === "EUR" ? "de-DE" : "en-US");

  try {
    return new Intl.NumberFormat(loc, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback formatting
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** Normalize currency strings to our union type (fallback to DEFAULT_CURRENCY) */
export function resolveCurrency(input?: string | null): Currency {
  const c = (input || "").toUpperCase();
  return (["ILS", "USD", "EUR"] as const).includes(c as Currency)
    ? (c as Currency)
    : DEFAULT_CURRENCY;
}

/** Narrow helper: build a PaymentDoc baseline */
export function makePaymentDocBase(params: {
  pmid: string;
  userId: string;
  provider: Provider;
  plan: PlanTier;
  amount?: number;
  currency?: Currency | string | null;
}): Omit<PaymentDoc, "_id"> {
  const plan = getPlanOrThrow(params.plan);
  const now = new Date().toISOString();
  return {
    pmid: params.pmid,
    userId: params.userId,
    provider: params.provider,
    plan: plan.id,
    amount: Number.isFinite(params.amount)
      ? (params.amount as number)
      : plan.price,
    currency: resolveCurrency(params.currency as any),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
}
