// src/components/WhatsAppNudge.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  showForMs?: number;      // ברירת מחדל: 20000ms
  coolDownHours?: number;  // לא להפריע שוב: 24 שעות
  position?: "top" | "bottom";
};

const KEY = "mm_whatsapp_nudge_hide_until";

function getWaHref(): string {
  // אם הגדרת קישור פומבי מלא בסביבה — נשתמש בו
  const full = process.env.NEXT_PUBLIC_WHATSAPP_URL;
  if (full) return full;

  // אחרת fallback: עוגן 'צור קשר' עד שיהיה מספר/קישור
  return "/#contact";
}

export default function WhatsAppNudge({
  showForMs = 20000,
  coolDownHours = 24,
  position = "top",
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const until = Number(localStorage.getItem(KEY) || 0);
      const now = Date.now();
      if (until > now) return; // מושתק כרגע
      setVisible(true);
      const t = setTimeout(() => setVisible(false), showForMs);
      return () => clearTimeout(t);
    } catch {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), showForMs);
      return () => clearTimeout(t);
    }
  }, [showForMs]);

  const dismiss = () => {
    setVisible(false);
    try {
      const until = Date.now() + coolDownHours * 60 * 60 * 1000;
      localStorage.setItem(KEY, String(until));
    } catch {}
  };

  if (!visible) return null;

  const pos =
    position === "top"
      ? "top-4 sm:top-6"
      : "bottom-4 sm:bottom-6";

  return (
    <div
      dir="rtl"
      className={`fixed ${pos} right-4 sm:right-6 z-50`}
      role="dialog"
      aria-live="polite"
    >
      <div className="flex items-stretch gap-2 rounded-2xl border border-emerald-500/30 bg-white/90 dark:bg-neutral-900/90 shadow-lg backdrop-blur px-3 py-2">
        <div className="grid place-items-center">
          {/* אייקון ווצאפ קטן */}
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow animate-pulse">
            {/* סימן הודעה */}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 3C7.03 3 3 6.82 3 11.5c0 2.52 1.2 4.77 3.14 6.28L6 22l4.5-1.5c.47.07.95.1 1.44.1 4.97 0 9-3.82 9-8.5S16.97 3 12 3z" />
            </svg>
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">יש לכם שאלה זריזה?</div>
          <div className="text-xs opacity-80">דברו איתנו ב-WhatsApp ונחזור אליכם מהר.</div>
          <div className="mt-1">
            <Link
              href={getWaHref()}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition"
            >
              פתיחת וואטסאפ
              <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>

        <button
          className="ml-1 grid h-7 w-7 place-items-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="סגירה"
          onClick={dismiss}
          title="סגור"
        >
          <span aria-hidden>×</span>
        </button>
      </div>
    </div>
  );
}
