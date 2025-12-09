// src/app/layout.tsx
import "@/styles/matydate.extras.css";
import "@/styles/mm-admin.css";
import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import "./globals.css";

import { heebo } from "./fonts";
import Providers from "./providers";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Topbar from "@/components/layout/Topbar";

import BeatTap from "@/components/audio/BeatTap";
import ClientProviders from "@/components/ClientProviders";
import ClientWidgets from "@/components/ClientWidgets";
import FloatingNotesGlobal from "@/components/decor/FloatingNotesGlobal";
import LangBoot from "@/components/LangBoot";
import OneSignalInit from "@/components/OneSignalInit";
import { PrefsBoot } from "@/components/PrefsBoot";
import { SiteCompanion } from "@/components/site-companion";
import Splash from "@/components/Splash";

// 🎧 נגן PRO – שורש הנגן הגלובלי
import PlayerRoot from "@/components/player/PlayerRoot";

// 🌐 i18n – לוקאל כללי
import LocaleProvider, {
  type Locale,
  LOCALES_SET,
  SUPPORTED_LOCALES,
} from "@/components/common/LocaleProvider";
import { cookies, headers } from "next/headers";

// 🌐 i18n – טקסטים (useT)
import { I18nProvider } from "@/lib/i18n/I18nProvider";

// ✅ BYPASS אסינכרוני
import { isBypassActive as isBypassActiveServer } from "@/lib/admin-bypass";

// ✅ קונטקסט אדמין לקליינט
import { AdminProvider } from "@/contexts/admin";

// ✅ מערכת טוסטים גלובלית
import { ToastProvider } from "@/components/ui/ToastProvider";

/** הפוך את ה-layout לדינמי כי אנחנו קוראים cookies()/headers() בצד שרת */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ======================= SEO / PWA ======================= */
export const metadata: Metadata = {
  title: "MATY MUSIC",
  description: "אתר מוזיקה אינטראקטיבי 3D — MATY MUSIC",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon-192.png" },
  manifest: "/manifest.webmanifest",
  applicationName: "MATY MUSIC",
};
export const viewport: Viewport = { themeColor: "#6d4aff" };

/* ======================= i18n helpers ======================= */
const FALLBACK_LOCALES = ["he", "en", "fr", "ru", "es"] as const;

function isSupportedLocaleInternal(lc: string): lc is Locale {
  const setAny: any = LOCALES_SET as any;
  const arrAny: any = SUPPORTED_LOCALES as any;
  const inSetFn =
    setAny && typeof setAny.has === "function" ? setAny.has(lc) : false;
  const inArr = Array.isArray(arrAny) ? arrAny.includes(lc) : false;
  const inSetAsArray = Array.isArray(setAny) ? setAny.includes(lc) : false;
  const inFallback = (FALLBACK_LOCALES as readonly string[]).includes(lc);
  return inSetFn || inArr || inSetAsArray || inFallback;
}

function normalizeLocale(raw?: string | null): Locale {
  if (!raw) return "he";
  const cand = String(raw).toLowerCase();
  if (isSupportedLocaleInternal(cand)) return cand as Locale;
  const short = cand.split("-")[0];
  if (isSupportedLocaleInternal(short)) return short as Locale;
  return "he";
}

/* ======================= Admin detection (SSR) ======================= */
async function detectIsAdmin(): Promise<boolean> {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions as any);
    const role = (session as any)?.user?.role;
    const flag = (session as any)?.user?.isAdmin === true;
    if (role === "admin" || role === "superadmin" || flag) return true;
  } catch {}
  try {
    if (await isBypassActiveServer()) return true;
  } catch {}

  const hs = await headers();
  const ck = await cookies();

  if (hs.get("x-maty-admin") === "1") return true;
  if (process.env.ALLOW_UNSAFE_ADMIN === "1") return true;

  const roleCookie = ck.get("mm_role")?.value || "";
  if (roleCookie === "admin" || roleCookie === "superadmin") return true;

  const emailCookie = ck.get("mm_email")?.value?.toLowerCase() || "";
  const allow = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (emailCookie && allow.includes(emailCookie)) return true;

  return false;
}

