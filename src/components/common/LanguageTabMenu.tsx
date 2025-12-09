"use client";

import * as React from "react";
import { useLocaleClient } from "./useLocaleClient";

type Locale = "he" | "en" | "fr" | "ru";
const LABEL: Record<Locale, string> = {
  he: "HE",
  en: "EN",
  fr: "FR",
  ru: "RU",
};

export default function LanguageTabMenu({
  side = "right", // "right" או "left"
  className = "",
}: {
  side?: "right" | "left";
  className?: string;
}) {
  const { locale, setLocale, allowed } = useLocaleClient();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  async function choose(lc: Locale) {
    await setLocale(lc);
  }

  return (
    <div
      ref={ref}
      className={
        "fixed z-[80] " +
        (side === "right" ? "right-2" : "left-2") +
        " bottom-20 " +
        (className || "")
      }
      dir="rtl"
    >
      {/* לשונית קטנה (כפתור) */}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center justify-center h-10 rounded-full border px-2 text-xs font-bold
                   border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 shadow
                   hover:scale-[1.03] transition"
        title="בחר שפה"
      >
        {/* שתי אותיות של השפה הפעילה */}
        <span className="w-7 text-center">{LABEL[locale]}</span>
        <span
          aria-hidden
          className="ml-1 inline-block rotate-0 transition group-aria-expanded:rotate-180"
        >
          ▾
        </span>
      </button>

      {/* מיני־תפריט אנכי */}
      {open && (
        <div
          role="menu"
          className="mt-1 w-[60px] rounded-xl border border-black/10 dark:border-white/10
                     bg-white/95 dark:bg-neutral-900/95 shadow-lg overflow-hidden"
        >
          {allowed.map((lc) => (
            <button
              key={lc}
              type="button"
              onClick={() => choose(lc)}
              role="menuitemradio"
              aria-checked={locale === lc}
              className={
                "w-full px-2 py-2 text-xs font-bold text-center " +
                (locale === lc
                  ? "bg-violet-500/10 text-violet-700 dark:text-violet-300"
                  : "hover:bg-black/5 dark:hover:bg-white/10")
              }
            >
              {LABEL[lc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
