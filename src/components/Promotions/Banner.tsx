// src/components/Promotions/Banner.tsx
import Image from "next/image";
import type { Promo } from "@/lib/promos/types";

export default function PromoBanner({ promo }: { promo: Promo }) {
  const c = promo.creatives[0];
  if (!c?.imageUrl || !c?.ctaUrl) {
    // fallback לכרטיס טקסטואלי
    return (
      <a
        href="#"
        aria-disabled
        className="block rounded-2xl p-4 bg-white/5 border border-white/10"
      >
        <div className="text-sm opacity-80">פרומו</div>
        <div className="text-lg font-semibold">{promo.name}</div>
        <div className="text-sm opacity-70">נוסף ללא קריאייטיב מלא</div>
      </a>
    );
  }
  return (
    <a
      href={c.ctaUrl}
      className="block rounded-2xl overflow-hidden border border-white/10"
    >
      <Image
        src={c.imageUrl}
        alt={c.title || promo.name}
        width={1600}
        height={600}
      />
    </a>
  );
}
