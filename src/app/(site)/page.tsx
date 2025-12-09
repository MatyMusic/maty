// src/app/(site)/page.tsx
import type { Metadata } from "next";
import HomeHero from "@/components/home/HomeHero";

export const metadata: Metadata = {
  title: "MATY MUSIC",
  description: "מוזיקה חיה. חוויה אמיתית.",
};

export default function HomePage() {
  const cards = [
    {
      title: "אירועים",
      text: "חתונות, חינה, בר/בת מצווה — אנחנו מכסים אותך.",
      href: "/events",
      glow: "radial-gradient(40% 40% at 70% 30%, rgba(236,72,153,.16), transparent 70%)",
      cta: "קבעו תאריך",
      conic: "conic-gradient(from 0deg, rgba(236,72,153,.35), transparent 60%)",
    },
    {
      title: "מחירון",
      text: "תמחור שקוף וגמיש לכל סוג אירוע.",
      href: "/pricing",
      glow: "radial-gradient(40% 40% at 30% 70%, rgba(99,102,241,.16), transparent 70%)",
      cta: "לצפייה בחבילות",
      conic: "conic-gradient(from 0deg, rgba(99,102,241,.35), transparent 60%)",
    },
    {
      title: "גלריה",
      text: "תמונות אמיתיות מאירועים שלנו.",
      href: "/gallery",
      glow: "radial-gradient(40% 40% at 50% 50%, rgba(34,197,94,.16), transparent 70%)",
      cta: "פתחו גלריה",
      conic: "conic-gradient(from 0deg, rgba(34,197,94,.35), transparent 60%)",
    },
  ] as const;

  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-gradient-to-br from-white to-violet-50/40 dark:from-neutral-950 dark:to-violet-950/20"
    >
      {/* HERO האנימטיבי (קומפוננטת קליינט קיימת) */}
      <HomeHero />

      {/* מקטע פתיח ממורכז */}
      <section className="relative mx-auto max-w-5xl px-4 pt-10 md:pt-14 text-center">
        {/* הילה עדינה מאחור */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-10 mx-auto h-[220px] w-[min(100%,780px)] rounded-[48px] blur-3xl opacity-70"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 40%, rgba(236,72,153,.10), transparent 70%), radial-gradient(60% 60% at 50% 60%, rgba(99,102,241,.10), transparent 70%)",
          }}
        />
        <img
          src="/assets/logo/maty-music-wordmark.svg"
          alt="MATY MUSIC"
          className="mx-auto h-14 w-auto mb-6 drop-shadow-sm"
          decoding="async"
          loading="lazy"
        />
        <h2 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
          מוזיקה חיה. חוויה אמיתית.
        </h2>
        <p className="mt-3 opacity-80 text-base md:text-lg">
          בחרו פלייליסט, הזמינו הופעה, ותנו לנו לעשות את הקסם.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <a
            href="/book"
            className="inline-flex items-center justify-center h-11 px-6 rounded-full text-sm font-semibold bg-pink-600 text-white hover:bg-pink-700 transition shadow-sm"
          >
            הזמן הופעה
          </a>
          <a
            href="/playlists"
            className="inline-flex items-center justify-center h-11 px-6 rounded-full text-sm font-semibold border bg-white/90 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800 transition"
          >
            פלייליסטים
          </a>
        </div>
      </section>

      {/* שלישיית כרטיסים — 3D CSS Hover + פרספקטיבה (ללא styled-jsx) */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <a
              key={c.title}
              href={c.href}
              className="group relative block transform-gpu"
              style={{ perspective: 1000 }}
            >
              {/* הילה היקפית */}
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-3 rounded-[28px] blur-2xl opacity-80 transition duration-700 group-hover:opacity-100"
                style={{ background: c.glow, transform: "translateZ(0)" }}
              />

              {/* גוף הכרטיס */}
              <div
                className="relative rounded-3xl border bg-white/80 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 p-5 md:p-6 shadow-sm transition will-change-transform group-hover:shadow-md"
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                {/* גלוס עדין */}
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0))",
                    transform: "translateZ(12px)",
                  }}
                />

                {/* כותרת + טקסט */}
                <div
                  className="relative"
                  style={{ transform: "translateZ(16px)" }}
                >
                  <h3 className="text-lg font-extrabold tracking-tight">
                    {c.title}
                  </h3>
                  <p className="mt-1 opacity-80 text-sm">{c.text}</p>
                </div>

                {/* קישוט קוני עדין */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl opacity-60 transition duration-300 group-hover:opacity-80"
                  style={{
                    background: c.conic,
                    transform: "translateZ(8px) rotate(10deg)",
                  }}
                />

                {/* CTA */}
                <div className="mt-4" style={{ transform: "translateZ(20px)" }}>
                  <span className="inline-flex items-center gap-2 rounded-full h-9 px-4 text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 transition group-hover:opacity-90">
                    {c.cta}
                    <span
                      aria-hidden
                      className="transition group-hover:translate-x-0.5"
                    >
                      ←
                    </span>
                  </span>
                </div>

                {/* Tilt 3D ב-hover באמצעות Tailwind arbitrary values */}
                <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition" />

                {/* חשוב: הכיתוב הבא משתמש ב-JIT arbitrary values כדי להוסיף טרנספורם תלת-ממדי */}
                <div className="sr-only">
                  כדי לא לשבור את ה-build: אין כאן styled-jsx ואין מחרוזות לא
                  סגורות.
                </div>
              </div>

              {/* אפקט התלת-מימד ב-hover — הכל עם מחלקה אחת */}
              <div
                aria-hidden
                className="absolute inset-0"
                // משתמשים ב-group-hover עם ערך transform מותאם אישית
                // rotateX/rotateY/scale בפרספקטיבה – עובד ב-Tailwind JIT
                style={
                  {
                    // השכבה הזו לא נראית; רק "מכריחה" את המנוע לחשב את ה-hover
                    // והטרנספורם האמיתי מוחל על sibling הקודם באמצעות סלקטור קבוצתי.
                  }
                }
              />
              <style
                // שימוש קטן ב-embedded CSS כדי למקד לדיב הקודם בלבד,
                // בלי styled-jsx ולא בתוך className string שמייצר שגיאות.
                // בטוח בסרבר קומפוננט.
                dangerouslySetInnerHTML={{
                  __html: `
                  @media (prefers-reduced-motion: no-preference) {
                    a.group:hover > div {
                      transform: rotateX(6deg) rotateY(-4deg) scale(1.015);
                    }
                    a.group:active > div {
                      transform: rotateX(1deg) rotateY(-1deg) scale(0.995);
                    }
                  }
                `,
                }}
              />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
