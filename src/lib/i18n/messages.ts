// src/lib/i18n/messages.ts

export const SUPPORTED_LOCALES = ["he", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "he";

// אובייקט הודעות יכול להיות מקונן (home -> ctaSectionTitle וכו')
export type Messages = Record<string, string | Messages>;

/* ========= HEBREW ========= */
const heMessages: Messages = {
  site: {
    brand: "MATY-MUSIC",
  },
  home: {
    ctaSectionTitle: "כל מה שההופעה שלך צריכה, במקום אחד",
    ctaSectionSubtitle:
      "שירים, סטים, שידוכים, אירועים וניגונים – עם AI שעוזר לך לסגור את כל הפינות.",
  },
};

/* ========= ENGLISH ========= */
const enMessages: Messages = {
  site: {
    brand: "MATY-MUSIC",
  },
  home: {
    ctaSectionTitle: "Everything your show needs, in one place",
    ctaSectionSubtitle:
      "Songs, sets, matchmaking, events and nigunim – with AI to help you do it all.",
  },
};

/* ========= טבלה לכל הלוקאלים ========= */
const ALL_MESSAGES: Record<Locale, Messages> = {
  he: heMessages,
  en: enMessages,
};

/** בדיקה אם לוקאל נתמך */
export function isSupportedLocale(code: string): code is Locale {
  return SUPPORTED_LOCALES.includes(code as Locale);
}

/** מחזיר לוקאל "בטוח" + ההודעות שלו */
export function getMessagesForLocale(rawLocale: string | null | undefined) {
  const normalized = (rawLocale || "").toLowerCase();
  const locale: Locale = isSupportedLocale(normalized)
    ? (normalized as Locale)
    : DEFAULT_LOCALE;

  const messages = ALL_MESSAGES[locale] || ALL_MESSAGES[DEFAULT_LOCALE];

  return {
    locale,
    messages,
  };
}

/** ייצוא ברירת מחדל – כל ההודעות לכל השפות */
export default ALL_MESSAGES;
