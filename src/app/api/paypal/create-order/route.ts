import { NextResponse } from "next/server";
import { headers } from "next/headers";

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

export async function POST(req: Request) {
  try {
    const { orderId, amount, description } = await req.json();

    const hdrs = await headers();
    const origin =
      hdrs.get("origin") ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    const { access_token } = await getAccessToken();

    const createRes = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: String(orderId ?? ""),
            description,
            amount: {
              currency_code: "ILS",
              value: Number(amount ?? 0).toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: process.env.NEXT_PUBLIC_SITE_NAME ?? "MATY MUSIC",
          user_action: "PAY_NOW",
          return_url: `${origin}/checkout/success`,
          cancel_url: `${origin}/checkout/cancel`,
        },
      }),
      cache: "no-store",
    });

    const data = await createRes.json();
    if (!createRes.ok) {
      return NextResponse.json(
        { error: data },
        { status: createRes.status || 400 }
      );
    }

    const approveUrl =
      data?.links?.find((l: any) => l.rel === "approve")?.href ?? null;
    return NextResponse.json({ id: data.id, approveUrl });
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message ?? "Unknown error" } },
      { status: 500 }
    );
  }
}
