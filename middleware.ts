// src/middleware.ts
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/* ===================== Locale (no URL prefix) ===================== */
const SUPPORTED_LOCALES = ["he", "en", "fr", "ru"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = "he";
const LOCALE_COOKIE = "mm_locale";

/** מנסה להסיק שפה: cookie -> Accept-Language -> ברירת מחדל */
function detectLocale(req: NextRequest): Locale {
  const c = (req.cookies.get(LOCALE_COOKIE)?.value || "").toLowerCase();
  if (SUPPORTED_LOCALES.includes(c as Locale)) return c as Locale;

  const al = req.headers.get("accept-language") || "";
  const pick = al
    .split(",")
    .map((p) => p.trim().split(";")[0]?.split("-")[0]?.toLowerCase())
    .find((lc) => lc && SUPPORTED_LOCALES.includes(lc as Locale));
  return (pick as Locale) || DEFAULT_LOCALE;
}

/* ===================== Your routes (normalized) ===================== */
const AUTH_ROUTE = "/auth";
const CONSENT_ROUTE = "/legal/consent";
const ADMIN_LOGIN = "/admin/login";
const DATE_ROOT = "/date";
const DATE_DEFAULT = "/date/profile";

const CONSENT_COOKIE = process.env.NEXT_PUBLIC_CONSENT_COOKIE || "md:consent";
const CONSENT_VERSION = process.env.NEXT_PUBLIC_CONSENT_VERSION || "v1";
const DATE_ONBOARDED_COOKIE =
  process.env.NEXT_PUBLIC_DATE_ONBOARDED_COOKIE || "md:date_onboarded";

const SESSION_COOKIE_NAMES = [
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
  "appSession",
];

/* ===================== Helpers ===================== */
function hasSessionCookie(req: NextRequest) {
  return SESSION_COOKIE_NAMES.some((n) => !!req.cookies.get(n)?.value);
}
async function readToken(req: NextRequest) {
  try {
    return await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    return null;
  }
}
function isAdminBypass(req: NextRequest) {
  const c = req.cookies;
  if (c.get("mm-admin")?.value === "1") return true;
  if (c.get("mm_admin")?.value === "1") return true;
  if (c.get("maty_admin_bypass")?.value === "1") return true;

  const hdr = req.headers.get("x-admin-key");
  if (hdr && process.env.ADMIN_KEY && hdr === process.env.ADMIN_KEY)
    return true;

  if (process.env.DEMO_UNLOCK === "1" && process.env.NODE_ENV !== "production")
    return true;
  return false;
}
function hasConsent(req: NextRequest) {
  return (req.cookies.get(CONSENT_COOKIE)?.value || "") === CONSENT_VERSION;
}
function hasDateOnboarded(req: NextRequest) {
  return req.cookies.get(DATE_ONBOARDED_COOKIE)?.value === "1";
}

/* =================================================== */
export async function middleware(req: NextRequest) {
  const url = req.nextUrl; // מאפשר שינויים/הפניות
  let { pathname, search } = url;

  // דלג על סטטיק/API
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/favicon") ||
    /\.[a-z0-9]{2,6}$/i.test(pathname);
  const isApi = pathname.startsWith("/api");
  if (isStatic || isApi) {
    return NextResponse.next();
  }

  /* =============== LANG: ?lang=xx -> cookie + ניקוי URL =============== */
  // אם יש פרמטר ?lang=xx ב-URL, קבע את השפה ונתב מחדש כדי להסיר את הפרמטר.
  const langParam = url.searchParams.get("lang");
  if (langParam && SUPPORTED_LOCALES.includes(langParam as Locale)) {
    const clean = new URL(url);
    clean.searchParams.delete("lang");
    const res = NextResponse.redirect(clean);
    res.cookies.set(LOCALE_COOKIE, langParam, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // שנה
    });
    return res;
  }

  /* =============== 1) ניהול קידומת שפה (Locale Prefix Management) =============== */
  const activeLocale: Locale = detectLocale(req);
  const cNow = (req.cookies.get(LOCALE_COOKIE)?.value || "").toLowerCase();
  let res = NextResponse.next();

  // אם ה-Cookie הנוכחי לא זהה לשפה שזוהתה, עדכן את ה-Cookie.
  if (cNow !== activeLocale) {
    res.cookies.set(LOCALE_COOKIE, activeLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    // ה-Rewrite בהמשך ישלח את ה-Cookie המעודכן.
  }

  // בדוק אם הנתיב כבר מכיל קידומת שפה נתמכת.
  const isLocalePrefixed = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  // אם הנתיב הנוכחי אינו מכיל קידומת שפה, הוסף אותה ב-Rewrite פנימי.
  if (!isLocalePrefixed) {
    const isRoot = pathname === "/";
    const targetPath = isRoot
      ? `/${activeLocale}`
      : `/${activeLocale}${pathname}`;

    // מבצעים Rewrite פנימי: ה-URL בדפדפן נשאר /about, אבל Next.js טוען מ-/[locale]/about
    const rewrittenUrl = req.nextUrl.clone();
    rewrittenUrl.pathname = targetPath;

    // משתמשים ב-NextResponse.rewrite על אובייקט ה-res כדי לשמר את ה-Cookie.
    res = NextResponse.rewrite(rewrittenUrl);

    // עדכון המשתנים המקומיים לטיפול נכון בהפניות הבאות (הנתיב המעובד)
    pathname = targetPath;
  }
  /* =================================================== */

  // שמור מסלול מלא ל־next=xxx בהפניות
  const fromFull = pathname + search;

  const token = await readToken(req);
  const role = (token as any)?.role as
    | "user"
    | "admin"
    | "superadmin"
    | "moderator"
    | undefined;
  const isAuthed = !!token || hasSessionCookie(req);

  // הערה: שאר בדיקות הניתוב (2-7) משתמשות כעת ב-`pathname` שכבר עבר Rewrite (כלומר, הוא מכיל קידומת שפה).

  /* =============== 2) דף הסכמה תמיד מותר =============== */
  if (
    pathname.startsWith(CONSENT_ROUTE) ||
    pathname.startsWith("/api/legal/consent")
  ) {
    return res;
  }

  /* =============== 3) אזור אדמין =============== */
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const allowed =
      (!!token && (role === "admin" || role === "superadmin")) ||
      isAdminBypass(req);
    const isAdminLoginLike =
      pathname === ADMIN_LOGIN ||
      pathname.startsWith("/api/admin/login") ||
      pathname.startsWith("/api/admin/status") ||
      pathname.startsWith("/api/admin/bypass") ||
      pathname.startsWith("/api/admin/unbypass");

    if (isAdminLoginLike) return res;

    if (pathname.startsWith("/api/admin")) {
      if (!allowed) {
        return NextResponse.json(
          { ok: false, error: "unauthorized" },
          { status: 401 },
        );
      }
      return res;
    }

    if (!allowed) {
      const to = req.nextUrl.clone();
      to.pathname = ADMIN_LOGIN;
      to.searchParams.set("next", fromFull);
      return NextResponse.redirect(to);
    }
    return res;
  }

  /* =============== 4) /auth – עם חריגים ל-signup/welcome =============== */
  if (pathname.startsWith(AUTH_ROUTE)) {
    const isSignup = pathname.startsWith("/auth/signup");
    const isWelcome = pathname.startsWith("/auth/welcome");

    // את דפי ההרשמה והשקופית אנחנו מאפשרים גם בלי הסכמה
    if (isSignup || isWelcome) {
      return res;
    }

    // שאר /auth עדיין דורשים consent לפני
    if (!hasConsent(req)) {
      const to = req.nextUrl.clone();
      to.pathname = CONSENT_ROUTE;
      to.searchParams.set("next", fromFull);
      return NextResponse.redirect(to);
    }
    return res;
  }

  /* =============== 5) /dashboard דורש התחברות =============== */
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthed) {
      const to = req.nextUrl.clone();
      to.pathname = AUTH_ROUTE;
      to.searchParams.set("next", fromFull);
      return NextResponse.redirect(to);
    }
    return res;
  }

  /* =============== 6) שער MATY-DATE =============== */
  if (pathname.startsWith(DATE_ROOT)) {
    if (pathname === DATE_ROOT || pathname === DATE_ROOT + "/") {
      const force = req.nextUrl.searchParams.get("force") === "1";
      if (force) return res;

      if (hasConsent(req) && isAuthed && hasDateOnboarded(req)) {
        const next = req.nextUrl.searchParams.get("next") || DATE_DEFAULT;
        const to = req.nextUrl.clone();
        to.pathname = next;
        return NextResponse.redirect(to);
      }
      return res;
    }

    if (!hasConsent(req)) {
      const to = req.nextUrl.clone();
      to.pathname = CONSENT_ROUTE;
      to.searchParams.set("next", fromFull);
      return NextResponse.redirect(to);
    }
    if (!isAuthed) {
      const to = req.nextUrl.clone();
      to.pathname = AUTH_ROUTE;
      to.searchParams.set("next", fromFull);
      return NextResponse.redirect(to);
    }
    return res;
  }

  /* =============== 7) שער Farbrengen (אם צריך) =============== */
  if (
    pathname.startsWith("/farbrengen") ||
    pathname.startsWith("/api/farbrengen")
  ) {
    if (!hasConsent(req)) {
      const to = req.nextUrl.clone();
      to.pathname = CONSENT_ROUTE;
      to.searchParams.set("next", fromFull);
      return NextResponse.redirect(to);
    }
    if (!isAuthed) {
      const to = req.nextUrl.clone();
      to.pathname = AUTH_ROUTE;
      to.searchParams.set("next", fromFull);
      return NextResponse.redirect(to);
    }
    return res;
  }

  // ברירת מחדל
  return res;
}

/* ✅ הפעלה בכל מסלולים שאינם סטטיק/API */
export const config = {
  matcher: ["/((?!_next|api|assets|favicon|.*\\..*).*)"],
};
