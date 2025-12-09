// src/components/ProductSwitcher.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ProductSwitcher() {
  const path = usePathname();
  const isMusic = path?.startsWith("/music") || path?.startsWith("/me/saved");
  const isDate = path?.startsWith("/date");

  const btn = (href: string, active: boolean, label: string) => (
    <Link
      href={href}
      className={[
        "h-9 px-3 rounded-full text-sm border",
        active
          ? "bg-pink-600 text-white border-pink-500"
          : "bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800",
      ].join(" ")}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex items-center gap-2">
      {btn("/music", !!isMusic, "🎵 MATY-MUSIC")}
      {btn("/date", !!isDate, "💖 MATY-DATE")}
    </div>
  );
}
