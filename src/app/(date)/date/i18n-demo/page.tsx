"use client";

import * as React from "react";
import { useT, I18nSwitcher } from "@/components/maty-date/I18nProvider";

export default function Page() {
  const { t, dir } = useT();

  return (
    <main dir={dir} className="container mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <I18nSwitcher />
      </header>

      <p className="text-muted-foreground">{t("subtitle")}</p>

      <section className="space-y-2">
        <button className="rounded-lg border px-4 py-2">{t("cta_start")}</button>
        <button className="rounded-lg border px-4 py-2">{t("cta_matches")}</button>
        <button className="rounded-lg border px-4 py-2">{t("save")}</button>
      </section>

      <section className="space-y-1">
        <div>{t("hello_name", { name: "Maty" })}</div>
        <div className="text-sm opacity-60">{t("saving")}</div>
      </section>
    </main>
  );
}
