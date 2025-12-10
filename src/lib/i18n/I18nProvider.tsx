// src/lib/i18n/I18nProvider.tsx
"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
// ייבוא רק הטיפוסים הנדרשים
import { DEFAULT_LOCALE, type Locale, type Messages } from "./messages";

export type TFunc = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

type I18nContextValue = {
  locale: Locale;
  t: TFunc;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  locale: string;
  messages: Messages; // **שדרוג:** מקבל את מילון ההודעות כבר טעון כ-Prop
  children: ReactNode;
};

export function I18nProvider({
  locale,
  messages,
  children,
}: I18nProviderProps) {
  // נשתמש ב-DEFAULT_LOCALE רק כ-Fallback לטיפוס
  const lc = ((locale || DEFAULT_LOCALE) as Locale) || DEFAULT_LOCALE;

  const value = useMemo<I18nContextValue>(() => {
    // **שדרוג:** משתמשים ישירות באובייקט messages שהתקבל כ-prop.
    const t: TFunc = (key, vars = {}) => {
      // נווט לפי "home.ctaSectionTitle" => home -> ctaSectionTitle
      const parts = key.split(".");
      let cur: any = messages;
      for (const p of parts) {
        if (cur && typeof cur === "object" && p in cur) {
          cur = cur[p];
        } else {
          cur = key; // אם לא נמצא, מחזיר את המפתח עצמו
          break;
        }
      }

      let s = typeof cur === "string" ? cur : key;

      // החלפת משתנים {name} וכו'
      for (const [k, v] of Object.entries(vars)) {
        s = s.replace(new RegExp(`{${k}}`, "g"), String(v));
      }

      return s;
    };

    return { locale: lc, t };
  }, [lc, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook לאחזור פונקציית התרגום (t)
 */
export function useT(): TFunc {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useT must be used within an I18nProvider");
  }
  return ctx.t;
}

/**
 * Hook לאחזור הלוקאל הנוכחי
 */
export function useLocale(): Locale {
  const ctx = useContext(I18nContext);
  return ctx?.locale ?? DEFAULT_LOCALE;
}
