"use client";
import * as React from "react";
import type { Promo } from "@/app/api/club/promotions/route";
import { Megaphone } from "lucide-react";

export default function PromoCard({ promo }: { promo: Promo }) {
  return (
    <a
      href={promo.href || "#"}
      className="group block rounded-2xl border dark:border-white/10 bg-white/70 dark:bg-neutral-950/70 hover:bg-white/90 dark:hover:bg-neutral-900/80 transition overflow-hidden"
      title={promo.title}
    >
      {promo.image ? (
        <img
          src={promo.image}
          alt={promo.title}
          className="w-full aspect-[16/9] object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="p-3">
        <div className="flex items-center gap-2 font-semibold">
          <Megaphone className="w-4 h-4 opacity-70" />
          <span className="truncate">{promo.title}</span>
        </div>
        {promo.text ? (
          <div className="text-xs opacity-70 mt-1 line-clamp-2">
            {promo.text}
          </div>
        ) : null}
        <div className="text-[11px] mt-2 opacity-60">ממומן / פרסום קהילתי</div>
      </div>
    </a>
  );
}
