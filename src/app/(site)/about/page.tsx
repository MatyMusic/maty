// src/app/(site)/about/page.tsx

import VideoDemosSection from "@/components/about/VideoDemosSection";
import { GALLERY_IMAGES } from "@/lib/galleryImages";
import Image from "next/image";
import Link from "next/link";

/** ============================================================================
 *  ABOUT — MATY-MUSIC  (Server Component, App Router)
 *  - בלי "use client" כדי לאפשר export metadata ו־SSR נקי
 *  - RTL מלא
 *  - המון מקטעים, אנימציות CSS, קישורים, גלריות, טיימליין, FAQ, ציוד
 *  - מותאם למבנה MATY+: MUSIC / CLUB / DATE / FIT / JAM
 * ============================================================================ */

export const metadata = {
  title: "על MATY-MUSIC | MG • אירועים חיה",
  description:
    "אודות מתי גורפינקל (MG) והפרויקט MATY-MUSIC — חוויית מוזיקה חיה, קהילה ורשת נקייה סביב אירועים, חתונות וניגונים.",
};

export default function AboutPage() {
  return (
    <section dir="rtl" className="section-padding">
      {/* ====== STYLE: keyframes & helpers ====== */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* === Animations === */
          @keyframes softFloat {
            0% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0); }
          }
          @keyframes gentlePulse {
            0%, 100% { transform: scale(1); opacity: 0.95; }
            50% { transform: scale(1.02); opacity: 1; }
          }
          @keyframes slideInUp {
            0% { transform: translateY(30px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          @keyframes glow {
            0%, 100% { filter: drop-shadow(0 0 0 rgba(109,74,255,0)); }
            50% { filter: drop-shadow(0 0 14px rgba(109,74,255,0.35)); }
          }
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes pulseRing {
            0% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.5); }
            70% { box-shadow: 0 0 0 16px rgba(129, 140, 248, 0); }
            100% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          .anim-float { animation: softFloat 6s ease-in-out infinite; }
          .anim-pulse { animation: gentlePulse 4.5s ease-in-out infinite; }
          .anim-slide-up { animation: slideInUp .9s ease-out both; }
          .anim-glow { animation: glow 2.8s ease-in-out infinite; }
          .anim-delay-1 { animation-delay: .15s }
          .anim-delay-2 { animation-delay: .3s }
          .anim-delay-3 { animation-delay: .45s }
          .anim-delay-4 { animation-delay: .6s }

          .marquee {
            white-space: nowrap;
            overflow: hidden;
            position: relative;
          }
          .marquee > div {
            display: inline-block;
            padding-right: 2rem;
            animation: marquee 18s linear infinite;
          }

          /* helpers */
          .about-card {
            border-radius: 1.25rem;
            border: 1px solid rgba(100,116,139,0.15);
            background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.88));
          }
          .about-card.dark {
            border-color: rgba(255,255,255,0.12);
            background: linear-gradient(180deg, rgba(15,23,42,0.96), rgba(15,23,42,0.9));
          }
          .ringed {
            box-shadow:
              0 0 0 2px rgba(109,74,255,0.18),
              0 18px 45px -16px rgba(15,23,42,0.7);
          }
          .chip {
            border-radius: 9999px;
            border: 1px solid rgba(100,116,139,0.25);
            background: rgba(255,255,255,0.65);
          }
          .chip.dark {
            border-color: rgba(255,255,255,0.16);
            background: rgba(15,23,42,0.7);
          }
          .shimmer {
            background-image: linear-gradient(
              120deg,
              rgba(148,163,184,0.08),
              rgba(148,163,184,0.45),
              rgba(148,163,184,0.08)
            );
            background-size: 200% 100%;
            animation: shimmer 3s linear infinite;
          }
          .pulse-ring {
            position: relative;
          }
          .pulse-ring::before {
            content: "";
            position: absolute;
            inset: -3px;
            border-radius: 9999px;
            border: 2px solid rgba(129,140,248,0.6);
            animation: pulseRing 2.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `,
        }}
      />

      {/* כל התוכן ממורכז באמצע */}
      <div className="mx-auto w-full max-w-5xl px-4 lg:px-0">
        {/* =================== HERO =================== */}
        <HeroSection />

        {/* =================== QUICK CHIPS =================== */}
        <QuickChips />

        {/* =================== STRIP / MARQUEE =================== */}
        <BrandStrip />

        {/* =================== CORE MODULES (MUSIC / DATE / CLUB) =================== */}
        <CoreModules />

        {/* =================== VISION & VALUES =================== */}
        <VisionValues />

        {/* =================== EVENT TYPES & FLOWS =================== */}
        <EventTypesAndFlows />

        {/* =================== SAMPLE SETLISTS =================== */}
        <SampleSetlists />

        {/* =================== VIDEO DEMOS (עם העלאה לאדמין) =================== */}
        <VideoDemosSection />

        {/* =================== GALLERY =================== */}
        <GallerySection />

        {/* =================== STATS =================== */}
        <StatsSection />

        {/* =================== TIMELINE =================== */}
        <TimelineSection />

        {/* =================== GEAR / SETUP =================== */}
        <GearSection />

        {/* =================== MATY+ TECH ECOSYSTEM =================== */}
        <MatyTechSection />

        {/* =================== AUDIENCE PERSONAS =================== */}
        <PersonasSection />

        {/* =================== FAQ =================== */}
        <FaqSection />

        {/* =================== CTA =================== */}
        <CtaSection />

        {/* =================== FOOT NAV =================== */}
        <FootNav />
      </div>
    </section>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ HERO                                                    │
   ╰─────────────────────────────────────────────────────────╯ */

function HeroSection() {
  return (
    <section className="relative mb-10 md:mb-14">
      {/* BG */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-90 dark:opacity-70"
      >
        <div
          className="absolute inset-x-0 -top-16 mx-auto h-[220px] w-[min(100%,780px)] rounded-[48px] blur-3xl"
          style={{
            background:
              "radial-gradient(80% 60% at 50% 50%, rgba(109,74,255,0.32), rgba(109,74,255,0) 60%)",
          }}
        />
        <div
          className="absolute inset-x-0 top-24 mx-auto h-[260px] w-[min(100%,920px)] rounded-[48px] blur-3xl"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 50%, rgba(255,134,98,0.28), rgba(255,134,98,0) 68%)",
          }}
        />
      </div>

      <div className="about-card dark bg-white/95 dark:bg-neutral-950/95 backdrop-blur shadow-xl border dark:border-white/10 p-5 md:p-7 ringed anim-slide-up">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          {/* text */}
          <div className="flex-1 text-right space-y-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-slate-900/90 text-slate-100 text-[11px] px-3 py-1 mb-3 anim-float">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>לייב • חופה • ריקודים • התוועדות • ניגונים</span>
              </p>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 md:mb-4 anim-glow">
                על{" "}
                <span className="text-violet-600 dark:text-violet-300">
                  MATY-MUSIC
                </span>
              </h1>
            </div>

            <p className="opacity-90 leading-7 md:text-lg">
              אני <b>מתי גורפינקל (MG)</b> —{" "}
              <b>נגן קלידים, חזן, ומלווה במה לאירועים חיה</b>. MATY-MUSIC הוא
              הבית הדיגיטלי והבימתי שבו מוזיקה חסידית, ים-תיכונית וניגוני חב״ד
              נפגשים עם סאונד מודרני, טכנולוגיה מתקדמת וחוויה חכמה לקהל.
            </p>

            <p className="opacity-75 leading-7 text-sm md:text-base">
              המטרה פשוטה:{" "}
              <b>להרים ערב שלא שוכחים — בלי רעש מיותר, בלי פיצ׳רים מיותרים</b>.
              חופה, ריקודים, התוועדות או אירוע קהילה – הכל מחובר למערכת MATY+:
              ניהול מוזיקה, רשת חברתית נקייה (MATY-CLUB), ושכבת שידוכים/חיבורי
              קהילה (MATY-DATE).
            </p>

            <HeroGrid />

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Link href="/events" className="btn">
                הזמנת הופעה
              </Link>
              <Link href={{ pathname: "/", hash: "demos" }} className="btn">
                דמואים
              </Link>
              <Link href="/contact" className="btn">
                שיחת תיאום
              </Link>
            </div>
          </div>

          {/* avatar / logo */}
          <div className="shrink-0 text-center space-y-4">
            <div className="relative inline-block anim-float">
              <div
                className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/14 to-amber-500/16 blur-xl"
                aria-hidden
              />
              <div className="pulse-ring">
                <Image
                  src="/assets/images/maty-avatar.png"
                  alt="MATY avatar"
                  width={220}
                  height={220}
                  className="relative w-36 md:w-44 h-auto rounded-3xl border dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 anim-pulse ringed"
                  priority
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="mt-1 opacity-80 text-sm font-medium">
                MG • Keyboards & Production
              </div>
              <div className="text-[12px] opacity-60">
                חופות • ריקודים • ניגוני חב״ד • אירועי קהילה
              </div>
            </div>

            <div className="mt-4 hidden md:block">
              <Image
                src="/assets/logo/mg-mark.svg"
                alt="MG Logo"
                width={160}
                height={160}
                className="w-28 md:w-36 h-auto opacity-90 anim-float anim-delay-2"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroGrid() {
  return (
    <div className="grid md:grid-cols-3 gap-4 mt-6">
      <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/95 dark:bg-neutral-950/80 anim-float">
        <div className="font-semibold mb-1 flex items-center justify-between">
          <span>מה אנחנו עושים</span>
          <span className="text-xs opacity-60">On-Stage</span>
        </div>
        <ul className="text-sm opacity-80 space-y-1">
          <li>• הופעות חיות לאירועים פרטיים וקהילתיים</li>
          <li>• חופות, טקסים ומקטעי תפילה</li>
          <li>• ניהול מוזיקלי וזרימת ערב</li>
        </ul>
      </div>
      <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/95 dark:bg-neutral-950/80 anim-float anim-delay-1">
        <div className="font-semibold mb-1 flex items-center justify-between">
          <span>סגנונות</span>
          <span className="text-xs opacity-60">Genres</span>
        </div>
        <ul className="text-sm opacity-80 space-y-1">
          <li>• חסידי, חב״ד וניגוני התוועדות</li>
          <li>• ים-תיכוני / מזרחי עדכני</li>
          <li>• בלדות שקטות וסטים מקפיצים</li>
        </ul>
      </div>
      <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/95 dark:bg-neutral-950/80 anim-float anim-delay-2">
        <div className="font-semibold mb-1 flex items-center justify-between">
          <span>למה אנחנו</span>
          <span className="text-xs opacity-60">Why MATY</span>
        </div>
        <ul className="text-sm opacity-80 space-y-1">
          <li>• התאמה מלאה לקהל, מגיל 7 עד 70</li>
          <li>• סאונד נקי, ציוד ברמה מקצועית</li>
          <li>• חיבור בין במה, קהל וקהילה דיגיטלית</li>
        </ul>
      </div>
    </div>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ QUICK CHIPS                                            │
   ╰─────────────────────────────────────────────────────────╯ */

function QuickChips() {
  const chips = [
    { label: "חב״ד / חסידי", href: "/genre?tag=chabad" },
    { label: "ים-תיכוני", href: "/genre?tag=mizrahi" },
    { label: "בלדות שקטות", href: "/genre?tag=soft" },
    { label: "סטים מקפיצים", href: "/genre?tag=party" },
    { label: "וידאו-דמואים", href: "/videos" },
    { label: "גלריה", href: "/gallery" },
    { label: "הזמנת הופעה", href: "/events" },
  ];

  return (
    <section className="mb-10">
      <div className="flex flex-wrap gap-2 justify-end">
        {chips.map((c, i) => (
          <Link
            key={c.label}
            href={c.href}
            className="chip dark rounded-full px-3 py-1 text-sm hover:opacity-100 opacity-90 transition anim-slide-up"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {c.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ BRAND STRIP / MARQUEE                                  │
   ╰─────────────────────────────────────────────────────────╯ */

function BrandStrip() {
  return (
    <section className="mb-12">
      <div className="marquee about-card dark bg-white/80 dark:bg-neutral-950/80 backdrop-blur p-3 md:p-4 border dark:border-white/10">
        <div className="opacity-80 text-[13px] md:text-sm">
          • MATY-MUSIC • אירועים • חתונות • חופות • התוועדויות • מוזיקה חיה •
          ניגוני חב״ד • קלידים • פלייליסט מותאם • סאונד מקצועי • חוויה
          אינטראקטיבית • MATY-CLUB • MATY-DATE • MATY-FIT • MATY-JAM •
          MATY-MUSIC • אירועים • חתונות • חופות • התוועדויות • מוזיקה חיה •
          ניגוני חב״ד • קלידים • פלייליסט מותאם • סאונד מקצועי • חוויה
          אינטראקטיבית • MATY-CLUB • MATY-DATE • MATY-FIT • MATY-JAM •
        </div>
      </div>
    </section>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ CORE MODULES                                           │
   ╰─────────────────────────────────────────────────────────╯ */

function CoreModules() {
  return (
    <section className="mb-14">
      <header className="mb-5">
        <h2 className="text-2xl md:text-3xl font-extrabold">הליבה של המותג</h2>
        <p className="opacity-80">
          שלושה מודולים שמרכיבים את החוויה – במה, קהילה וחיבורים
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-5">
        {/* MUSIC */}
        <article className="about-card dark p-5 border dark:border-white/10 anim-slide-up">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold">MATY-MUSIC</h3>
            <span className="text-xs opacity-60">מוזיקה חיה</span>
          </div>
          <p className="opacity-80 mt-2 text-sm leading-7">
            בית לכל מה שמוזיקלי במותג — דמואים, רשימות השמעה, ויז׳ואלס, חבילות
            אירוע והשראות. החזון: חוויה בינלאומית, נקיה ומדויקת, שמציגה איכות
            ולא רק רעש.
          </p>
          <ul className="text-sm opacity-80 space-y-1 mt-3">
            <li>• נגן חכם עם רשימות</li>
            <li>• קטלוג סגנונות חי</li>
            <li>• חבילות לאירוע מותאם</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2 justify-end">
            <Link className="btn" href="/music">
              כנסו לשירים
            </Link>
            <Link className="btn" href="/events">
              הזמנת הופעה
            </Link>
          </div>
        </article>

        {/* DATE */}
        <article className="about-card dark p-5 border dark:border-white/10 anim-slide-up anim-delay-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold">MATY-DATE</h3>
            <span className="text-xs opacity-60">שידוכים חכמים</span>
          </div>
          <p className="opacity-80 mt-2 text-sm leading-7">
            שכבת התאמות שמזהה מכנה משותף: זרם ביהדות, עיר, דפוסי האזנה, סוג
            אירועים, חברים משותפים ועוד. רשת סגורה, כניסה באישור בלבד, ומודרציה
            הדוקה.
          </p>
          <ul className="text-sm opacity-80 space-y-1 mt-3">
            <li>• התאמות לפי סגנון ושמיעה</li>
            <li>• פרטיות ובטיחות בקהילה</li>
            <li>• אפשרות לצ׳ט/וידאו בהמשך</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2 justify-end">
            <Link className="btn" href="/maty-date">
              בואו להכיר
            </Link>
            <Link className="btn" href="/about#faq">
              שאלות ותשובות
            </Link>
          </div>
        </article>

        {/* CLUB */}
        <article className="about-card dark p-5 border dark:border-white/10 anim-slide-up anim-delay-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold">MATY-CLUB</h3>
            <span className="text-xs opacity-60">רשת חברתית נקיה</span>
          </div>
          <p className="opacity-80 mt-2 text-sm leading-7">
            פיד בטוח ומסונן: פוסטים, לייקים, תגובות, שיתופים ותוכן מוזיקלי
            מהקהילה. יכולות מתקדמות נפתחות לפי מנוי — וידאו לייב ואירועי
            אונליין.
          </p>
          <ul className="text-sm opacity-80 space-y-1 mt-3">
            <li>• פיד עם מודרציה, בלי רעש</li>
            <li>• הפעלות קהילה סביב מוזיקה</li>
            <li>• תמיכה ביוצרים ומתנות דיגיטליות</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2 justify-end">
            <Link className="btn" href="/club">
              פתחו פרופיל
            </Link>
            <Link className="btn" href="/pricing">
              מחירים
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ VISION & VALUES                                        │
   ╰─────────────────────────────────────────────────────────╯ */

function VisionValues() {
  const values = [
    {
      title: "מוזיקה לפני הכל",
      text: "השיר הנכון בזמן הנכון חשוב יותר מעיצוב, לוגו או פיצ׳ר. כל החלטה מתחילה מהמוזיקה ומהקהל.",
    },
    {
      title: "קהילה נקיה",
      text: "שפה מכבדת, בלי זבל ברשת, בלי שיימינג. MATY-CLUB ומערכות האירועים נבנות סביב שמירה על לב נקי.",
    },
    {
      title: "טכנולוגיה בשירות הרגש",
      text: "AI, ניגון חכם ושכבות דיגיטליות נועדו להעצים את החוויה האנושית, לא להחליף אותה.",
    },
    {
      title: "שקיפות",
      text: "תמחור ברור, חוזה פשוט, הסכמות דיגיטליות (ב-MATY-DATE) – בלי אותיות קטנות.",
    },
    {
      title: "התאמה לקהילה",
      text: "חתונה חב״דית, אירוע ישיבתי, בר-מצווה משפחתית או ערב קהילה מעורב – כל קהל מקבל שפה משלו.",
    },
    {
      title: "למידה כל הזמן",
      text: "שיפור סטים, ציוד, תהליכי עבודה ודיגיטל לפי פידבק מאירועים ומהמשתמשים.",
    },
  ];

  return (
    <section className="mb-14">
      <header className="mb-5">
        <h2 className="text-2xl md:text-3xl font-extrabold">
          חזון וערכי המותג
        </h2>
        <p className="opacity-80">
          מה עומד מאחורי המוזיקה, האתר והקהילה סביב MATY-MUSIC
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-5">
        {values.map((v, i) => (
          <article
            key={v.title}
            className="about-card dark p-5 border dark:border-white/10 anim-slide-up"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <h3 className="font-bold text-lg mb-1.5">{v.title}</h3>
            <p className="opacity-80 text-sm leading-7">{v.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ EVENT TYPES & FLOWS                                    │
   ╰─────────────────────────────────────────────────────────╯ */

function EventTypesAndFlows() {
  const types = [
    {
      title: "חתונה חב״דית / דתית",
      bullet: [
        "חופה עם ניגונים חסידיים, קבלת פנים עדינה",
        "ריקודי מצווה/חסידי, סטים של התוועדות וקפיצות",
        "תיאום מלא עם הרב/מסדר הקידושין",
      ],
      tag: "wedding",
    },
    {
      title: "בר-מצווה / אירוע משפחתי",
      bullet: [
        "שירים שמכילים את בעלי השמחה והדור הצעיר",
        "מקטעי דרשות עם ליווי עדין",
        "ריקודים, מעגלים ושירים מודרניים בפיקוח",
      ],
      tag: "barmitzvah",
    },
    {
      title: "אירוע קהילה / ישיבה",
      bullet: [
        "ניגוני התוועדות • שירי שליחות • שירי אווירה",
        "דינמיקה שעוברת בין דיבור לניגון",
        "אפשרות למיקרופונים למספר דוברים",
      ],
      tag: "community",
    },
    {
      title: "התוועדות / ערב ניגונים",
      bullet: [
        "ניגוני חב״ד לעומק, בגרסאות מותאמות לאירוע",
        "מעברים עדינים, בלי לשבור את האווירה",
        "הגברה מאוזנת – בלי לצעוק על אנשים",
      ],
      tag: "farbrengen",
    },
  ];

  const flowSteps = [
    {
      title: "1. שיחת תיאום קצרה",
      text: "מגדירים סוג אירוע, קהל יעד, אופי – חופה, ריקודים, ערב ניגונים וכו׳.",
    },
    {
      title: "2. בניית סט-ליסט חכם",
      text: "שילוב ניגונים/ים-תיכוני/שקטים, עם חלוקה ברורה של מעברים.",
    },
    {
      title: "3. תיאום טכני",
      text: "מיקום, חיבור חשמל, במה, תאורה, ציוד הגברה קיים או שלנו.",
    },
    {
      title: "4. ערב האירוע",
      text: "הגעה מוקדמת, צ׳ק סאונד, התאמה לצוות האירוע ולשינויים בזמן אמת.",
    },
    {
      title: "5. סיכום למידה",
      text: "משוב קצר אחרי האירוע, עדכונים לסטים ולמערכת MATY-MUSIC.",
    },
  ];

  return (
    <section className="mb-14">
      <header className="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold">
            סוגי אירועים וזרימת ערב
          </h2>
          <p className="opacity-80">
            לאירוע משפחתי קטן או לאולם גדול – התהליך נשאר מסודר ושקוף
          </p>
        </div>
        <p className="text-xs md:text-sm opacity-60 max-w-xs">
          כל אירוע מתחיל משיחה קצרה, ונגמר בתחושה שהמוזיקה הייתה מדויקת ולא
          השתלטה.
        </p>
      </header>

      <div className="grid md:grid-cols-[2fr,1.4fr] gap-6">
        <div className="space-y-4">
          {types.map((t, i) => (
            <article
              key={t.title}
              className="about-card dark p-4 md:p-5 border dark:border-white/10 anim-slide-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-bold text-lg">{t.title}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/90 text-slate-100">
                  {t.tag}
                </span>
              </div>
              <ul className="opacity-85 text-sm leading-7 space-y-1">
                {t.bullet.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="about-card dark p-5 border dark:border-white/10 anim-slide-up anim-delay-2">
          <h3 className="font-bold text-lg mb-2">איך נראה התהליך בפועל</h3>
          <ol className="space-y-3 text-sm opacity-85">
            {flowSteps.map((s) => (
              <li key={s.title}>
                <div className="font-semibold mb-0.5">{s.title}</div>
                <p className="leading-6">{s.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-4 text-right">
            <Link href="/contact" className="btn">
              להתחיל שיחה
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ SAMPLE SETLISTS                                        │
   ╰─────────────────────────────────────────────────────────╯ */

function SampleSetlists() {
  const sets = [
    {
      label: "סט ריקודים חב״די",
      mood: "אנרגטי • מעגלים",
      items: [
        "הניגון הארוך (חב״ד) — פתיחה",
        "יחי אדוננו — קפיצה",
        "דרכך אלוקינו — מעגל",
        "כי בשמחה תצאון — סיבוב רחבה",
        "ניגון צמאה — מעבר להתוועדות",
      ],
    },
    {
      label: "סט קבלת פנים / חופה",
      mood: "שקט • מרגש",
      items: [
        "הללו • נעימה חסידית עדינה",
        "מי בן שיח • אינסטרומנטלי",
        "אם אשכחך ירושלים • וריאציה פסנתרית",
        "עוד ישמע בערי יהודה • ברידג׳ לחופה",
      ],
    },
    {
      label: "סט ים-תיכוני נקי",
      mood: "מקפיץ • מוכר",
      items: [
        "מחרוזת הללויה / נשמה",
        "ים של דמעות – גרסת במה מותאמת",
        "מודה אני לפניך • גרסת ריקוד",
        "שיר שמח בסגנון חפלות נקיות",
      ],
    },
  ];

  return (
    <section className="mb-14">
      <header className="mb-5">
        <h2 className="text-2xl md:text-3xl font-extrabold">
          דוגמאות לסט-ליסטים
        </h2>
        <p className="opacity-80">
          לא מחייב – אבל נותן תחושה איך נראה ערב בנוי נכון
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-5">
        {sets.map((set, i) => (
          <article
            key={set.label}
            className="about-card dark p-5 border dark:border-white/10 anim-slide-up"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">{set.label}</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/90 text-white">
                {set.mood}
              </span>
            </div>
            <ol className="text-sm opacity-85 leading-7 ps-4 list-decimal list-inside">
              {set.items.map((song) => (
                <li key={song}>{song}</li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ GALLERY – כרטיס אחד עם גלילה                          │
   ╰─────────────────────────────────────────────────────────╯ */

function GallerySection() {
  const gallery = GALLERY_IMAGES;

  return (
    <section className="mb-14">
      <header className="mb-5">
        <h2 className="text-2xl md:text-3xl font-extrabold">גלריה</h2>
        <p className="opacity-80">
          הקדמה קטנה – אפשר לגלול ימינה/שמאלה בתוך המשבצת, ולחיצה תפתח את כל
          הגלריה
        </p>
      </header>

      {gallery.length === 0 ? (
        <div className="about-card dark border dark:border-white/10 p-6 text-sm opacity-80">
          עדיין לא הועלו תמונות לגלריה. ניתן להעלות דרך פאנל האדמין.
        </div>
      ) : (
        <Link
          href="/gallery"
          className="group block about-card dark border dark:border-white/10 ringed overflow-hidden"
        >
          <div
            className="relative flex gap-3 overflow-x-auto py-3 pe-3 ps-1 md:ps-2"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {gallery.map((src, idx) => (
              <div
                key={src}
                className="relative shrink-0 snap-center rounded-2xl overflow-hidden border border-white/10 min-w-[220px] md:min-w-[260px] h-[150px] md:h-[190px]"
              >
                <Image
                  src={src}
                  alt={`גלריה ${idx + 1}`}
                  fill
                  sizes="(min-width: 768px) 33vw, 80vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03] pointer-events-none select-none"
                  draggable={false}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute bottom-1.5 right-2 text-[11px] text-white/90 bg-black/55 rounded-full px-2 py-0.5">
                  תמונה {idx + 1}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 px-3 md:px-4 py-2 text-[12px] md:text-sm">
            <span className="opacity-70">
              גררו בתוך המשבצת ימינה/שמאלה כדי לראות עוד רגעים
            </span>
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 bg-slate-900/90 text-slate-100 text-[11px] md:text-xs group-hover:bg-violet-600/90 transition-colors">
              כניסה לכל הגלריה
              <span aria-hidden>↗</span>
            </span>
          </div>
        </Link>
      )}
    </section>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ STATS                                                  │
   ╰─────────────────────────────────────────────────────────╯ */

function StatsSection() {
  const stats = [
    {
      label: "אירועים בשנה",
      value: "80+",
      hint: "חתונות • חופות • קהילות",
    },
    {
      label: "קטלוג שירים",
      value: "9000+",
      hint: "ניגונים ושירים לסטים שונים",
    },
    {
      label: "סאונד-סיסטם",
      value: "RCF / JBL",
      hint: "935-A / PRX – לפי גודל אולם",
    },
    {
      label: "קלידים",
      value: "Korg Pa5X MG",
      hint: "סטים מותאמים ואורגן פרימיום",
    },
  ];

  return (
    <section className="mb-14">
      <header className="mb-5">
        <h2 className="text-2xl md:text-3xl font-extrabול">
          מספרים שמספרים סיפור
        </h2>
        <p className="opacity-80">
          מבוסס על אירועים, דמואים, ציוד והשקעה מאחורי הקלעים
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {stats.map((s, idx) => (
          <div
            key={s.label}
            className="about-card dark p-5 border dark:border-white/10 text-right anim-slide-up"
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            <div className="text-3xl md:text-4xl font-extrabold">{s.value}</div>
            <div className="opacity-90">{s.label}</div>
            <div className="opacity-60 text-sm">{s.hint}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ TIMELINE                                               │
   ╰─────────────────────────────────────────────────────────╯ */

function TimelineSection() {
  const steps = [
    {
      title: "התחלה על הבמות",
      desc: "הפקות קהילתיות קטנות, חיפוש סאונד נכון ועבודה צמודה עם קהל.",
      year: "2014–2017",
    },
    {
      title: "הקמה רשמית של MATY-MUSIC",
      desc: "מיתוג, הצטיידות מקצועית, בניית קטלוג שירים, והופעות קבועות.",
      year: "2018–2021",
    },
    {
      title: "הרחבה דיגיטלית",
      desc: "בניית אתר עם נגן, גלריות, והתחלה של MATY-CLUB / MATY-DATE.",
      year: "2022–2024",
    },
    {
      title: "MATY+ — היום",
      desc: "במה חיה, רשת חברתית נקיה, שידוכים חכמים ופרויקטים חדשים סביב מוזיקה חיה.",
      year: "2025 →",
    },
  ];

  return (
    <section className="mb-14">
      <header className="mb-5">
        <h2 className="text-2xl md:text-3xl font-extrabold">הדרך</h2>
        <p className="opacity-80">נקודות ציון קצרות במסע של MATY-MUSIC</p>
      </header>

      <ol className="relative border-s border-slate-200 dark:border-white/10 ps-5 space-y-6">
        {steps.map((t, i) => (
          <li
            key={t.title}
            className="anim-slide-up"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="absolute -right-[7px] mt-1 size-3 rounded-full bg-violet-500 ring-4 ring-white dark:ring-neutral-900" />
            <div className="ms-4">
              <div className="text-sm opacity-60">{t.year}</div>
              <h3 className="text-lg font-bold">{t.title}</h3>
              <p className="opacity-85 leading-7">{t.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ GEAR / SETUP                                           │
   ╰─────────────────────────────────────────────────────────╯ */

function GearSection() {
  return (
    <section className="mb-14" id="gear">
      <header className="mb-5">
        <h2 className="text-2xl md:text-3xl font-extrabold">ציוד במה</h2>
        <p className="opacity-80">בחירות מדויקות לסאונד חי ואמין</p>
      </header>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="about-card dark p-5 border dark:border-white/10">
          <h3 className="font-bold text-lg">Keys & Sound</h3>
          <ul className="opacity-85 text-sm leading-8">
            <li>• Korg Pa5X MG — סטים/קומבינציות מותאמות לאירועים</li>
            <li>• מיקסר עם הקלטה ושליטה מלאה, EQ/FX חכם</li>
            <li>• RCF ART 935-A / JBL PRX — לפי גודל האולם</li>
            <li>• מיקרופונים דינמיים וקונדנסר, לפי סוג האירוע</li>
            <li>• כבלים/סטנדים K&M, סידור במה נקי ומכבד</li>
          </ul>
        </div>
        <div className="about-card dark p-5 border dark:border-white/10">
          <h3 className="font-bold text-lg">Stage Flow</h3>
          <ul className="opacity-85 text-sm leading-8">
            <li>• בניית פלייליסט חכם לפי קהל וזמן בערב</li>
            <li>• מעבר חלק בין ניגונים, קטעי תפילה וים-תיכוני</li>
            <li>• אינטראקציה שקולה עם הקהל – לא לוקחים את כל הבמה</li>
            <li>• סטים קצרים/ארוכים לפי תכנון עם המשפחה</li>
            <li>• תיאום מלא עם מפיק, צלם, אנשי אולם ותזמורת נוספת אם יש</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 text-right">
        <Link href="/about#faq" className="btn">
          לשאלות נפוצות
        </Link>
      </div>
    </section>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ MATY+ TECH ECOSYSTEM                                   │
   ╰─────────────────────────────────────────────────────────╯ */

function MatyTechSection() {
  const rows = [
    {
      title: "MATY-MUSIC (האתר הזה)",
      text: "נגן מוזיקה, גלריות, עמודי אירוע, טפסי הזמנה, ודפי תוכן.",
      chip: "MUSIC",
    },
    {
      title: "MATY-CLUB",
      text: "פיד נקי סביב מוזיקה, ניגונים ותוכן קהילתי, עם תגובות ולייקים.",
      chip: "CLUB",
    },
    {
      title: "MATY-DATE",
      text: "מערכת התאמות ושידוכים חכמה סביב סגנון חיים, קהילה ומוזיקה.",
      chip: "DATE",
    },
    {
      title: "MATY-FIT",
      text: "מודול כושר ובריאות, כדי שהנגנים והקהל יישארו באנרגיה טובה.",
      chip: "FIT",
    },
    {
      title: "MATY-JAM",
      text: "קבוצות ג'אם, חיבור מוזיקאים, ועתיד של חזרות אונליין.",
      chip: "JAM",
    },
  ];

  return (
    <section className="mb-14">
      <header className="mb-5">
        <h2 className="text-2xl md:text-3xl font-extrabold">
          MATY+ – הצד הטכנולוגי
        </h2>
        <p className="opacity-80">
          מאחורי הקלעים – איך האתר והאפליקציות מתחברות לעולם האמיתי
        </p>
      </header>

      <div className="about-card dark p-5 border dark:border-white/10">
        <div className="grid md:grid-cols-[1.4fr,1.2fr] gap-5 items-start">
          <div className="space-y-4 text-sm opacity-85 leading-7">
            <p>
              MATY+ הוא אקו-סיסטם דיגיטלי: אתר, רשת חברתית, מודול שידוכים, פיטנס
              ומודול ג'אם למוזיקאים. הכל נבנה על בסיס טכנולוגיות מודרניות
              (Next.js, MongoDB, מערכות סטרימינג) אבל נשאר עם שפה חמה, של קהילה
              ובמה.
            </p>
            <p>
              האתר של MATY-MUSIC מיועד גם ללקוחות אירועים וגם למוזיקאים ושיתופי
              פעולה. מכאן אפשר לצפות בדמואים, להשאיר פרטים, להיכנס ל-CLUB, ואף
              בהמשך להתנסות בחלק מפיצ׳רי MATY-DATE בצורה בטוחה.
            </p>
            <p>
              המטרה: אקו-סיסטם אחד שמלווה את המשתמש מהמוזיקה שהוא שומע, דרך
              האירוע שלו, אל הקהילה שבה הוא חי.
            </p>
          </div>
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div
                key={r.title}
                className="shimmer rounded-2xl p-[1px] anim-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="about-card dark p-3 border dark:border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{r.title}</div>
                    <div className="text-[12px] opacity-75">{r.text}</div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/90 text-slate-100">
                    {r.chip}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ AUDIENCE PERSONAS                                      │
   ╰─────────────────────────────────────────────────────────╯ */

function PersonasSection() {
  const personas = [
    {
      name: "הורי חתן/כלה",
      what: "רוצים ערב שמח, מכובד, בלי מוזיקה שתביך את המשפחה.",
      how: "בניית סטים שמכבדים את הדור המבוגר אבל משאירים מקום לצעירים.",
    },
    {
      name: "בחור ישיבה / שליח",
      what: "מחפש ערב ניגונים, התוועדות, או חופה בסגנון חב״די נקי.",
      how: "שימוש בניגונים מוכרים, מעברים מדויקים, חיבור לחסידות.",
    },
    {
      name: "קהילה מעורבת",
      what: "אנשים מהרבה רקעים, שכל אחד יצא בתחושה שהתחשבו בו.",
      how: "שילוב חכם בין שקט, חסידי וים-תיכוני, בלי לאבד את הזהות.",
    },
  ];

  return (
    <section className="mb-14">
      <header className="mb-5">
        <h2 className="text-2xl md:text-3xl font-extrabold">למי זה מתאים</h2>
        <p className="opacity-80">
          כמה פרסונות שמייצגות את מי שמגיע ל-MATY-MUSIC בפועל
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-5">
        {personas.map((p, i) => (
          <article
            key={p.name}
            className="about-card dark p-5 border dark:border-white/10 anim-slide-up"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <h3 className="font-bold text-lg mb-1.5">{p.name}</h3>
            <p className="opacity-80 text-sm leading-7 mb-1.5">
              <b>מה חשוב לו/לה:</b> {p.what}
            </p>
            <p className="opacity-80 text-sm leading-7">
              <b>איך MATY-MUSIC מגיב:</b> {p.how}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ FAQ                                                    │
   ╰─────────────────────────────────────────────────────────╯ */

function FaqSection() {
  const faqs = [
    {
      q: "איך בוחרים סט לאירוע?",
      a: "נבנה פלייליסט לפי סגנון הקהל, סוג האירוע והדגשים שלך. לפני האירוע נסגור רשימת כיוון, ובשטח נתאים דינמיקה לפי מה שקורה.",
    },
    {
      q: "אפשר לקבל דמואים לפני שסוגרים?",
      a: "בהחלט. יש עמוד וידאו/דמואים באתר, ותמיד אפשר לשלוח עוד לינקים רלוונטיים לפי סוג אירוע.",
    },
    {
      q: "כמה זמן מנגנים בערב רגיל?",
      a: "בד״כ 2–4 סטים מרכזיים, 25–45 דקות כל אחד, בתוספת פתיחות, חופה וקבלת פנים. הכל מותאם לפי האירוע.",
    },
    {
      q: "איך עובד התמחור?",
      a: "התמחור תלוי במיקום, ציוד נדרש, משך האירוע, תאריך ועומס. המטרה: מחיר הוגן, שקוף, בלי הפתעות.",
    },
    {
      q: "אתה מגיע לבד או עם צוות?",
      a: "לפי גודל האירוע: לעיתים אני לבד על עמדת הקלידים והסאונד, ולעיתים עם טכנאי נוסף, כלי נגינה נוספים או זמר/ים אורחים.",
    },
    {
      q: "אפשר שירים מותאמים אישית?",
      a: "כן – אם יש שיר מיוחד למשפחה, נבדוק איך אפשר לשלב אותו בצורה מכובדת ומקצועית בערב.",
    },
  ];

  return (
    <section className="mb-16" id="faq">
      <header className="mb-5">
        <h2 className="text-2xl md:text-3xl font-extrabold">שאלות נפוצות</h2>
        <p className="opacity-80">הכי שקוף והכי פשוט</p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        {faqs.map((f, i) => (
          <details
            key={f.q}
            className="about-card dark p-4 md:p-5 border dark:border-white/10 anim-slide-up"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <summary className="cursor-pointer text-lg font-semibold">
              {f.q}
            </summary>
            <div className="opacity-85 mt-2 leading-7 text-sm md:text-base">
              {f.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ CTA                                                    │
   ╰─────────────────────────────────────────────────────────╯ */

function CtaSection() {
  return (
    <section className="mb-10">
      <div className="about-card dark p-6 md:p-8 border dark:border-white/10 ringed">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex-1 text-right">
            <h3 className="text-2xl md:text-3xl font-extrabold">
              בואו נרים במה • ביחד
            </h3>
            <p className="opacity-80 mt-1">
              נבנה פלייליסט על פי הקהל שלכם, נסגור תיאום טכני וננהל את האנרגיה
              מהשיר הראשון עד האחרון. המטרה – ערב שמח, מכובד, ונקי.
            </p>
          </div>
          <div className="flex gap-2">
            <Link className="btn" href="/events">
              הזמנת הופעה
            </Link>
            <Link className="btn" href="/contact">
              צור קשר
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ FOOT NAV                                               │
   ╰─────────────────────────────────────────────────────────╯ */

function FootNav() {
  const links = [
    { href: "/", label: "בית" },
    { href: "/genre", label: "שירים" },
    { href: "/videos", label: "וידאו" },
    { href: "/gallery", label: "גלריה" },
    { href: "/events", label: "הזמנת הופעה" },
    { href: "/club", label: "MATY-CLUB" },
    { href: "/maty-date", label: "MATY-DATE" },
    { href: "/contact", label: "צור קשר" },
    { href: "/about#gear", label: "ציוד" },
    { href: "/about#faq", label: "FAQ" },
  ];

  return (
    <nav
      aria-label="קישורים מהירים"
      className="flex flex-wrap gap-3 justify-end opacity-90"
    >
      {links.map((l) => (
        <Link
          key={l.label}
          href={l.href}
          className="chip dark rounded-full px-3 py-1 text-sm"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
