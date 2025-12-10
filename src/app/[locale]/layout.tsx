// src/app/[locale]/layout.tsx
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { getMessagesForLocale, SUPPORTED_LOCALES } from "@/lib/i18n/messages"; // <--- ייבוא SUPPORTED_LOCALES
import type { ReactNode } from "react";

type LocaleParams = {
  locale: string;
};

// **שלב קריטי:** מכריז על כל השפות שנתמכות כדי ש-Next.js ייצור דפים עבורן.
export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({
    locale,
  }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: LocaleParams;
}) {
  // מכיוון שהוספנו generateStaticParams, ה-locale תמיד יהיה מחרוזת תקינה.
  const { locale } = params;

  // טוען את מילון ההודעות המתאים לשפה
  const { messages } = getMessagesForLocale(locale);

  return (
    // עוטף את כל האפליקציה ב-Provider כדי שרכיבי Client יוכלו לקרוא את ההודעות
    <I18nProvider locale={locale} messages={messages}>
      {children}
    </I18nProvider>
  );
}
