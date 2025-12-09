"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TopNav() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  function goBook() {
    router.push("/book");
  }

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur dark:bg-neutral-950/70"
    >
      <div className="mx-auto max-w-7xl px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          {/* לוגו */}
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            MATY
          </Link>

          {/* מובייל: כפתור תפריט */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            aria-expanded={open}
            aria-controls="site-nav-mobile"
            aria-label="פתח תפריט"
          >
            ☰
          </button>

          {/* דסקטופ: תפריט ראשי */}
          <nav className="hidden md:flex items-center gap-2 text-sm">
            <Link
              className="rounded-xl border px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
              href="/music"
            >
              MATY MUSIC
            </Link>
            <Link
              className="rounded-xl border px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
              href="/nigunim"
            >
              ניגונים
            </Link>
            <Link
              className="rounded-xl border px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
              href="/club"
            >
              MATY-CLUB♪★✦
            </Link>
            <Link
              className="rounded-xl border px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
              href="/fit"
            >
              MATY-FIT
            </Link>
            <Link
              className="rounded-xl border px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
              href="/date"
            >
              MATY-DATE❤❤❤❤❤❤
            </Link>
          </nav>

          {/* פעולות מהירות (קשר/הזמנה) — הכל בצד לקוח */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/contact"
              className="rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              צור קשר
            </Link>
            <button
              type="button"
              onClick={goBook}
              className="rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              הזמן הופעה
            </button>
          </div>
        </div>

        {/* מובייל: מגירת תפריט */}
        {open && (
          <div
            id="site-nav-mobile"
            className="md:hidden mt-2 grid gap-2 text-sm"
          >
            <Link
              onClick={() => setOpen(false)}
              className="rounded-xl border px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10"
              href="/music"
            >
              MATY MUSIC
            </Link>
            <Link
              onClick={() => setOpen(false)}
              className="rounded-xl border px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10"
              href="/nigunim"
            >
              ניגונים
            </Link>
            <Link
              onClick={() => setOpen(false)}
              className="rounded-xl border px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10"
              href="/club"
            >
              MATY-CLUB♪★✦
            </Link>
            <Link
              onClick={() => setOpen(false)}
              className="rounded-xl border px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10"
              href="/fit"
            >
              MATY-FIT
            </Link>
            <Link
              onClick={() => setOpen(false)}
              className="rounded-xl border px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10"
              href="/date"
            >
              MATY-DATE❤❤❤❤❤❤
            </Link>

            <div className="mt-2 grid gap-2">
              <Link
                onClick={() => setOpen(false)}
                href="/contact"
                className="rounded-xl border px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10"
              >
                צור קשר
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  goBook();
                }}
                className="rounded-xl border px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10"
              >
                הזמן הופעה
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
