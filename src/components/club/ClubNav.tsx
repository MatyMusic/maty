"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function ClubNav() {
  const path = usePathname();
  const is = (p: string) => path === p;

  return (
    <nav
      dir="rtl"
      className={cls(
        "sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/75 dark:supports-[backdrop-filter]:bg-neutral-900/70",
        "border-b border-black/10 dark:border-white/10",
      )}
    >
      <div className="mx-auto max-w-2xl px-4 py-2 flex items-center gap-2">
        <Link
          href="/club"
          className={cls(
            "rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5",
            is("/club") && "bg-black/5 dark:bg-white/5 font-bold",
          )}
        >
          פיד
        </Link>

        <Link
          href="/club/compose"
          className={cls(
            "ms-auto rounded-xl px-4 py-2 text-sm font-bold",
            "bg-violet-600 text-white hover:brightness-110",
          )}
          title="צור פוסט חדש"
        >
          ✨ צור פוסט
        </Link>
      </div>
    </nav>
  );
}
