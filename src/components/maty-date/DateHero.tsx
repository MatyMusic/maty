"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n/DateI18nProvider";
import LanguageSwitcher from "./LanguageSwitcher";

export default function DateHero() {
  const { t } = useT();
  return (
    <section className="rtl text-right py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl md:text-5xl font-extrabold">{t("title")}</h1>
          <LanguageSwitcher />
        </div>
        <p className="text-muted-foreground mb-6 max-w-prose">
          {t("subtitle")}
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/maty-date/onboarding"
            className="inline-flex h-10 items-center rounded-2xl px-5 border shadow-sm"
          >
            {t("cta_start")}
          </Link>
          <Link
            href="/maty-date/matches"
            className="inline-flex h-10 items-center rounded-2xl px-5 border"
          >
            {t("cta_matches")}
          </Link>
        </div>
      </div>
    </section>
  );
}
