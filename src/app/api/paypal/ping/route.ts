import { NextResponse } from "next/server";

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
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function GET() {
  const ping = await getAccessToken();
  if (!ping.ok)
    return NextResponse.json(
      { ok: false, env: process.env.PAYPAL_ENV, error: ping.data },
      { status: 400 }
    );
  return NextResponse.json({ ok: true, env: process.env.PAYPAL_ENV });
}
