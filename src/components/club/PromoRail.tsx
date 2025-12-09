"use client";
import * as React from "react";
import PromoCard from "./PromoCard";
import type { Promo } from "@/app/api/club/promotions/route";

export default function PromoRail({ side }: { side: "left" | "right" }) {
  const [items, setItems] = React.useState<Promo[] | null>(null);
  const placement = side === "left" ? "rail_left" : "rail_right";

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch(`/api/club/promotions?placement=${placement}`, {
        cache: "no-store",
      });
      const j = await res.json();
      if (alive) setItems(j.items || []);
    })();
    return () => {
      alive = false;
    };
  }, [placement]);

  return (
    <div className="hidden lg:block sticky top-24 space-y-3">
      {items === null ? (
        // skeleton
        <>
          <div className="h-40 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
          <div className="h-40 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
        </>
      ) : items.length ? (
        items.map((p) => <PromoCard key={p.id} promo={p} />)
      ) : (
        <div className="text-center text-xs opacity-60">אין פרומואים כרגע</div>
      )}
    </div>
  );
}
