// דף מלא
import { localeMatches, normalizeLocale } from "@/lib/i18n/locale";

export type Creative = {
  id: string;
  title?: string;
  imageUrl?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};
export type Promo = {
  id: string;
  name: string;
  status: "active" | "paused" | "archived";
  type: "banner" | "card" | "inline";
  priority?: "low" | "normal" | "high";
  audience: {
    categories: string[];
    moods: string[];
    tempos: string[];
    bpmMin: number | null;
    bpmMax: number | null;
    locales: string[]; // יכול להכיל "he" או "he-IL"
  };
  schedule: {
    startAt: string | null;
    endAt: string | null;
    timezone: string;
    capping: {
      maxImpressions: number | null;
      dailyCap: number | null;
      perUserCap: number | null;
    };
    pacing: "asap" | "even";
  };
  budget: {
    model: "CPM" | "CPC" | "Flat";
    bid: number | null;
    totalBudget: number | null;
  };
  creatives: Creative[];
  stats: { impressions: number; clicks: number; ctr: number; spends: number };
  createdAt: string;
  updatedAt: string;
};

function creativeOk(c?: Creative) {
  return !!(c && c.imageUrl && c.ctaUrl);
}

export function filterPromosByLocale(items: Promo[], locale: string): Promo[] {
  const want = normalizeLocale(locale);
  return items
    .filter((p) => {
      if (p.status !== "active") return false;
      const locs = p.audience?.locales || [];
      const localeOk =
        locs.length === 0 || locs.some((l) => localeMatches(l, want));
      const crOk = creativeOk(p.creatives?.[0]); // דלג על שבורים
      return localeOk && crOk;
    })
    .sort((a, b) => {
      const pr = (x?: string) => (x === "high" ? 2 : x === "normal" ? 1 : 0);
      return pr(b.priority) - pr(a.priority);
    });
}
