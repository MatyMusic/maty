// Utils/env.ts — קובץ עזר מרוכז (חדש)
export const ENV = {
  BASE_URL:
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000",

  // Cardcom (אליאסים)
  CARDCOM_TERMINAL_NUMBER:
    process.env.CARDCOM_TERMINAL_NUMBER || process.env.CARDCOM_TERMINAL || "",
  CARDCOM_USERNAME:
    process.env.CARDCOM_USERNAME || process.env.CARDCOM_USER || "",
  CARDCOM_API_KEY: process.env.CARDCOM_API_KEY || "",

  CARDCOM_SANDBOX:
    (process.env.CARDCOM_SANDBOX || "false").toLowerCase() === "true",
  PAY_WEBHOOK_SECRET: process.env.PAY_WEBHOOK_SECRET || "",

  // Provider selection
  PAYMENTS_PROVIDER: (process.env.PAYMENTS_PROVIDER || "cardcom").toLowerCase(),
  PSP_CHECKOUT_URL: process.env.PSP_CHECKOUT_URL || "",
  PSP_SECRET: process.env.PSP_SECRET || "",
};
