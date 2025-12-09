// src/app/genre/[cat]/page.tsx
import GenrePageClient from "@/components/genre/GenrePageClient";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const LABEL = {
  chabad: "חסידי (חב״ד)",
  mizrahi: "מזרחי",
  soft: "שקט",
  fun: "מקפיץ",
} as const;

type CatKey = keyof typeof LABEL;

type PageProps = {
  params: { cat: CatKey | string };
};

/* ───────────── Metadata ───────────── */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { cat } = params;

  if (!Object.prototype.hasOwnProperty.call(LABEL, cat)) {
    return {
      title: "ז׳אנר מוזיקה · MATY MUSIC",
      description: "נגן שירים וסטים לפי ז׳אנרים ב־MATY MUSIC.",
    };
  }

  const title = LABEL[cat as CatKey];
  return {
    title: `${title} · MATY MUSIC`,
    description: `נגן שירים וסטים בקטגוריה: ${title}`,
  };
}

/* ───────────── הדף עצמו ───────────── */

export default function GenrePage({ params }: PageProps) {
  const { cat } = params;

  if (!Object.prototype.hasOwnProperty.call(LABEL, cat)) {
    notFound();
  }

  const catKey = cat as CatKey;
  const title = LABEL[catKey];

  return (
    <main className="min-h-screen bg-[#050316] text-white" dir="rtl">
      {/* בר עליון קבוע לכל הז׳אנרים */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          {/* לוגו/כותרת קטנה */}
          <Link
            href="/"
            className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold hover:bg-white/10"
          >
            MATY MUSIC
          </Link>

          {/* כותרת ז׳אנר נוכחי */}
          <div className="flex flex-col">
            <span className="text-[11px] text-white/60">ז׳אנר נוכחי</span>
            <span className="text-lg font-bold text-amber-200">{title}</span>
          </div>

          {/* ניווט בין ז׳אנרים */}
          <nav className="ms-auto flex flex-wrap items-center gap-2 text-xs">
            {(Object.keys(LABEL) as CatKey[]).map((key) => (
              <Link
                key={key}
                href={`/genre/${key}`}
                className={
                  key === catKey
                    ? "rounded-full bg-amber-400 px-3 py-1 font-semibold text-black shadow-sm"
                    : "rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] text-white/80 hover:border-amber-300 hover:text-amber-200"
                }
              >
                {LABEL[key]}
              </Link>
            ))}

            {/* כפתור אדמין – ניהול שירים */}
            <Link
              href="/music"
              className="rounded-full border border-amber-300/70 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-100 hover:bg-amber-300 hover:text-black hover:shadow"
            >
              ⚙️ ניהול שירים (Admin)
            </Link>
          </nav>
        </div>
      </header>

      {/* תוכן הז׳אנר – הנגן / הפלייליסט וכו' */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <GenrePageClient cat={catKey} title={title} />

        {/* פוטר קטן עם מידע / קישורים נוספים */}
        <footer className="mt-8 border-t border-white/10 pt-4 text-[11px] text-white/60">
          <div className="flex flex-wrap items-center gap-2">
            <span>משחק שירים לפי הז׳אנר: {title}</span>
            <span className="mx-1 opacity-40">·</span>
            <Link href="/" className="underline-offset-2 hover:underline">
              חזרה לעמוד הבית
            </Link>
            <span className="mx-1 opacity-40">·</span>
            <Link href="/music" className="underline-offset-2 hover:underline">
              מעבר לפאנל ניהול השירים
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
