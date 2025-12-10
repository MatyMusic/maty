// src/lib/paypal.ts
import paypal from "@paypal/checkout-server-sdk";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENV = process.env.PAYPAL_ENV || "sandbox";

export const isPaypalConfigured =
  !!PAYPAL_CLIENT_ID && !!PAYPAL_CLIENT_SECRET && !!PAYPAL_ENV;

function buildClient() {
  if (!isPaypalConfigured) {
    throw new Error("[paypal] Not configured – missing env vars");
  }

  const environment =
    PAYPAL_ENV === "live"
      ? new paypal.core.LiveEnvironment(
          PAYPAL_CLIENT_ID!,
          PAYPAL_CLIENT_SECRET!,
        )
      : new paypal.core.SandboxEnvironment(
          PAYPAL_CLIENT_ID!,
          PAYPAL_CLIENT_SECRET!,
        );

  return new paypal.core.PayPalHttpClient(environment);
}

export function getPaypalClient() {
  if (!isPaypalConfigured) {
    throw new Error("[paypal] Not configured – missing env vars");
  }
  return buildClient();
}
