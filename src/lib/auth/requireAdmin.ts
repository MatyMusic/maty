// src/lib/auth/requireAdmin.ts
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export type Allowed = "admin" | "superadmin";

const ORDER: Record<Allowed, number> = {
  admin: 1,
  superadmin: 2,
};

export type RequireAdminOpts = {
  /** לאן להפנות אם אין הרשאה */
  signInRedirect?: string;
};

/* ------------------------------------------------------------------ */
/*  BYPASS – מאובטח יותר + תואם Next 15                               */
/* ------------------------------------------------------------------ */

/**
 * האם בכלל מותר להשתמש ב-bypass לפי env.
 */
function isBypassEnabledInEnv() {
  const env = process.env.NODE_ENV;
  const explicitAdminBypass =
    process.env.ADMIN_BYPASS_ENABLED === "1" ||
    process.env.NEXT_PUBLIC_ADMIN_BYPASS_ENABLED === "1";

  if (env === "production") {
    // בפרודקשן – רק אם במודע פתחת ADMIN_BYPASS_ENABLED
    return explicitAdminBypass;
  }

  // לא פרודקשן – מקלים, בשביל demo / dev
  if (
    explicitAdminBypass ||
    process.env.DEMO_UNLOCK === "1" ||
    process.env.ALLOW_UNSAFE_ADMIN === "1"
  ) {
    return true;
  }

  return false;
}

/**
 * שימוש ב-cookies()/headers() *עם await* כפי ש-Next 15 דורש
 */
async function isBypass(): Promise<boolean> {
  if (!isBypassEnabledInEnv()) return false;

  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieBypass =
    cookieStore.get("maty_admin_bypass")?.value === "1" ||
    cookieStore.get("mm-admin")?.value === "1";

  const headerBypass =
    headerStore.get("x-maty-admin") === "1" ||
    headerStore.get("x-maty-admin-bypass") === "1";

  return Boolean(cookieBypass || headerBypass);
}

/* ------------------------------------------------------------------ */
/*  פונקציות עזר                                                      */
/* ------------------------------------------------------------------ */

async function getAdminSession() {
  try {
    const session = await getServerSession(authOptions as any);
    return session as any;
  } catch (err) {
    console.error("[requireAdmin] getServerSession failed:", err);
    return null;
  }
}

function hasRequiredRole(role: Allowed | undefined, minRole: Allowed): boolean {
  if (!role) return false;
  const current = ORDER[role] || 0;
  const required = ORDER[minRole] || Infinity;
  return current >= required;
}

async function checkAdminAccess(minRole: Allowed) {
  // קודם מנסים session רגיל
  const session = await getAdminSession();
  const role = (session as any)?.user?.role as Allowed | undefined;

  if (hasRequiredRole(role, minRole)) {
    return {
      ok: true as const,
      role: role!,
      session,
      source: "session" as const,
    };
  }

  // fallback ל-bypass (אם מותר בסביבה)
  const bypass = await isBypass();
  if (bypass) {
    return {
      ok: true as const,
      role: "superadmin" as Allowed,
      session: null,
      source: "bypass" as const,
    };
  }

  return {
    ok: false as const,
    role: undefined,
    session: null,
    source: "none" as const,
  };
}

/* ------------------------------------------------------------------ */
/*  requireAdmin – לשימוש בדפי App Router                             */
/* ------------------------------------------------------------------ */

export async function requireAdmin(
  minRole: Allowed = "admin",
  opts: RequireAdminOpts = {},
) {
  const signInRedirect = opts.signInRedirect ?? "/auth?from=/admin";

  const res = await checkAdminAccess(minRole);

  if (res.ok) {
    // אצלך החזרת פשוט session; נשמור על זה
    if (res.session) return res.session;
    // אם זה bypass – נחזיר אובייקט "fake session"
    return { user: { role: res.role } } as any;
  }

  // ❌ אין הרשאה – redirect לעמוד התחברות
  redirect(signInRedirect);
}

/* ------------------------------------------------------------------ */
/*  requireAdminAPI – לשימוש ב-API                                    */
/* ------------------------------------------------------------------ */

/** גרסת API שמחזירה JSON במקום redirect */
export async function requireAdminAPI(minRole: Allowed = "admin") {
  const res = await checkAdminAccess(minRole);

  if (res.ok) {
    return {
      ok: true as const,
      role: res.role,
      session: res.session,
      source: res.source,
    };
  }

  return { ok: false as const, status: 401, error: "unauthorized" as const };
}
