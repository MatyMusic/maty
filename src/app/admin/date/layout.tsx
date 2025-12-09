// src/app/admin/date/layout.tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const dynamic = "force-dynamic";

export default async function DateAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  const tabs = [
    { href: "/admin/date", label: "Overview" },
    { href: "/admin/date/users", label: "Users/Profiles" },
    { href: "/admin/date/preferences", label: "Preferences" },
    { href: "/admin/date/matches", label: "Matches" },
    { href: "/admin/date/reports", label: "Reports" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">MATY-DATE Admin</h1>
      <nav className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="px-3 py-2 rounded-full border border-amber-400/40 dark:border-amber-300/25 bg-white/80 dark:bg-neutral-900/70 text-sm"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-4">
        {children}
      </div>
    </div>
  );
}
