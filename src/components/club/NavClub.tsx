// src/components/club/NavClub.tsx
"use client";
import React from "react";
import Link from "next/link";

export default function NavClub() {
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/bypass", { cache: "no-store" });
        const j = await r.json();
        if (!ignore) setIsAdmin(!!j?.bypass);
      } catch {
        if (!ignore) setIsAdmin(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const Btn = (props: React.ComponentProps<typeof Link>) => (
    <Link
      {...props}
      className="inline-flex items-center justify-center rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
    />
  );

  return (
    <nav className="w-full flex flex-wrap items-center justify-end gap-2 rtl">
      <Btn href="/club/feed">חזרה לפיד</Btn>
      <Btn href="/club/me/posts">הפוסטים שלי</Btn>
      <Btn href="/club/compose">יצירת פוסט</Btn>
      {isAdmin && <Btn href="/admin/club/posts">תור אישורים</Btn>}
    </nav>
  );
}
