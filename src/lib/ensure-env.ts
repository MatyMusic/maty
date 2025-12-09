// src/lib/ensure-env.ts
const required = [
  "MONGODB_URI",
  "MONGODB_DB",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NEXTAUTH_URL",
];

export function ensureEnv() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`[ENV] Missing required variables: ${missing.join(", ")}`);
  }
}
