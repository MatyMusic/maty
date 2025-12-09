// src/lib/date/plans.ts
export type BillingPeriod = "monthly" | "quarterly";
export type Tier = "free" | "plus" | "pro" | "vip";

export type PlanCatalogItem = {
  tier: Tier;
  slug: string; // ל־URL ו־query
  title: string; // שם המסלול להצגה
  subtitle: string; // שורה “שיווקית”
  monthlyILS: number; // מחיר חודשי (₪)
  quarterlyILS: number; // מחיר לרבעון (₪) — מוזל
  features: string[]; // פיצ'רים בעברית
  badge?: string; // תגית, למשל "פופולרי"
  mostPopular?: boolean;
  gradient: string; // מחלקות Tailwind לרקע
};

// שמות מוצעים בסגנון המותג (שאלת "צריך למצוא שם מתאים ל-MATY-…"):
// FREE:  MATY-START
// PLUS:  MATY-PLUS
// PRO:   MATY-MATCH  ← המלצה! קצר, ברור, וליבה חכמה
// VIP:   MATY-VIP

export function getPlanCatalog(): PlanCatalogItem[] {
  return [
    {
      tier: "free",
      slug: "maty-start",
      title: "MATY-START",
      subtitle: "התחלה חכמה, חינם",
      monthlyILS: 0,
      quarterlyILS: 0,
      features: [
        "יצירת פרופיל בסיסי ותמונה",
        "חיפוש ידני בסיסי",
        "העדפות התאמה בסיסיות",
        "צפייה במועמדים מוגבלת",
      ],
      gradient:
        "bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-900 dark:to-neutral-950",
    },
    {
      tier: "plus",
      slug: "maty-plus",
      title: "MATY-PLUS",
      subtitle: "כלי התאמה חכמים + עדיפות",
      monthlyILS: 39,
      quarterlyILS: 105, // ~10% הנחה
      features: [
        "פילטרים מתקדמים (עיר/ארץ/זרם וכו׳)",
        "דוחות התאמה בסיסיים",
        "העלאת עד 8 תמונות",
        "עדכון עדיפויות התאמה חכם",
      ],
      badge: "משתלם",
      mostPopular: true,
      gradient:
        "bg-gradient-to-br from-amber-200/80 via-amber-100 to-yellow-50 dark:from-amber-900/30 dark:via-amber-800/20 dark:to-amber-950/20",
    },
    {
      tier: "pro",
      slug: "maty-match",
      title: "MATY-MATCH",
      subtitle: "התאמות מונחות + ליווי",
      monthlyILS: 89,
      quarterlyILS: 240,
      features: [
        "ציון התאמה חכם + הסברים",
        "התראות בזמן אמת",
        "שמירת מועמדים ומעקב",
        "עדיפות לתיאום פגישות",
      ],
      gradient:
        "bg-gradient-to-br from-emerald-200/80 via-teal-100 to-emerald-50 dark:from-emerald-900/30 dark:via-teal-900/20 dark:to-emerald-950/20",
    },
    {
      tier: "vip",
      slug: "maty-vip",
      title: "MATY-VIP",
      subtitle: "ליווי פרימיום + שדכנית",
      monthlyILS: 199,
      quarterlyILS: 540,
      features: [
        "ליווי אישי ע״י שדכנית מוסמכת",
        "קדימות בתוצאות ובתורים",
        "שיחות ייעוץ ומיקוד",
        "דוח התאמה מעמיק + תכנון",
      ],
      badge: "פרימיום",
      gradient:
        "bg-gradient-to-br from-violet-200/80 via-fuchsia-100 to-pink-50 dark:from-violet-900/30 dark:via-fuchsia-900/20 dark:to-pink-950/20",
    },
  ];
}

// עזר להצגת מחיר לפי תקופה
export function priceILS(item: PlanCatalogItem, period: BillingPeriod) {
  return period === "quarterly" ? item.quarterlyILS : item.monthlyILS;
}

export function getPlanPrice(..._args: any[]): number {
  return 0;
}
