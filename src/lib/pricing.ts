export type CategoryKey = "chabad" | "mizrahi" | "soft" | "fun";

export const CATEGORY_LABEL: Record<CategoryKey, string> = {
  chabad: "חסידי (חב״ד)",
  mizrahi: "מזרחי",
  soft: "שקט",
  fun: "מקפיץ",
};

// מחיר בסיס אחיד
export const BASE_PRICE: Record<CategoryKey, number> = {
  chabad: 2900,
  mizrahi: 2900,
  soft: 2900,
  fun: 2900,
};

export type Addons = {
  // חופה ודיג׳יי הוסרו
  soundSystem?: boolean; // הגברה/סאונד (+₪500)
  extraMusicians?: number; // נגנים נוספים × ₪1,800
};

export type QuoteInput = {
  category: CategoryKey;
  dateISO: string;
  hours: number;
  guests: number;
  distanceKm: number; // רק לבדוק אם >100
  addons: Addons;
  rushDays?: number;
};

export type QuoteBreakdown = {
  base: number;
  extraHours: number;
  audience: number;
  travel: number; // 0 או 100
  addons: number;
  weekend: number;
  rush: number;
  early: number;
  subtotal: number;
  total: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function calcRushDays(dateISO: string): number | undefined {
  try {
    const now = new Date();
    const d = new Date(dateISO + "T00:00:00");
    return Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return undefined;
  }
}

export function calcQuote(input: QuoteInput): QuoteBreakdown {
  const base = BASE_PRICE[input.category] ?? 2900;
  const hours = clamp(input.hours || 6, 1, 24);
  const distanceKm = Math.max(0, input.distanceKm || 0);
  const guests = Math.max(0, input.guests || 0);

  // שעות נוספות – רק מעל 6
  const extraHours = Math.max(0, hours - 6) * 200;

  // קהל – רק מעל 1000
  const audience = guests > 1000 ? 1000 : 0;

  // נסיעה – אם >100 ק״מ תוספת 100 ₪
  const travel = distanceKm > 100 ? 100 : 0;

  // תוספים פעילים בלבד
  const addons =
    (input.addons?.soundSystem ? 500 : 0) +
    Math.max(0, input.addons?.extraMusicians || 0) * 1800;

  // (אופציונלי) שישי/שבת 10%
  let weekend = 0;
  try {
    const day = new Date(input.dateISO + "T00:00:00").getDay();
    if (day === 5 || day === 6) weekend = 0.1;
  } catch {}

  // (אופציונלי) דחוף/מוקדם
  const rd = input.rushDays ?? calcRushDays(input.dateISO) ?? 0;
  const rush = rd >= 0 && rd <= 7 ? 0.1 : 0;
  const early = rd > 60 ? -0.05 : 0;

  const subtotal = base + extraHours + audience + travel + addons;
  const weekendFee = subtotal * weekend;
  const rushFee = subtotal * rush;
  const earlyDisc = subtotal * early;
  const total = Math.round(subtotal + weekendFee + rushFee + earlyDisc);

  return {
    base,
    extraHours,
    audience,
    travel,
    addons,
    weekend: Math.round(weekendFee),
    rush: Math.round(rushFee),
    early: Math.round(earlyDisc),
    subtotal: Math.round(subtotal),
    total,
  };
}
