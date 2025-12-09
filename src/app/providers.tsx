"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster, toast } from "react-hot-toast";
import NProgress from "nprogress";
import { usePathname, useSearchParams } from "next/navigation";

// אם אין לך את הקומפניון – מחק את שתי השורות הבאות ושימוש בו למטה
import { CompanionProvider } from "@/components/site-companion";

// ---- NProgress base config (פעם אחת) ----
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 150,
  minimum: 0.12,
});

// דגלים מה־ENV בצד לקוח
const COMPANION_ON =
  process.env.NEXT_PUBLIC_COMPANION_SHOW_ON_AUTH === "1" ||
  process.env.NEXT_PUBLIC_COMPANION_SHOW_ON_AUTH === "true";

// ===== Toast Bridge =====
function ToastBridge() {
  React.useEffect(() => {
    const onToast = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const {
        type = "success",
        text = "",
        id,
        duration,
      } = d as {
        type?: "success" | "error" | "loading" | "info" | "blank";
        text?: string;
        id?: string;
        duration?: number;
      };
      const opts: any = { id, duration };
      if (type === "loading") toast.loading(text, opts);
      else if (type === "error") toast.error(text, opts);
      else if (type === "success") toast.success(text, opts);
      else toast(text, opts);
    };
    const onDismiss = (e: Event) => {
      const id = (e as CustomEvent).detail?.id as string | undefined;
      id ? toast.dismiss(id) : toast.dismiss();
    };
    window.addEventListener("mm:toast", onToast as EventListener);
    window.addEventListener("mm:toast:dismiss", onDismiss as EventListener);
    return () => {
      window.removeEventListener("mm:toast", onToast as EventListener);
      window.removeEventListener(
        "mm:toast:dismiss",
        onDismiss as EventListener,
      );
    };
  }, []);
  return null;
}

// ===== Progress Bridge (App Router) =====
function ProgressBridge() {
  const pathname = usePathname();
  const search = useSearchParams();

  // טריגר על כל ניווט App Router
  React.useEffect(() => {
    // מניעת הבהוב מיותר אם אותו נתיב
    NProgress.start();
    const t = setTimeout(() => NProgress.done(), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search?.toString()]);

  // לפני רענון/יציאה
  React.useEffect(() => {
    const onBeforeUnload = () => {
      try {
        NProgress.start();
      } catch {}
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // שליטה ידנית מחוץ לריאקט
  React.useEffect(() => {
    const onStart = () => NProgress.start();
    const onDone = () => NProgress.done();
    window.addEventListener("mm:progress:start", onStart);
    window.addEventListener("mm:progress:done", onDone);
    return () => {
      window.removeEventListener("mm:progress:start", onStart);
      window.removeEventListener("mm:progress:done", onDone);
    };
  }, []);

  return null;
}

// ===== Theme Bridge =====
function ThemeBridge() {
  const { setTheme } = useTheme();
  React.useEffect(() => {
    const onSet = (e: Event) => {
      const val = (e as CustomEvent).detail?.theme as
        | "light"
        | "dark"
        | "system"
        | undefined;
      if (val) setTheme(val);
    };
    window.addEventListener("mm:theme:set", onSet as EventListener);
    return () =>
      window.removeEventListener("mm:theme:set", onSet as EventListener);
  }, [setTheme]);
  return null;
}

// ===== Safe Hydrate Wrapper (מקטין אזהרות Hydration) =====
function SafeHydrate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) {
    // משאיר className/dir כדי לשמור RTL בזמן Hydration
    return (
      <div
        suppressHydrationWarning
        className="rtl"
        dir="rtl"
        style={{ visibility: "hidden" }}
      />
    );
  }
  return <>{children}</>;
}

// ===== Optional Companion Wrapper =====
function MaybeCompanion({ children }: { children: React.ReactNode }) {
  return COMPANION_ON ? (
    <CompanionProvider>{children}</CompanionProvider>
  ) : (
    <>{children}</>
  );
}

// ===== Providers Root =====
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        enableColorScheme
        storageKey="mm-theme"
        disableTransitionOnChange
      >
        {/* גלובלי ל־NProgress (Light/Dark) */}
        <style jsx global>{`
          #nprogress .bar {
            background: var(--mm-np-color, #6d4aff);
            height: 2px;
          }
          #nprogress .peg {
            box-shadow:
              0 0 10px var(--mm-np-color, #6d4aff),
              0 0 5px var(--mm-np-color, #6d4aff);
          }
        `}</style>

        <ThemeBridge />

        <SafeHydrate>
          <MaybeCompanion>
            <ProgressBridge />

            {/* התוכן */}
            <div className="rtl" dir="rtl">
              {children}
            </div>

            {/* Toasts */}
            <ToastBridge />
            <Toaster
              position="top-center"
              reverseOrder={false}
              containerClassName="rtl"
              toastOptions={{
                duration: 3500,
                style: { direction: "rtl" },
                className:
                  "rounded-xl border shadow-md bg-white/90 text-slate-900 " +
                  "dark:bg-neutral-900/90 dark:text-slate-100 " +
                  "border-black/10 dark:border-white/10",
                success: {
                  iconTheme: { primary: "#10b981", secondary: "#ffffff" },
                },
                error: {
                  iconTheme: { primary: "#ef4444", secondary: "#ffffff" },
                },
              }}
            />
          </MaybeCompanion>
        </SafeHydrate>
      </ThemeProvider>
    </SessionProvider>
  );
}
