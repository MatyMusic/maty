"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const SUPPORTED = ["he", "en", "ru", "es", "fr"] as const;

export default function LanguageSwitch({
  initial = "he",
  size = "sm",
}: {
  initial?: string;
  size?: "sm" | "md";
}) {
  const [value, setValue] = useState(
    SUPPORTED.includes(initial as any) ? initial : "he",
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function safeSetCookieClient(lc: string) {
    try {
      // Fallback במקרה שה־API לא נגיש (NetworkError)
      document.cookie = `mm_locale=${lc}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    } catch {}
  }

  async function apply(next: string) {
    setValue(next);
    try {
      const url = "/api/locale"; // same-origin
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
        // keepalive עוזר אם משנים שפה ומיד יוצאים מהדף
        keepalive: true,
      });
    } catch (err) {
      // NetworkError → נקבע קוקי בצד לקוח כדי שלא תיתקע
      await safeSetCookieClient(next);
    }

    startTransition(() => router.refresh());
  }

  const cls = size === "sm" ? "h-9 px-3 text-sm" : "h-10 px-4 text-[15px]";

  return (
    <div className="relative">
      <select
        dir="ltr"
        aria-label="Language"
        className={[
          "rounded-full border border-amber-400/50 dark:border-amber-300/30",
          "bg-white/85 dark:bg-neutral-900/75 shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-amber-400/40",
          cls,
        ].join(" ")}
        value={value}
        disabled={pending}
        onChange={(e) => apply(e.target.value)}
      >
        {SUPPORTED.map((lc) => (
          <option key={lc} value={lc}>
            {lc.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
