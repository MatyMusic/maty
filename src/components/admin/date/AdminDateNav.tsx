"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminDateNav() {
  const pathname = usePathname();
  const is = (href: string) =>
    href === "/admin/date"
      ? pathname === "/admin/date"
      : pathname.startsWith(href);

  const chip =
    "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 min-w-[96px] " +
    "text-sm font-semibold border border-amber-400/60 " +
    "bg-white/85 dark:bg-neutral-900/75 hover:bg-white dark:hover:bg-neutral-800/80 " +
    "shadow-[inset_0_0_0_1px_rgba(245,158,11,.25)]";

  const active = "ring-1 ring-amber-400/70";

  return (
    <nav
      className="flex flex-wrap items-center gap-2 mt-2 mb-4"
      aria-label="ניווט MATY-DATE"
      dir="rtl"
    >
      <Link
        href="/admin/date"
        className={`${chip} ${is("/admin/date") ? active : ""}`}
      >
        סקירה
      </Link>
      <Link
        href="/admin/date/users"
        className={`${chip} ${is("/admin/date/users") ? active : ""}`}
      >
        משתמשים / פרופילים
      </Link>
      <Link
        href="/admin/date/preferences"
        className={`${chip} ${is("/admin/date/preferences") ? active : ""}`}
      >
        העדפות
      </Link>
      <Link
        href="/admin/date/matches"
        className={`${chip} ${is("/admin/date/matches") ? active : ""}`}
      >
        התאמות
      </Link>
      <Link
        href="/admin/date/reports"
        className={`${chip} ${is("/admin/date/reports") ? active : ""}`}
      >
        דיווחים
      </Link>
    </nav>
  );
}
