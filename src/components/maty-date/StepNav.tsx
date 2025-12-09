// src/components/maty-date/StepNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type Step = "home" | "onboarding" | "identity" | "preferences" | "matches";

const LABELS: Record<Exclude<Step, "home">, string> = {
  onboarding: "התחלה",
  identity: "זהות",
  preferences: "העדפות",
  matches: "התאמות",
};

const PATHS: Record<Step, string> = {
  home: "/date",
  onboarding: "/date/onboarding",
  identity: "/date/identity",
  preferences: "/date/preferences",
  matches: "/date/matches",
};

export default function StepNav({
  active, // אופציונלי: אם לא ניתן – יילקח מה־URL
  completed, // אופציונלי: סימון צעדים שהושלמו
}: {
  active?: Step;
  completed?: Partial<Record<Step, boolean>>;
}) {
  const pathname = usePathname();

  // קובע את הצעד הפעיל אם לא נמסר כ־prop
  const current: Step = useMemo(() => {
    if (active) return active;
    // גזירה פשוטה לפי הנתיב
    if (pathname?.startsWith(PATHS.onboarding)) return "onboarding";
    if (pathname?.startsWith(PATHS.identity)) return "identity";
    if (pathname?.startsWith(PATHS.preferences)) return "preferences";
    if (pathname?.startsWith(PATHS.matches)) return "matches";
    return "home";
  }, [active, pathname]);

  const base =
    "inline-flex h-9 items-center gap-2 px-3 rounded-full text-xs border transition-colors " +
    "border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 " +
    "hover:bg-white dark:hover:bg-neutral-800 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50";
  const on =
    "bg-pink-600 text-white hover:bg-pink-700 border-transparent shadow-sm";
  const doneBadge =
    "inline-flex items-center justify-center text-[10px] rounded-full px-1.5 py-0.5 " +
    "bg-emerald-600 text-white";

  const items: { step: Step; label: string }[] = [
    { step: "home", label: "בית MATY-DATE" },
    { step: "onboarding", label: LABELS.onboarding },
    { step: "identity", label: LABELS.identity },
    { step: "preferences", label: LABELS.preferences },
    { step: "matches", label: LABELS.matches },
  ];

  return (
    <nav
      dir="rtl"
      className="mb-6 flex justify-end"
      aria-label="ניווט שלבי הרשמה"
    >
      <ul className="flex flex-wrap gap-2">
        {items.map(({ step, label }) => {
          const href = PATHS[step];
          const isActive = current === step;
          const isDone = !!completed?.[step];

          return (
            <li key={step}>
              <Link
                href={href}
                className={`${base} ${isActive ? on : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="whitespace-nowrap">{label}</span>
                {isDone && <span className={doneBadge}>✓</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
