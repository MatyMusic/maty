// src/lib/payments/providers/cardcom.ts
import { PLANS, type PlanTier } from "../types";

/** ========== Env & Config ========== */
function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[cardcom] Missing required env: ${name}`);
  return v;
}

const LP_URL = requiredEnv("CARDCOM_LOW_PROFILE_URL"); // לדוגמה: https://secure.cardcom.solutions/api/v10/LowProfile
const LP_REDIRECT = requiredEnv("CARDCOM_REDIRECT_URL"); // לדוגמה: https://secure.cardcom.solutions/External/LowProfileClearing.aspx
const TERMINAL = requiredEnv("CARDCOM_TERMINAL");
const USERNAME = requiredEnv("CARDCOM_USERNAME");
const APIKEY = requiredEnv("CARDCOM_API_KEY");

function resolveAppBase(): string {
  const base =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!base || !/^https?:\/\//i.test(base)) {
    throw new Error(
      "[cardcom] APP_BASE_URL/NEXT_PUBLIC_APP_URL/VERCEL_URL חייב להיות URL מלא עם http(s)://",
    );
  }
  return base.replace(/\/+$/, "");
}
const APP_BASE = resolveAppBase();

const RAW_CURRENCY = (process.env.CURRENCY || "ILS").toUpperCase();
const DEBUG = process.env.CARDCOM_DEBUG === "1";

/** ========== Utils ========== */
function coinIdForCurrency(cur: string): string {
  // קודי Cardcom נפוצים: 1=ILS, 2=USD, 978=EUR (לעתים), 826=GBP.
  if (cur === "ILS" || cur === "NIS") return "1";
  if (cur === "USD") return "2";
  if (cur === "EUR") return "978";
  if (cur === "GBP") return "826";
  return "1"; // נפילה ל־ILS כברירת מחדל
}

function parseIniLike(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  text
    .replace(/\r/g, "")
    .split("\n")
    .forEach((line) => {
      const idx = line.indexOf("=");
      if (idx > 0) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim();
        if (k) out[k] = v;
      }
    });
  return out;
}

function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  // @ts-ignore
  return Promise.race([
    p,
    new Promise<T>((_, rej) => {
      setTimeout(() => rej(new Error("fetch_timeout")), ms + 10);
    }),
  ]).finally(() => clearTimeout(t));
}

/** ========== Public API ========== */
/**
 * יוצר LowProfileCode ומחזיר URL למסך התשלום.
 * שומר על אותה חתימה כמו אצלך.
 */
export async function cardcomCreateSession(opts: {
  userId: string;
  plan: PlanTier;
  pmid: string;
}) {
  const plan = PLANS[opts.plan];
  if (!plan) throw new Error(`[cardcom] Unknown plan: ${opts.plan}`);

  const success = `${APP_BASE}/api/payments/success?pmid=${encodeURIComponent(
    opts.pmid,
  )}&provider=cardcom`;
  const error = `${APP_BASE}/api/payments/success?pmid=${encodeURIComponent(
    opts.pmid,
  )}&provider=cardcom&error=1`;
  const notify = `${APP_BASE}/api/payments/webhook/cardcom?pmid=${encodeURIComponent(
    opts.pmid,
  )}`;

  const currency = RAW_CURRENCY;
  const params = new URLSearchParams({
    TerminalNumber: TERMINAL,
    UserName: USERNAME,
    APIKey: APIKEY,
    APILevel: "10",
    SumToBill: String(plan.price.toFixed(2)),
    CoinID: coinIdForCurrency(currency),
    ProductName: `MATY-DATE ${plan.label}`,
    Language: "HE",
    SuccessRedirectUrl: success,
    ErrorRedirectUrl: error,
    NotifyURL: notify,
    ReturnValue: opts.pmid, // חוזר ב־Notify/Redirect
    // שדות אופציונליים אפשריים:
    // Email: "...",
    // CardOwnerName: "...",
    // SendEmailApproval: "true",
  });

  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log("[cardcom][create] POST", LP_URL, Object.fromEntries(params));
  }

  const resp = await withTimeout(
    fetch(LP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    }),
  );

  const text = await resp.text().catch(() => "");
  if (!resp.ok) {
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.error("[cardcom][create] http error:", resp.status, text);
    }
    throw new Error(`Cardcom HTTP ${resp.status}`);
  }

  const parsed = parseIniLike(text);
  // Cardcom מחזירים לרוב LowProfileCode וגם ResponseCode/ResponseDescription
  const code =
    parsed["LowProfileCode"] || /LowProfileCode=(\w+)/.exec(text)?.[1] || "";
  const rc = parsed["ResponseCode"];
  const rd = parsed["ResponseDescription"];

  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log("[cardcom][create] parsed:", { rc, rd, code });
  }

  if (!code) {
    throw new Error(
      `Cardcom: LowProfileCode not found${
        rd ? ` (${rd})` : rc ? ` [${rc}]` : ""
      }`,
    );
  }

  const payUrl = `${LP_REDIRECT}?lowprofilecode=${encodeURIComponent(code)}`;
  return { payUrl, lowProfileCode: code };
}

/**
 * אימות לאחר חזרה (Redirect back). בפועל ברוב ההטמעות סומכים על ה-Notify (Webhook),
 * אבל נוח להחזיר חיווי "בסדר" וגם להדפיס תכולה לדיבאג.
 */
export async function cardcomVerifyAfterReturn(query: URLSearchParams) {
  // פרמטרים אופייניים ברידיירקט:
  // ResponseCode, ResponseDescription, ReturnValue(=pmid), LowProfileCode, ...
  const rc = query.get("ResponseCode") || query.get("responsecode") || "";
  const desc =
    query.get("ResponseDescription") || query.get("responsedescription") || "";
  const low = query.get("LowProfileCode") || query.get("lowprofilecode") || "";
  const pmid = query.get("ReturnValue") || query.get("returnvalue") || "";

  const ok = rc === "0" || rc === "000" || !rc; // לעתים אין קוד ונסמוך על Notify
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log("[cardcom][return]", { rc, desc, low, pmid, ok });
  }
  return { ok, code: rc, desc, lowProfileCode: low, pmid };
}

/**
 * נוח לעיבוד גוף Notify (Webhook) שמגיע כ־x-www-form-urlencoded.
 * תחזיר normalized object עם שדות שימושיים.
 */
export function normalizeCardcomNotify(
  form: URLSearchParams | Record<string, string | null | undefined>,
) {
  const get = (k: string) =>
    form instanceof URLSearchParams
      ? form.get(k) || form.get(k.toLowerCase()) || undefined
      : (form[k] as string | undefined) ||
        (form[k.toLowerCase()] as string | undefined);

  const out = {
    pmid: get("ReturnValue"),
    lowProfileCode: get("LowProfileCode"),
    dealResponse: get("ResponseCode"),
    dealText: get("ResponseDescription"),
    cardMask: get("CardMask"),
    cardBrand: get("CardBrand"),
    approvalNumber: get("ApprovalNumber"),
    currency: get("CoinID"),
    sum: get("SumToBill"),
    payments: get("NumberOfPayments"),
    authNum: get("AuthNumber"),
    transactionId: get("TransactionID"),
    // וכו' לפי הדוקומנטציה שלך
  };
  return out;
}

// הוסף לקובץ cardcom.ts שלך:

export async function cardcomCreateSessionAny(opts: {
  userId: string;
  pmid: string;
  label: string; // ProductName
  amount: number; // סכום לתשלום
  currency?: string; // ברירת מחדל מה-ENV
}) {
  const label = opts.label || "MATY PRODUCT";
  const amount = Number(opts.amount);
  if (!amount || amount < 1) throw new Error("Bad amount");

  // ... השתמש באותם ENV והפונקציות מהקובץ שלך (LP_URL, etc.)
  const currency = (
    opts.currency ||
    process.env.CURRENCY ||
    "ILS"
  ).toUpperCase();

  // בנה Success/Error/Notify כמו בקוד הקיים:
  const APP_BASE = (process.env.APP_BASE_URL || "").replace(/\/+$/, "");
  const success = `${APP_BASE}/api/payments/success?pmid=${encodeURIComponent(opts.pmid)}&provider=cardcom`;
  const error = `${APP_BASE}/api/payments/success?pmid=${encodeURIComponent(opts.pmid)}&provider=cardcom&error=1`;
  const notify = `${APP_BASE}/api/payments/webhook/cardcom?pmid=${encodeURIComponent(opts.pmid)}`;

  const data = new URLSearchParams({
    TerminalNumber: process.env.CARDCOM_TERMINAL!,
    UserName: process.env.CARDCOM_USERNAME!,
    APILevel: "10",
    APIKey: process.env.CARDCOM_API_KEY!,
    SumToBill: String(amount.toFixed(2)),
    CoinID: currency === "ILS" ? "1" : currency === "USD" ? "2" : "1",
    ProductName: label,
    Language: "HE",
    SuccessRedirectUrl: success,
    ErrorRedirectUrl: error,
    NotifyURL: notify,
    ReturnValue: opts.pmid,
  });

  const r = await fetch(process.env.CARDCOM_LOW_PROFILE_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: data.toString(),
  });
  const text = await r.text();
  const code = /LowProfileCode=(\w+)/.exec(text)?.[1];
  if (!code) throw new Error("Cardcom: LowProfileCode not found");
  const payUrl = `${process.env.CARDCOM_REDIRECT_URL!}?lowprofilecode=${code}`;
  return { payUrl, lowProfileCode: code };
}
