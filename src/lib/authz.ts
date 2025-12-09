// src/lib/authz.ts
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

/** ================== Types ================== */
export type Tier = "free" | "plus" | "pro" | "vip";
export type ActiveSub = {
  status: "active" | "inactive";
  tier: Tier;
  until?: string;
  provider?: "manual" | "cardcom" | "paypal" | "manual-demo";
};

/** ================== next-auth (אופציונלי) ==================
 * נטען דינמית כדי לא לשבור בנייה אם next-auth לא קיים.
 */
async function getServerSessionSafe(): Promise<any | null> {
  try {
    // ייבוא דינמי – אם אין next-auth בפרויקט, זה יתפס ב-catch.
    const mod = await import("next-auth");
    // בגרסאות חדשות getServerSession לא דורש options; אם יש לך authOptions, ננסה גם אותו.
    try {
      const { authOptions } = await import("@/lib/auth");
      return await (mod as any).getServerSession(authOptions as any);
    } catch {
      return await (mod as any).getServerSession();
    }
  } catch {
    return null;
  }
}

/** ================== Helpers ================== */
function rank(t: Tier) {
  return t === "vip" ? 3 : t === "pro" ? 2 : t === "plus" ? 1 : 0;
}

function isEmailAdmin(email?: string | null) {
  if (!email) return false;
  const raw = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").toLowerCase();
  const allow = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}

function isUserAdminShape(user: any): boolean {
  // תומך גם בתרחישים בהם user.role או user.isAdmin מגיעים מה-DB/Provider
  return (
    user?.role === "admin" ||
    user?.role === "superadmin" ||
    user?.isAdmin === true ||
    isEmailAdmin(user?.email || null)
  );
}

/** ================== Public API ================== */

/** מחזיר סשן (אם יש next-auth). אם אין – null. */
export async function getSessionSafe() {
  return await getServerSessionSafe();
}

/** בדיקת אדמין על בסיס session (אם קיים) */
export function isAdminFromSession(session: any): boolean {
  const user = session?.user;
  return isUserAdminShape(user);
}

/** בדיקת אדמין על בסיס הבקשה (cookie BYPASS -> תמיד אדמין) או session */
export async function isAdminFromRequest(req?: NextRequest): Promise<boolean> {
  const c = await cookies();
  if (c.get("maty_admin_bypass")?.value === "1") return true; // BYPASS עוקף הכול

  const session = await getServerSessionSafe();
  if (session && isAdminFromSession(session)) return true;

  // ניתן להרחיב כאן: קריאת טוקן JWT, וכו׳
  return false;
}

/** זיהוי משתמש מהבקשה:
 * 1) מסשן next-auth (אם קיים)
 * 2) מקוקי "uid" אם הגדרת
 * 3) פולי־בק לדמו
 */
export async function getUserIdFromReq(_req?: NextRequest): Promise<string> {
  const session = await getServerSessionSafe();
  const uidFromSession =
    (session?.user as any)?.id ||
    (session?.user as any)?.userId ||
    (session?.user as any)?.email ||
    null;
  if (uidFromSession) return String(uidFromSession);

  const c = await cookies();
  const uidCookie = c.get("uid")?.value;
  if (uidCookie) return uidCookie;

  // TODO: חבר למערכת האימות שלך
  return "me@example.com";
}

/** שליפת סטטוס מנוי (חבר ל-DB שלך) */
export async function getActiveSubscription(
  _userId: string,
): Promise<ActiveSub> {
  // TODO: תחליף בקריאה אמיתית ל-DB/Provider שלך
  return { status: "inactive", tier: "free" };
}

/** שמירת Paywall/Plan:
 * - DEMO_UNLOCK=1 -> פותח הכל
 * - maty_admin_bypass=1 -> נחשב VIP
 * - אחרת, בדיקת מנוי אמיתי
 */
export async function requireActivePlan(
  req: NextRequest,
  minTier: Tier = "plus",
) {
  const userId = await getUserIdFromReq(req);

  // 1) DEMO_UNLOCK פותח הכול (ל-LIVE דמו)
  if (process.env.DEMO_UNLOCK === "1") {
    return {
      ok: true as const,
      userId,
      sub: {
        status: "active",
        tier: "vip",
        until: "2099-01-01T00:00:00.000Z",
        provider: "manual-demo",
      } satisfies ActiveSub,
    };
  }

  // 2) BYPASS בקוקי -> VIP
  const c = await cookies();
  const isBypass = c.get("maty_admin_bypass")?.value === "1";
  if (isBypass) {
    return {
      ok: true as const,
      userId,
      sub: {
        status: "active",
        tier: "vip",
        until: "2099-01-01T00:00:00.000Z",
        provider: "manual-demo",
      } satisfies ActiveSub,
    };
  }

  // 3) מנוי אמיתי
  const sub = await getActiveSubscription(userId);
  if (sub.status !== "active") {
    return {
      ok: false as const,
      status: 402,
      error: "payment_required" as const,
      upgrade: "/date/upgrade?reason=inactive",
    };
  }
  if (rank(sub.tier) < rank(minTier)) {
    return {
      ok: false as const,
      status: 402,
      error: "upgrade_required" as const,
      upgrade: "/date/upgrade?reason=insufficient_tier",
    };
  }

  return { ok: true as const, userId, sub };
}

/** ===== מקל: בדיקת אדמין מה-session שקיבלת כבר (ללקוחות/Server Actions) ===== */
export function isAdminFromUser(user: any): boolean {
  return isUserAdminShape(user);
}
