import { NextRequest, NextResponse } from "next/server";
import AuditEvent from "@/models/AuditEvent";
import Customer from "@/models/Customer";

const isLive = process.env.PAYPAL_ENV === "live";
const base = isLive
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) throw new Error("PayPal auth failed");
  return (await res.json()) as { access_token: string };
}

async function verifySignature(req: NextRequest, body: any) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const headers = req.headers;
  const transmissionId = headers.get("paypal-transmission-id");
  const timestamp = headers.get("paypal-transmission-time");
  const signature = headers.get("paypal-transmission-sig");
  const certUrl = headers.get("paypal-cert-url");
  const authAlgo = headers.get("paypal-auth-algo");

  if (!transmissionId || !timestamp || !signature || !certUrl || !authAlgo)
    return false;

  const { access_token } = await getAccessToken();

  const res = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: signature,
      transmission_time: timestamp,
      webhook_id: webhookId,
      webhook_event: body,
    }),
  });

  const data = await res.json().catch(() => null);
  return res.ok && data?.verification_status === "SUCCESS";
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid json" },
      { status: 400 }
    );
  }

  const okSig = await verifySignature(req, body).catch(() => false);
  if (!okSig) {
    await AuditEvent.create({
      type: "webhook.paypal.bad_signature",
      email: "",
      ip: req.headers.get("x-forwarded-for") || "",
      ua: req.headers.get("user-agent") || "",
      meta: { body },
    });
    return NextResponse.json(
      { ok: false, error: "bad signature" },
      { status: 400 }
    );
  }

  const eventType = body?.event_type;
  const resource = body?.resource;
  const payerEmail =
    resource?.payer?.email_address ||
    resource?.payment_source?.paypal?.email_address ||
    "";

  // דוגמא: בקפצ׳ר מוצלח נסמן לקוח כ-booked + נשמור סכום אחרון
  if (
    eventType === "CHECKOUT.ORDER.APPROVED" ||
    eventType === "PAYMENT.CAPTURE.COMPLETED" ||
    eventType === "PAYMENT.CAPTURE.DENIED"
  ) {
    const amount =
      resource?.amount?.value ||
      resource?.purchase_units?.[0]?.amount?.value ||
      null;
    const currency =
      resource?.amount?.currency_code ||
      resource?.purchase_units?.[0]?.amount?.currency_code ||
      null;

    if (payerEmail) {
      await Customer.updateOne(
        { email: payerEmail.toLowerCase() },
        {
          $setOnInsert: {
            name: resource?.payer?.name?.given_name ?? "",
            source: "site",
          },
          $set: { lastSeenAt: new Date(), lastOrderAt: new Date() },
          $addToSet: { tags: "booked" },
        },
        { upsert: true }
      );
    }

    await AuditEvent.create({
      type: "webhook.paypal",
      email: payerEmail.toLowerCase(),
      ip: req.headers.get("x-forwarded-for") || "",
      ua: req.headers.get("user-agent") || "",
      meta: { eventType, amount, currency, raw: body },
    });
  } else {
    await AuditEvent.create({
      type: "webhook.paypal.other",
      email: payerEmail.toLowerCase(),
      ip: req.headers.get("x-forwarded-for") || "",
      ua: req.headers.get("user-agent") || "",
      meta: { eventType, raw: body },
    });
  }

  return NextResponse.json({ ok: true });
}


// https://YOUR_DOMAIN/api/webhooks/paypal

// PAYPAL_WEBHOOK_ID.