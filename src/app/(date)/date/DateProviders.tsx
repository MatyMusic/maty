"use client";

import type { ReactNode } from "react";
import { DateI18nProvider } from "@/lib/i18n/DateI18nProvider";
import { Toaster } from "@/maty/ui/sonner"; // ודא שהקומפ' קיימת ומסומנת כ-Client

/**
 * עוטף את אזור MATY-DATE בפרוביידרים קליינטים + Toaster
 * אם בעתיד תרצה להוסיף Redux/Query/Theme — הוסף כאן.
 */
export default function DateProviders({ children }: { children: ReactNode }) {
  return (
    <DateI18nProvider>
      {children}
      {/* Toasts אזוריים עבור MATY-DATE */}
      <Toaster />
    </DateI18nProvider>
  );
}
