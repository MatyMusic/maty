// src/lib/i18n/I18nProvider.tsx
"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import messagesAll, { DEFAULT_LOCALE, type Locale } from "./messages";

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
  locale?: string;
  children: ReactNode;
};

export function I18nProvider({ locale, children }: I18nProviderProps) {
  const lc = ((locale || DEFAULT_LOCALE) as Locale) || DEFAULT_LOCALE;

  const value = useMemo<I18nContextValue>(() => {
    const messages = messagesAll[lc] || messagesAll[DEFAULT_LOCALE];

    const t: TFunc = (key, vars = {}) => {
      // נווט לפי "home.ctaSectionTitle" => home -> ctaSectionTitle
      const parts = key.split(".");
      let cur: any = messages;
      for (const p of parts) {
        if (cur && typeof cur === "object" && p in cur) {
          cur = cur[p];
        } else {
          cur = key;
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
  }, [lc]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): TFunc {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useT must be used within an I18nProvider");
  }
  return ctx.t;
}

export function useLocale(): Locale {
  const ctx = useContext(I18nContext);
  return ctx?.locale ?? DEFAULT_LOCALE;
}
