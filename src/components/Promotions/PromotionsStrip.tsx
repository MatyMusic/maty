// דף מלא
"use client";
import * as React from "react";
import { usePromos } from "./usePromos";
// נניח שיש לך useLocale מחוץ לקוד הזה:
import { useLocale } from "@/components/common/LocaleProvider";
import Image from "next/image";

export default function PromotionsStrip() {
  const { locale } = useLocale(); // למשל "he" או "he-IL"
  const { items, loading } = usePromos(locale);

  if (loading) return null;
  if (!items?.length) return null;

  return (
    <div className="container-section my-4 grid gap-3 md:grid-cols-2">
      {items.map((p) => {
        const c = p.creatives?.[0];
        if (!c?.imageUrl || !c?.ctaUrl) return null; // ביטחון כפול
        return (
          <a
            key={p.id}
            href={c.ctaUrl}
            className="block overflow-hidden rounded-2xl border border-white/10"
          >
            <Image
              src={c.imageUrl}
              alt={c.title || p.name}
              width={1600}
              height={600}
              className="w-full h-auto"
            />
          </a>
        );
      })}
    </div>
  );
}
