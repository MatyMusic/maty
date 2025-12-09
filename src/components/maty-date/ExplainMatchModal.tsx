"use client";

import { X } from "lucide-react";

type ExplainMatchModalProps = {
  open: boolean;
  onClose: () => void;

  loading?: boolean;
  error?: string | null;

  summary?: string | null;
  bullets?: string[] | null;

  targetName?: string;
  score?: number;
};

export default function ExplainMatchModal({
  open,
  onClose,
  loading = false,
  error,
  summary,
  bullets,
  targetName,
  score,
}: ExplainMatchModalProps) {
  if (!open) return null;

  const hasData = !!summary || (bullets && bullets.length > 0);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="mx-3 w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 shadow-xl border border-black/10 dark:border-white/10 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <h2 className="text-base font-semibold">למה זו התאמה טובה?</h2>
            {targetName && (
              <span className="text-xs text-neutral-500">
                הסבר התאמה עם <span className="font-medium">{targetName}</span>
                {typeof score === "number"
                  ? ` · ציון ${Math.round(score)}`
                  : ""}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full grid place-items-center bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            aria-label="סגור"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading && (
          <div className="py-6 text-sm text-neutral-600 dark:text-neutral-300 flex flex-col items-center gap-2">
            <div className="h-6 w-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            <span>מחשב הסבר חכם להתאמה…</span>
          </div>
        )}

        {!loading && error && (
          <div className="py-4 text-xs text-red-600 dark:text-red-400 bg-red-50/70 dark:bg-red-900/20 rounded-xl px-3">
            {error === "no-data"
              ? "לא הצלחתי לקבל נתוני התאמה. נסה/י שוב מאוחר יותר."
              : "אירעה שגיאה בעת יצירת ההסבר. אפשר לנסות שוב בעוד רגע."}
          </div>
        )}

        {!loading && !error && hasData && (
          <div className="flex flex-col gap-3 text-sm">
            {summary && (
              <p className="text-neutral-800 dark:text-neutral-100">
                {summary}
              </p>
            )}
            {bullets && bullets.length > 0 && (
              <ul className="list-disc pr-4 text-neutral-700 dark:text-neutral-200 space-y-1.5 text-[13px]">
                {bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!loading && !error && !hasData && (
          <div className="py-4 text-xs text-neutral-500">
            אין כרגע נתונים להצגה.
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded-full border border-black/10 dark:border-white/15 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}
