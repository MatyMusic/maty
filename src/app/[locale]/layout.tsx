// src/app/[locale]/layout.tsx
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { getMessagesForLocale } from "@/lib/i18n/messages";
import type { ReactNode } from "react";

type LocaleParams = {
  locale: string;
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  // שים לב: כאן params הוא Promise
  params: Promise<LocaleParams>;
}) {
  // חייבים לחכות ל־params לפני שמשתמשים ב־locale
  const { locale } = await params;

  const { messages } = getMessagesForLocale(locale);

  return (
    <I18nProvider locale={locale} messages={messages}>
      {children}
    </I18nProvider>
  );
}
