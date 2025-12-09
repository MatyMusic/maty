"use client";

import * as React from "react";
import LocaleProvider, {
  type Locale,
  SUPPORTED_LOCALES,
  useLocale,
} from "@/components/common/LocaleProvider";

function DemoInner() {
  const { t, locale } = useLocale();

  return (
    <main
      dir={locale === "he" ? "rtl" : "ltr"}
      className="container mx-auto max-w-3xl p-6 space-y-6"
    >
      <h1 className="text-2xl font-bold">{t("app.title", "MATY MUSIC")}</h1>
      <p className="text-muted-foreground">
        {t("app.tagline", "Music • Community • Fitness • Date")}
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">
          {t("nav.section", "Navigation")}
        </h2>
        <ul className="list-disc ps-6">
          <li>{t("nav.home", "Home")}</li>
          <li>{t("nav.club", "Club")}</li>
          <li>{t("nav.fit", "Fit")}</li>
          <li>{t("nav.date", "Date")}</li>
        </ul>
      </section>

      <section className="space-x-2 space-y-2">
        <button className="rounded-lg border px-4 py-2">
          {t("actions.save", "Save")}
        </button>
        <button className="rounded-lg border px-4 py-2">
          {t("actions.cancel", "Cancel")}
        </button>
      </section>
    </main>
  );
}

export default function Page() {
  // בינתיים קבוע לדוגמה; בפועל אפשר לקרוא מה-cookie או מה-URL
  const locale: Locale =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("lang") as Locale) ||
        "he"
      : "he";

  return (
    <LocaleProvider locale={locale}>
      <DemoInner />
    </LocaleProvider>
  );
}
