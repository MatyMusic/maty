"use client";

import * as React from "react";

type Locale = "he" | "en" | "fr" | "ru";

const LABEL: Record<Locale, string> = {
  he: "עברית",
  en: "English",
  fr: "Français",
  ru: "Русский",
};

export default function LanguageSwitcher({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const [busy, setBusy] = React.useState<Locale | null>(null);

  async function setLocale(lc: Locale) {
    try {
      setBusy(lc);
      const r = await fetch("/api/locale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: lc }),
      });
      // רענון מלא כדי לקבל SSR של dir/lang + תרגומים
      if (r.ok) {
        window.location.reload();
      } else {
        setBusy(null);
        alert("שינוי שפה נכשל. נסה שוב.");
      }
    } catch {
      setBusy(null);
      alert("שגיאה בשינוי השפה.");
    }
  }

  const btnBase =
    "inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold " +
    "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 " +
    "border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 hover:bg-white/95 dark:hover:bg-neutral-800";

  const pillBase =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium mr-1.5 " +
    "border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70";

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div
      className={
        "flex items-center gap-1.5 " +
        (compact ? "text-[11px]" : "text-xs") +
        (className ? " " + className : "")
      }
      role="group"
      aria-label="Language switcher"
    >
      {children}
    </div>
  );

  if (compact) {
    return (
      <Wrapper>
        {(["he", "en", "fr", "ru"] as Locale[]).map((lc) => (
          <button
            key={lc}
            type="button"
            onClick={() => setLocale(lc)}
            aria-label={`Change language to ${LABEL[lc]}`}
            className={pillBase}
            disabled={busy === lc}
          >
            {busy === lc ? "…" : LABEL[lc]}
          </button>
        ))}
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      {(["he", "en", "fr", "ru"] as Locale[]).map((lc) => (
        <button
          key={lc}
          type="button"
          onClick={() => setLocale(lc)}
          aria-label={`Change language to ${LABEL[lc]}`}
          className={btnBase}
          disabled={busy === lc}
        >
          {busy === lc ? "…" : LABEL[lc]}
        </button>
      ))}
    </Wrapper>
  );
}
