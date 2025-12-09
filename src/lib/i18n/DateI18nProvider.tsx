// src/lib/i18n/DateI18nProvider.tsx
"use client";

import type { ReactNode } from "react";
import {
  I18nProvider,
  useLocale as useGlobalLocale,
  useT as useGlobalT,
} from "./I18nProvider";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "./messages";

/**
 * DateI18nProvider – עטיפה עבור מודול MATY-DATE.
 * משתמש באותו מנוע i18n כמו שאר האתר.
 */
export function DateI18nProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale?: Locale;
}) {
  const safeLocale = locale || DEFAULT_LOCALE;
  return <I18nProvider locale={safeLocale}>{children}</I18nProvider>;
}

/** שימוש ב-t של המערכת הראשית */
export function useT() {
  return useGlobalT();
}

/** hook נוח ל-MATY-DATE */
export function useDateI18n() {
  const locale = useGlobalLocale();
  const t = useGlobalT();
  return { locale, t };
}

export { SUPPORTED_LOCALES };
export type { Locale };
