// src/components/Splash.tsx
"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DISABLE_SPLASH =
  process.env.NEXT_PUBLIC_DISABLE_SPLASH === "1" ||
  process.env.NEXT_PUBLIC_DISABLE_SPLASH === "true";

export default function Splash() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const search = useSearchParams();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const force = search.get("auth") === "1";
  const isAuthPage = pathname.startsWith("/auth");
  const from = useMemo(() => search.get("from") || "/", [search]);

  // אם מחובר ויש ?auth – ננקה את הפרמטר לאחר mount
  useEffect(() => {
    if (!mounted) return;
    if (status === "authenticated" && force) {
      const params = new URLSearchParams(search);
      params.delete("auth");
      router.replace(
        `${pathname}${params.size ? `?${params.toString()}` : ""}`,
        { scroll: false }
      );
    }
  }, [mounted, status, force, pathname, router, search]);

  // נעילת גלילה רק כשפתוח
  useEffect(() => {
    if (!mounted) return;
    const open =
      !DISABLE_SPLASH && force && !isAuthPage && status === "unauthenticated";
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted, status, force, isAuthPage]);

  if (!mounted || DISABLE_SPLASH || isAuthPage) return null;
  if (status === "loading") return null;

  const open = force && status === "unauthenticated";
  if (!open) return null;

  function closeAsGuest() {
    const params = new URLSearchParams(search);
    params.delete("auth"); // משאירים from ושאר פרמטרים
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
  }

  const firstBtnRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    firstBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAsGuest();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="splash-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="splash-title"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeAsGuest();
        }}
      >
        <motion.div
          initial={{ y: 16, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 8, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="w-[min(92vw,560px)] rounded-2xl p-6 bg-white dark:bg-neutral-950 border border-black/10 dark:border-white/10 text-center space-y-4 shadow-2xl pointer-events-auto"
        >
          <img
            src="/assets/logo/maty-music-wordmark.svg"
            alt="MATY MUSIC"
            className="mx-auto h-12"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />

          <h1 id="splash-title" className="text-2xl font-extrabold">
            התחברו או הירשמו
          </h1>
          <p className="text-sm opacity-80">
            כדי להזמין אירוע, לשמור פלייליסטים וליהנות מהחוויה המלאה
          </p>

          <div className="space-y-2">
            <button
              ref={firstBtnRef}
              onClick={() => signIn("google", { callbackUrl: from || "/" })}
              className="btn w-full"
              type="button"
            >
              המשך עם Google
            </button>

            <div className="flex gap-2">
              <Link
                href={`/auth?mode=login&from=${encodeURIComponent(from)}`}
                className="btn w-1/2 border"
                prefetch={false}
              >
                כניסה
              </Link>
              <Link
                href={`/auth?mode=register&from=${encodeURIComponent(from)}`}
                className="btn w-1/2"
                prefetch={false}
              >
                הרשמה
              </Link>
            </div>

            <button
              onClick={closeAsGuest}
              className="block w-full text-xs opacity-70 hover:opacity-100 underline decoration-dotted mt-1"
              type="button"
            >
              אולי אחר כך — המשך כאורח/ת
            </button>
          </div>

          <div className="text-[11px] opacity-60">
            בלחיצה אתם מאשרים את{" "}
            <Link href="/terms" className="underline">
              תנאי השימוש
            </Link>{" "}
            ו־{" "}
            <Link href="/privacy" className="underline">
              מדיניות הפרטיות
            </Link>
            .
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
