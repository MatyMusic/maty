// src/components/common/LocaleProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * לוקאלים נתמכים באתר
 */
export const SUPPORTED_LOCALES = ["he", "en"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALES_SET = new Set<AppLocale>(SUPPORTED_LOCALES);

/**
 * טיפוס לקונטקסט של i18n
 */
type I18nContextValue = {
  locale: AppLocale;
  setLocale: (loc: AppLocale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

type LocaleProviderProps = {
  children: React.ReactNode;
  /**
   * לוקאל התחלתי שמגיע מהשרת (למשל "he" או "en")
   */
  initialLocale?: AppLocale;
};

/**
 * קומפוננטת Provider שעוטפת את כל האפליקציה
 * (מוחדרת ב-layout.tsx)
 */
export default function LocaleProvider({
  children,
  initialLocale,
}: LocaleProviderProps) {
  const [locale, setLocale] = useState<AppLocale>(initialLocale || "he");

  // לקרוא מה־localStorage אם אין initialLocale
  useEffect(() => {
    if (!initialLocale && typeof window !== "undefined") {
      const stored = window.localStorage.getItem("mm:locale");
      if (stored && LOCALES_SET.has(stored as AppLocale)) {
        setLocale(stored as AppLocale);
      }
    }
  }, [initialLocale]);

  // לשמור בחירה של המשתמש
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mm:locale", locale);
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      // פונקציית תרגום בסיסית (בינתיים מחזירה key כמו שהוא)
      t: (key: string) => key,
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * hook כללי ל־i18n – מחזיר locale, setLocale, t
 */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within <LocaleProvider>");
  }
  return ctx;
}

/**
 * hook קצר להחזרת הלוקאל בלבד
 */
export function useLocale(): AppLocale {
  return useI18n().locale;
}
