import { NextResponse } from "next/server";

const isLive = process.env.PAYPAL_ENV === "live";
const base = isLive ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

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

export async function POST(req: Request) {
  const { paypalOrderId } = await req.json();
  const { access_token } = await getAccessToken();

  const res = await fetch(`${base}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data }, { status: 400 });

  const captureId = data?.purchase_units?.[0]?.payments?.captures?.[0]?.id || "UNKNOWN";
  // כאן אפשר לשמור הזמנה/חשבונית במסד
  return NextResponse.json({ ok: true, captureId, raw: data });
}
