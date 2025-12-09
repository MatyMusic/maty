"use client";

import * as React from "react";
import he from "./dict.he";
import en from "./dict.en";
import ru from "./dict.ru";

export type Lang = "he" | "en" | "ru";
const DICTS: Record<Lang, Record<string, string>> = { he, en, ru };

// Cookie / Storage keys
const LANG_COOKIE = "mm:lang";
const LANG_STORAGE = "mm:lang";

// Utilities
function parseQueryLang(): Lang | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("lang");
  if (q && (["he", "en", "ru"] as Lang[]).includes(q as Lang)) return q as Lang;
  return null;
}

function readStoredLang(): Lang | null {
  try {
    if (typeof window !== "undefined") {
      const ls = window.localStorage.getItem(LANG_STORAGE) as Lang | null;
      if (ls && (["he", "en", "ru"] as Lang[]).includes(ls)) return ls;
    }
    if (typeof document !== "undefined") {
      const m = document.cookie.match(
        new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]*)`),
      );
      const v = m ? decodeURIComponent(m[1]) : null;
      if (v && (["he", "en", "ru"] as Lang[]).includes(v as Lang))
        return v as Lang;
    }
  } catch {}
  return null;
}

function persistLang(l: Lang) {
  try {
    if (typeof document !== "undefined") {
      document.cookie = `${LANG_COOKIE}=${encodeURIComponent(l)}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANG_STORAGE, l);
    }
  } catch {}
}

function applyHtmlLangDir(l: Lang) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = l;
    document.documentElement.dir = l === "he" ? "rtl" : "ltr";
  }
}

// Very small template interpolation: t("hello {name}", { name: "Maty" })
function interpolate(
  s: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`).toString());
}

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (
    k: string,
    vars?: Record<string, string | number>,
    fallback?: string,
  ) => string;
  dir: "rtl" | "ltr";
};

const I18nCtx = React.createContext<Ctx | null>(null);

function initialLang(): Lang {
  return parseQueryLang() ?? readStoredLang() ?? "he";
}

export function MATYDateI18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLangState] = React.useState<Lang>(initialLang);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    persistLang(l);
    applyHtmlLangDir(l);
  }, []);

  React.useEffect(() => {
    // apply on mount
    applyHtmlLangDir(lang);
  }, [lang]);

  const t = React.useCallback(
    (k: string, vars?: Record<string, string | number>, fallback?: string) => {
      const dict = DICTS[lang] || {};
      const raw = dict[k] ?? fallback ?? k;
      return interpolate(raw, vars);
    },
    [lang],
  );

  const value = React.useMemo<Ctx>(
    () => ({ lang, setLang, t, dir: lang === "he" ? "rtl" : "ltr" }),
    [lang, setLang, t],
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export default MATYDateI18nProvider;

export function useT() {
  const ctx = React.useContext(I18nCtx);
  if (!ctx) throw new Error("MATYDateI18nProvider missing");
  return ctx;
}

/** קומפוננטת סוויצ'ר קטנה (לא חובה) */
export function I18nSwitcher() {
  const { lang, setLang } = useT();
  return (
    <div className="inline-flex items-center gap-2">
      <label className="text-sm opacity-70">Language:</label>
      <select
        className="rounded border px-2 py-1"
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
      >
        <option value="he">עברית</option>
        <option value="en">English</option>
        <option value="ru">Русский</option>
      </select>
    </div>
  );
}
