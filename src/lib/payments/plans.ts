// src/lib/payments/plans.ts
export type PlanId = "free" | "plus" | "pro" | "vip";

export type Plan = {
  id: PlanId;
  name: string;
  priceILS: number; // לחודש, דמו
  highlight?: string;
  bullets: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "FREE",
    priceILS: 0,
    bullets: ["צפייה בהתאמות בסיסיות", "לייקים ללא הודעות", "סינון בסיסי"],
  },
  plus: {
    id: "plus",
    name: "PLUS",
    priceILS: 49,
    bullets: ["כל מה שב־FREE", "קריצות (Winks)", "עדיפות קלה בחיפוש"],
  },
  pro: {
    id: "pro",
    name: "PRO",
    priceILS: 79,
    highlight: "הכי פופולרי",
    bullets: ["הודעות צ׳אט ללא הגבלה", "שיחות וידאו 1:1", "סינונים מתקדמים"],
  },
  vip: {
    id: "vip",
    name: "VIP",
    priceILS: 129,
    bullets: ["כל מה שב־PRO", "קידום פרופיל", "תמיכה עדיפה"],
  },
};

export function getPlanOrThrow(id: string | null | undefined): Plan {
  const k = (id || "free").toLowerCase() as PlanId;
  if (!PLANS[k]) throw new Error("Unknown plan: " + id);
  return PLANS[k];
}