/* ======================= Root layout ======================= */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ⚠️ Next 15: חייבים await
  const cookieStore = await cookies();
  const headerStore = await headers();

  // i18n: mm_locale > NEXT_LOCALE > Accept-Language > he
  const ck = cookieStore.get("mm_locale")?.value || null;
  const ckNext = cookieStore.get("NEXT_LOCALE")?.value || null;
  const al = headerStore.get("accept-language") || "";

  let locale: Locale = "he";
  if (ck || ckNext) {
    locale = normalizeLocale(ck || ckNext || "he");
  } else {
    const parts = al
      .split(",")
      .map((s) => s.split(";")[0]?.trim())
      .filter(Boolean) as string[];
    let chosen: Locale | null = null;
    for (const p of parts) {
      const n = normalizeLocale(p);
      if (n) {
        chosen = n;
        break;
      }
    }
    locale = chosen || "he";
  }

  const dir = locale === "he" ? "rtl" : "ltr";

  // SSR: זיהוי אדמין (כולל bypass)
  const isAdmin = await detectIsAdmin();

  // ✨ סגנון יציב ל-body כדי למנוע hydration mismatch ולשמור גלילה
  const stableBodyStyle: CSSProperties = {
    colorScheme: "light dark",
    overflowY: "auto",
  };

  return (
    <html
      lang={locale}
      dir={dir}
      data-locale={locale}
      data-admin={isAdmin ? "1" : "0"}
      suppressHydrationWarning
    >
      <body
        className={`${heebo.variable} font-sans min-h-screen overflow-x-hidden overflow-y-auto bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased selection:bg-violet-500/20 selection:text-violet-900 dark:selection:bg-violet-400/20 dark:selection:text-white`}
        style={stableBodyStyle}
      >
        {/* חשיפת דגלים ללקוח (לשימוש מהיר) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__MM_IS_ADMIN__ = ${isAdmin ? "true" : "false"};
              window.__MM_LOCALE__ = ${JSON.stringify(locale)};
              document.documentElement.lang = ${JSON.stringify(locale)};
              document.documentElement.dir  = ${JSON.stringify(dir)};
            `,
          }}
        />

        <noscript>
          נדרש JavaScript להפעלה מלאה של האתר. חלק מהפיצ׳רים (כמו העוזר, הנגן,
          והודעות) לא יעבדו בלי JS.
        </noscript>

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-[100] focus:rounded-lg focus:bg-white/90 dark:focus:bg-neutral-900/90 focus:px-3 focus:py-2 focus:shadow"
        >
          דלג לתוכן
        </a>

        {/* ✅ עוטפים את כל האפליקציה ב-ToastProvider כדי לאפשר טוסטים גלובליים */}
        <ToastProvider>
          {/* key=locale מבטיח רענון קליינט כששפה משתנה */}
          <LocaleProvider initialLocale={locale} key={locale}>
            {/* כאן נכנס ה-I18nProvider של useT() */}
            <I18nProvider locale={locale as any}>
              <AdminProvider isAdmin={isAdmin}>
                <Providers>
                  <ClientProviders>
                    <PrefsBoot />
                    <LangBoot />
                    <Splash />

                    <FloatingNotesGlobal
                      density={14}
                      topOffset={0}
                      zIndex={1}
                      opacity={0.26}
                    />

                    <Topbar />
                    <Header />

                    <div
                      id="__mobile_drawer_mount"
                      data-open="0"
                      aria-hidden="true"
                    />

                    {/* שמירת גלילה: אל תעשה כאן position:fixed בשום רכיב גלובלי */}
                    <main
                      id="main"
                      className="min-h-dvh safe-bottom pb-24 md:pb-28"
                    >
                      {children}
                      <div id="footer-sentinel" aria-hidden="true" />
                    </main>

                    <Footer />

                    {!isAdmin && <ClientWidgets />}

                    <SiteCompanion />

                    {/* 🎧 שורש נגן המוזיקה (ProPlayer + queue events) */}
                    <PlayerRoot />

                    {/* BeatTap מתחבר ל-audio עם id="pro-player-audio" */}
                    <BeatTap selector="#pro-player-audio" />
                    <OneSignalInit />
                  </ClientProviders>
                </Providers>
              </AdminProvider>
            </I18nProvider>
          </LocaleProvider>
        </ToastProvider>

        {/* עוגן כללי לפורטלים */}
        <div id="assistant-root" className="z-[99999]" />
      </body>
    </html>
  );
}
