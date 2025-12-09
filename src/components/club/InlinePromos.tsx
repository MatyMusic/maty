// src/components/club/InlinePromos.tsx
"use client";

import * as React from "react";

/**
 * מחזיר מערך פרומואים שניתנים להשחלה בפיד.
 * כאן דוגמה מינימלית; אצלך כנראה זה נטען מרשת/קובץ.
 */
export function useInlinePromos(): React.ReactElement[] {
  // החזר פרומואים עם key אם אפשר; אם לא – נוסיף key מבחוץ ב-page.tsx
  return [
    <div
      key="promo-0"
      data-reveal
      className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-amber-50/70 dark:bg-amber-900/20"
    >
      פרומו: הצטרפו למועדון 🎧
    </div>,
  ];
}

/**
 * משחיל פרומו כל `every` פריטים. אם אין מספיק פרומואים – מפסיק.
 * דואג לשמור key על הפרומו אם כבר קיים, אחרת משאיר ל-page.tsx להדביק key.
 */
export function interleaveWithPromos(
  items: React.ReactElement[],
  promos: React.ReactElement[] = [],
  every = 6,
) {
  if (!every || every < 1) return items;
  const out: React.ReactElement[] = [];
  let p = 0;
  items.forEach((it, i) => {
    out.push(it);
    if ((i + 1) % every === 0 && promos[p]) {
      const promo = promos[p];
      out.push(
        React.isValidElement(promo)
          ? React.cloneElement(promo, {
              key: promo.key ?? `promo-${p}`,
              "data-reveal": true,
            })
          : (promo as any),
      );
      p++;
    }
  });
  return out;
}
