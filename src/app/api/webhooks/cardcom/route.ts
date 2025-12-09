// src/app/api/webhooks/cardcom/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import connectDB from "@/lib/db/mongoose";
import Payment from "@/models/club/Payment";

/** ---- Optional AuditEvent (if exists) ---- */
let AuditEvent: any;
try {
  AuditEvent = (await import("@/models/AuditEvent")).default;
} catch {}

/** ---- Small ENV helper (aliases + sandbox) ---- */
const ENV = {
  SANDBOX: (process.env.CARDCOM_SANDBOX || "false").toLowerCase() === "true",
  PAY_WEBHOOK_SECRET: process.env.PAY_WEBHOOK_SECRET || "",
};

function hmac(bodyRaw: string, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(bodyRaw, "utf8")
    .digest("hex");
}
function safeEq(a: string, b: string) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
function normStatus(input?: string) {
  const s = String(input || "").toLowerCase();
  if (["approved", "success", "ok", "paid"].includes(s)) return "approved";
  if (["declined", "fail", "failed", "error"].includes(s)) return "declined";
  if (["pending", "processing", "authorized", "captured"].includes(s)) return s;
  return "pending";
}

/** ---- POST (Cardcom Webhook) ---- */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  // 1) Read RAW exactly once
  const raw = await req.text();

  // 2) Signature verification
  const sentSig =
    req.headers.get("x-pay-webhook-signature") ||
    req.headers.get("x-cardcom-signature") ||
    "";
  const computed = ENV.PAY_WEBHOOK_SECRET
    ? hmac(raw, ENV.PAY_WEBHOOK_SECRET)
    : "";
  const verified = ENV.PAY_WEBHOOK_SECRET
    ? safeEq(computed, sentSig)
    : ENV.SANDBOX; /* allow in sandbox if no secret */

  // 3) Parse payload after reading raw
  let payload: any = {};
  try {
    if (contentType.includes("application/x-www-form-urlencoded")) {
      payload = Object.fromEntries(new URLSearchParams(raw));
    } else if (contentType.includes("application/json")) {
      payload = JSON.parse(raw);
    } else {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = { raw };
      }
    }
  } catch {
    payload = { raw, parse: "failed" };
  }

  // 4) Extract common fields (support multiple naming variants)
  const orderId =
    payload?.ReturnValue ||
    payload?.orderId ||
    payload?.OrderID ||
    payload?.OrderId ||
    "";

  const statusRaw =
    payload?.Status ||
    payload?.status ||
    payload?.Response ||
    payload?.DealResponse ||
    "";
  const status = normStatus(statusRaw);

  const providerRef =
    payload?.ApprovalNumber ||
    payload?.TransactionID ||
    payload?.TransactionId ||
    payload?.InvoiceNumber ||
    payload?.InvoiceId ||
    "";

  const amountVal =
    Number(payload?.Amount || payload?.Sum || payload?.Total || 0) || null;

  const currencyVal = (payload?.Currency || payload?.coin || "ILS")
    .toString()
    .toUpperCase();

  if (!orderId) {
    // No orderId → reject politely to avoid creating stray records
    await safeAudit({
      type: "webhook.cardcom.missing_order",
      meta: { verified, payload },
      req,
    });
    return NextResponse.json(
      { ok: false, error: "missing_orderId" },
      { status: 400 },
    );
  }

  try {
    // 5) DB update
    await connectDB();

    // We DO NOT upsert here intentionally. Only update existing payment.
    const doc = await (Payment as any).findOne({ orderId }).exec();

    if (!doc) {
      await safeAudit({
        type: verified
          ? "webhook.cardcom.unknown_order"
          : "webhook.cardcom.unverified_unknown",
        meta: { orderId, status, providerRef, amountVal, currencyVal, payload },
        req,
      });
      // 202: accepted but nothing to update (unknown orderId)
      return NextResponse.json(
        { ok: true, verified, orderId, status, updated: false },
        { status: 202 },
      );
    }

    // Update core fields
    if (providerRef) doc.providerRef = providerRef;
    if (amountVal) doc.amount = amountVal;
    if (currencyVal) doc.currency = currencyVal;
    doc.provider = "cardcom";

    // Prefer schema method if available
    if (typeof doc.setStatus === "function") {
      doc.setStatus(status as any, { note: "cardcom-webhook", raw: payload });
    } else {
      doc.status = status;
      // push history if exists
      if (Array.isArray(doc.history)) {
        doc.history.push({ at: new Date(), status, raw: payload });
      }
    }

    // Merge payload into meta + verification hint
    doc.meta = {
      ...(doc.meta || {}),
      ...payload,
      webhookVerified: !!verified,
      signatureHeader: sentSig ? "present" : "absent",
    };

    await doc.save();

    await safeAudit({
      type: verified ? "webhook.cardcom" : "webhook.cardcom.unverified",
      meta: { orderId, status, providerRef, amountVal, currencyVal },
      req,
    });

    return NextResponse.json({
      ok: true,
      verified,
      orderId,
      status,
      updated: true,
    });
  } catch (e: any) {
    await safeAudit({
      type: "webhook.cardcom.error",
      meta: { error: e?.message || String(e), orderId, raw: payload },
      req,
    });
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}

/** ---- Helper: safe audit log ---- */
async function safeAudit({
  type,
  meta,
  req,
}: {
  type: string;
  meta?: any;
  req: NextRequest;
}) {
  try {
    if (AuditEvent?.create) {
      await AuditEvent.create({
        type,
        ip: req.headers.get("x-forwarded-for") || "",
        ua: req.headers.get("user-agent") || "",
        meta,
      });
    }
  } catch {
    // ignore audit errors
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
