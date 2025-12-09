// מוסיף נורמליזציה פשוטה ללוקיילים (he / en / ru / fr / es)
// כדי ש-PromotionsStrip וה-API של הפרומואים יעבדו בלי לשבור דברים אחרים.
export function normalizeLocale(input?: string | null): string {
  const raw = (input || "").trim().toLowerCase();

  if (!raw) return "he";

  // מפרקים לפי - או _  (he-IL, en_US וכו')
  const base = raw.split(/[-_]/)[0];

  if (base === "he" || base === "iw") return "he";
  if (base === "en") return "en";
  if (base === "ru") return "ru";
  if (base === "fr") return "fr";
  if (base === "es") return "es";

  // ברירת מחדל – עברית
  return "he";
}

// בודק האם ה-locale של פריט מתאים ל-locale המבוקש
export function localeMatches(
  itemLocale: string | string[] | undefined,
  wanted: string | undefined,
): boolean {
  if (!wanted || !itemLocale) return true;
  if (Array.isArray(itemLocale)) return itemLocale.includes(wanted);
  return itemLocale === wanted;
}
