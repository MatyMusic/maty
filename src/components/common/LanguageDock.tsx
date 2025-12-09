// src/components/common/LanguageDock.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LANGS = [
  { code: "he", label: "HE", title: "עברית" },
  { code: "en", label: "EN", title: "English" },
  { code: "ru", label: "RU", title: "Русский" },
  { code: "es", label: "ES", title: "Español" },
  { code: "fr", label: "FR", title: "Français" },
] as const;

function useCurrentLocale() {
  const [cur, setCur] = useState<string>("he");
  useEffect(() => {
    const ck = document.cookie
      .split("; ")
      .find((c) => c.startsWith("mm_locale="));
    const fromCookie = ck?.split("=")[1];
    const fromHtml = document.documentElement.lang || "he";
    setCur((fromCookie || fromHtml || "he").toLowerCase());
  }, []);
  return cur;
}

function setLocale(code: string) {
  try {
    document.cookie = `mm_locale=${code}; path=/; max-age=31536000; samesite=lax`;
  } catch {}
  window.location.reload();
}

export default function LanguageDock() {
  const cur = useCurrentLocale();

  // ----- Desktop side-tab (left-center) -----
  const [open, setOpen] = useState(false);
  const desktopRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!desktopRef.current) return;
      if (!desktopRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  // ----- Mobile FAB popover -----
  const [mOpen, setMOpen] = useState(false);

  return (
    <>
      {/* Desktop: side tab */}
      <div
        ref={desktopRef}
        className="hidden md:block fixed left-0 top-1/2 -translate-y-1/2 z-[80]"
        aria-label="בחירת שפה"
      >
        {/* ידית צרה שלא מפריעה */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="group ml-[-4px] rounded-r-xl px-2 py-3 text-xs font-semibold
                     backdrop-blur bg-white/40 dark:bg-neutral-900/40 border border-l-0
                     border-black/10 dark:border-white/10 shadow-card hover:bg-white/60
                     dark:hover:bg-neutral-800/60 focus:outline-none focus:ring-2 ring-brand"
          title="שפה"
        >
          <span className="sr-only">בחר שפה</span>
          <span aria-hidden>🌐</span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: -16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -16, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="mt-2 ml-[-4px] rounded-2xl pl-3 pr-2 py-2
                         backdrop-blur bg-white/60 dark:bg-neutral-900/60
                         border border-black/10 dark:border-white/10 shadow-card"
            >
              <div className="flex flex-col gap-1">
                {LANGS.map((l) => {
                  const active = cur === l.code;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLocale(l.code)}
                      title={l.title}
                      aria-pressed={active}
                      className={[
                        "h-9 px-3 rounded-full text-xs font-semibold text-left transition border",
                        active
                          ? "bg-black/80 text-white dark:bg-white/90 dark:text-neutral-900 border-transparent"
                          : "bg-white/30 dark:bg-neutral-800/30 border-black/10 dark:border-white/10 hover:bg-white/60 dark:hover:bg-neutral-800/60",
                      ].join(" ")}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile: FAB bottom-left + popover */}
      <div
        className="md:hidden fixed left-4 bottom-5 z-[80]"
        aria-label="בחירת שפה"
      >
        <button
          type="button"
          onClick={() => setMOpen((v) => !v)}
          aria-expanded={mOpen}
          className="h-12 w-12 rounded-full flex items-center justify-center text-lg
                     backdrop-blur bg-white/60 dark:bg-neutral-900/60 border
                     border-black/10 dark:border-white/10 shadow-card active:scale-[.98]"
          title="שנה שפה"
        >
          🌐
        </button>

        <AnimatePresence>
          {mOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="mt-2 rounded-2xl px-2 py-2
                         backdrop-blur bg-white/70 dark:bg-neutral-900/70
                         border border-black/10 dark:border-white/10 shadow-card"
            >
              <div className="flex gap-1">
                {LANGS.map((l) => {
                  const active = cur === l.code;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLocale(l.code)}
                      title={l.title}
                      aria-pressed={active}
                      className={[
                        "h-9 px-3 rounded-full text-xs font-semibold transition border",
                        active
                          ? "bg-black/80 text-white dark:bg-white/90 dark:text-neutral-900 border-transparent"
                          : "bg-white/30 dark:bg-neutral-800/30 border-black/10 dark:border-white/10 hover:bg-white/60 dark:hover:bg-neutral-800/60",
                      ].join(" ")}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
