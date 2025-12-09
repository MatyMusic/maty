// import { cookies, type RequestCookies } from "next/headers";
// import type { NextRequest } from "next/server";
// import bcrypt from "bcryptjs";
// import crypto from "crypto";

// export const COOKIE_NAME = "maty_admin_bypass";
// export const MAX_AGE = 60 * 60 * 24 * 7; // 7 ימים

// // --- helpers ---
// function getSecret(): string {
//   const s = process.env.BYPASS_SECRET?.trim();
//   if (!s) {
//     // Fail-fast: בלי סוד אין בייפאס
//     throw new Error("[admin-bypass] BYPASS_SECRET missing");
//   }
//   return s;
// }

// function b64u(data: Buffer | string) {
//   return Buffer.from(data).toString("base64url");
// }
// function fromB64u(s: string) {
//   return Buffer.from(s, "base64url");
// }

// // --- token ---
// function sign(data: Record<string, unknown>) {
//   const secret = getSecret(); // יזרוק אם חסר
//   const payload = b64u(JSON.stringify(data));
//   const sig = b64u(
//     crypto.createHmac("sha256", secret).update(payload).digest(),
//   );
//   return `${payload}.${sig}`;
// }

// function constantTimeEq(a: Buffer, b: Buffer) {
//   if (a.length !== b.length) return false;
//   try {
//     return crypto.timingSafeEqual(a, b);
//   } catch {
//     return false;
//   }
// }

// function verify(token: string): null | any {
//   try {
//     const secret = getSecret(); // אם חסר – ייזרק ונחזיר null
//     const parts = token.split(".");
//     if (parts.length !== 2) return null;
//     const [payload, sig] = parts;
//     const expected = crypto
//       .createHmac("sha256", secret)
//       .update(payload)
//       .digest();
//     const given = fromB64u(sig);
//     if (!constantTimeEq(given, expected)) return null;
//     const obj = JSON.parse(fromB64u(payload).toString("utf8"));
//     if (obj.exp && Date.now() > Number(obj.exp)) return null;
//     return obj;
//   } catch {
//     return null;
//   }
// }

// // --- password check ---
// export async function checkAdminPassword(plain: string) {
//   const hash = (process.env.ADMIN_BYPASS_HASH || "").trim();
//   if (!hash || !plain) return false;
//   try {
//     const norm = plain.normalize("NFKC").trim();
//     return await bcrypt.compare(norm, hash);
//   } catch {
//     return false;
//   }
// }

// // --- cookie ops ---
// export function setBypassCookie(opts?: {
//   cookiesApi?: RequestCookies;
//   days?: number;
// }) {
//   const maxAge = Math.max(1, Math.floor((opts?.days ?? 7) * 24 * 60 * 60));
//   const exp = Date.now() + maxAge * 1000;
//   const token = sign({ role: "admin-bypass", iat: Date.now(), exp });
//   const jar = opts?.cookiesApi ?? cookies();
//   jar.set({
//     name: COOKIE_NAME,
//     value: token,
//     httpOnly: true,
//     sameSite: "lax",
//     secure: process.env.NODE_ENV === "production", // 👈 חשוב ללוקאל
//     path: "/",
//     maxAge,
//   });
// }

// export function clearBypassCookie(opts?: { cookiesApi?: RequestCookies }) {
//   const jar = opts?.cookiesApi ?? cookies();
//   jar.set({
//     name: COOKIE_NAME,
//     value: "",
//     httpOnly: true,
//     sameSite: "lax",
//     secure: process.env.NODE_ENV === "production",
//     path: "/",
//     maxAge: 0,
//   });
// }

// // --- readers + checks (ללא שינוי מהותי) ---
// export function readBypassTokenFromCookiesJar(jar?: RequestCookies) {
//   try {
//     return (jar ?? cookies()).get(COOKIE_NAME)?.value || null;
//   } catch {
//     return null;
//   }
// }
// export function readBypassTokenFromRequest(req: NextRequest) {
//   const raw = req.cookies.get(COOKIE_NAME)?.value;
//   return raw || null;
// }
// export function isBypassActive(): boolean {
//   const token = readBypassTokenFromCookiesJar();
//   if (!token) return false;
//   const data = verify(token);
//   return data?.role === "admin-bypass";
// }
// export function isBypassActiveFromRequest(req: NextRequest): boolean {
//   const token = readBypassTokenFromRequest(req);
//   if (!token) return false;
//   const data = verify(token);
//   return data?.role === "admin-bypass";
// }
// export function requirePaidOrBypass(params: {
//   hasPaid: boolean;
//   req?: NextRequest;
// }) {
//   if (params.hasPaid) return { allowed: true };
//   const active = params.req
//     ? isBypassActiveFromRequest(params.req)
//     : isBypassActive();
//   if (active) return { allowed: true };
//   return { allowed: false, reason: "payment_required" as const };
// }

// src/lib/admin-bypass.ts
import "server-only";
import { cookies, headers } from "next/headers";

const COOKIE_NAME = "maty_admin_bypass";

/** קורא את טוקן ה-bypass מה־cookie באופן תקין (עם await) */
export async function readBypassToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}

/** בדיקת bypass (כולל Header עוקף) — אסינכרוני ועומד בכללי Next 15 */
export async function isBypassActive(): Promise<boolean> {
  try {
    const token = await readBypassToken();
    if (token && token !== "0") return true;

    const hs = await headers();
    if (hs.get("x-maty-admin") === "1") return true;
  } catch {
    // ignore
  }
  return false;
}
