"use client";
import * as React from "react";

type Promo = {
  _id: string;
  title: string;
  body?: string;
  imageUrl?: string;
  ctaText?: string;
  link?: string;
  couponCode?: string;
};

export default function PromoBanner({
  placement = "feed_top",
}: {
  placement?: string;
}) {
  const [promos, setPromos] = React.useState<Promo[]>([]);
  React.useEffect(() => {
    fetch(`/api/club/promotions?placement=${encodeURIComponent(placement)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((j) => Array.isArray(j?.items) && setPromos(j.items))
      .catch(() => {});
  }, [placement]);
  if (!promos.length) return null;
  const p = promos[0];
  return (
    <a
      href={p.link || "#"}
      className="block rounded-3xl overflow-hidden bg-gradient-to-r from-amber-100 to-pink-100 dark:from-amber-900/30 dark:to-pink-900/20 p-4 shadow-card"
    >
      <div className="flex items-center gap-4">
        {p.imageUrl && (
          <img
            src={p.imageUrl}
            alt="promo"
            className="h-16 w-16 rounded-xl object-cover"
          />
        )}
        <div className="flex-1">
          <div className="font-bold">{p.title}</div>
          {p.body && <div className="text-sm opacity-80">{p.body}</div>}
          {p.couponCode && (
            <div className="mt-1 text-xs font-mono bg-black/10 dark:bg-white/10 inline-block px-2 py-0.5 rounded">
              קוד קופון: {p.couponCode}
            </div>
          )}
        </div>
        {p.ctaText && <div className="btn btn-sm btn-primary">{p.ctaText}</div>}
      </div>
    </a>
  );
}
