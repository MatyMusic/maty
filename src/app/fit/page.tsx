// src/app/fit/page.tsx
"use client";

/**
 * MATY-FIT — Landing Page (Rev D)
 * ------------------------------------------------------------
 * • Hero 3×3 וידאואים (Mosaic / Single) עם שליטת סאונד גלובלית
 * • המון סקשנים: פיצ'רים, קיצורי דרך, שותפים, איך זה עובד,
 *   הישגים, קטגוריות, המלצות, FAQ, CTA
 * • סקשן חדש: MATY-FIT AI + LIVE (מחובר ל-FitAiBuilder & FitLivePanel)
 * • סקשן חדש: גשר ל-MATY-DATE – API /fit/date-bridge
 */

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell,
  Users2,
  HeartPulse,
  Flame,
  MapPin,
  Compass,
  Search,
  Play,
  Volume2,
  VolumeX,
  Sparkles as SparklesIcon,
  Timer,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Trophy,
  Star,
  Cpu,
  Zap,
  LucideProps,
} from "lucide-react";

import FitAiBuilder from "@/components/fit/FitAiBuilder";
import FitLivePanel from "@/components/fit/FitLivePanel";

// -------------------------------------------------------------
// Utilities
// -------------------------------------------------------------

type IconType = (props: LucideProps) => React.ReactNode;

type Feature = {
  title: string;
  desc: string;
  icon: IconType;
};

type ShowcaseCard = {
  href: string;
  title: string;
  desc: string;
  badge?: string;
  icon?: IconType;
};

type FAQ = { q: string; a: string };

const EASE = [0.16, 1, 0.3, 1] as const;

function cn(...args: Array<string | false | undefined | null>) {
  return args.filter(Boolean).join(" ");
}

// Buttons — strong contrast presets
const btn = {
  primary:
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70",
  secondary:
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-black dark:hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600/60",
  subtle:
    "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 border border-neutral-200 dark:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/50",
  ghost:
    "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-500/10 border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
} as const;

// -------------------------------------------------------------
// Decorative Backgrounds
// -------------------------------------------------------------

function BackgroundDecor() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -top-40 right-1/2 h-[600px] w-[1200px] translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,200,0,0.24),transparent_60%)] blur-3xl" />
      <div className="absolute top-1/3 right-0 h-72 w-96 rotate-12 bg-gradient-to-b from-amber-400/20 via-pink-400/10 to-purple-500/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 h-72 w-[28rem] -rotate-12 bg-gradient-to-t from-emerald-400/10 via-cyan-400/10 to-transparent blur-2xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] [background-size:44px_44px] dark:opacity-30 opacity-20" />
    </div>
  );
}

function FloatingSparkles() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      {[...Array(18)].map((_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{
            opacity: [0, 1, 0],
            y: [10, -10, 10],
            scale: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 5 + (i % 5),
            repeat: Infinity,
            delay: (i * 0.37) % 2,
            ease: "easeInOut",
          }}
          className="absolute text-amber-400/70"
          style={{ right: `${(i * 7) % 100}%`, top: `${(i * 11) % 100}%` }}
        >
          ✦
        </motion.span>
      ))}
    </div>
  );
}

// -------------------------------------------------------------
// Hooks
// -------------------------------------------------------------

function useHeaderScroll() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

function usePrefersReducedMotion() {
  const [prm, setPrm] = React.useState(false);
  React.useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrm(m.matches);
    const l = () => setPrm(m.matches);
    m.addEventListener("change", l);
    return () => m.removeEventListener("change", l);
  }, []);
  return prm;
}

function useInViewport(ref: React.RefObject<HTMLElement>, threshold = 0.1) {
  const [vis, setVis] = React.useState(true);
  React.useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => setVis(entries[0]?.isIntersecting ?? true),
      { threshold },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return vis;
}

function useLocalStorage<T>(key: string, initial: T) {
  const [state, setState] = React.useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

// -------------------------------------------------------------
// Header / Nav (פנימי של FIT — בנוסף ל-Header הגלובלי שלך)
// -------------------------------------------------------------

function BrandMark() {
  return (
    <Link
      href="/fit"
      className="flex items-center gap-2 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 rounded-xl"
    >
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500" />
        <div className="absolute inset-[4px] rounded-lg bg-white/90 dark:bg-black/60 backdrop-blur shadow-inner" />
        <div className="absolute inset-0 grid place-items-center text-[11px] font-black tracking-wider text-black/80 dark:text-white/80">
          MF
        </div>
      </div>
      <span className="font-black tracking-tight text-lg">
        MATY<span className="text-amber-500">-</span>FIT
      </span>
    </Link>
  );
}

const navLinks = [
  { href: "/fit/exercises", label: "תרגילים", icon: Dumbbell },
  { href: "/fit/workouts", label: "אימונים", icon: Timer },
  { href: "/fit/partners", label: "שותפים", icon: Users2 },
  { href: "/fit/groups", label: "קבוצות", icon: HeartPulse },
] as const;

function FitInnerHeader() {
  const scrolled = useHeaderScroll();
  return (
    <div
      className={cn(
        "sticky top-[56px] md:top-[64px] z-30 w-full transition-all duration-300",
        scrolled
          ? "backdrop-blur bg-white/70 dark:bg-black/50 border-b"
          : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <BrandMark />
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium hover:bg-amber-50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/fit/exercises" className={btn.subtle}>
            <Search size={16} /> חפש
          </Link>
          <Link href="/fit/workouts" className={btn.primary}>
            <SparklesIcon size={16} /> התחל עכשיו
          </Link>
        </div>
      </nav>
    </div>
  );
}

// -------------------------------------------------------------
// Video Model
// -------------------------------------------------------------

type Vid = { src: string; poster?: string; label?: string };

const VIDEO_SET: Vid[] = [
  {
    src: "/videos/fit/krav-maga.mp4",
    poster: "/videos/fit/posters/krav.jpg",
    label: "קרב מגע",
  },
  {
    src: "/videos/fit/boxing.mp4",
    poster: "/videos/fit/posters/boxing.jpg",
    label: "אגרוף",
  },
  {
    src: "/videos/fit/hiit.mp4",
    poster: "/videos/fit/posters/hiit.jpg",
    label: "HIIT",
  },
  {
    src: "/videos/fit/calisthenics.mp4",
    poster: "/videos/fit/posters/cali.jpg",
    label: "קליסטניקס",
  },
  {
    src: "/videos/fit/yoga.mp4",
    poster: "/videos/fit/posters/yoga.jpg",
    label: "יוגה",
  },
  {
    src: "/videos/fit/cardio.mp4",
    poster: "/videos/fit/posters/cardio.jpg",
    label: "קרדיו",
  },
  {
    src: "/videos/fit/crossfit.mp4",
    poster: "/videos/fit/posters/crossfit.jpg",
    label: "קרוספיט",
  },
  {
    src: "/videos/fit/stretch.mp4",
    poster: "/videos/fit/posters/stretch.jpg",
    label: "מתיחות",
  },
  {
    src: "/videos/fit/weights.mp4",
    poster: "/videos/fit/posters/weights.jpg",
    label: "משקולות",
  },
];

// -------------------------------------------------------------
// HERO — 3×3 Mosaic / Single
// -------------------------------------------------------------

function TileControls({
  muted,
  onToggle,
}: {
  muted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="absolute right-1 top-1 z-10 rounded-full bg-black/50 text-white p-1.5 backdrop-blur hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
      aria-label={muted ? "הפעלת סאונד" : "השתקת סאונד"}
    >
      {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
    </button>
  );
}

function VideoTile({
  v,
  play,
  globalMute,
}: {
  v: Vid;
  play: boolean;
  globalMute: boolean;
}) {
  const ref = React.useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = React.useState(true);

  // סנכרון עם מיוט גלובלי
  React.useEffect(() => {
    setMuted(globalMute);
  }, [globalMute]);

  // הפעל/עצור בהתאם ל-play
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (play) el.play().catch(() => {});
    else el.pause();
  }, [play]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = muted; // נדרש ל-autoplay
    if (!muted) el.volume = 0.6;
  }, [muted]);

  return (
    <div className="relative h-24 sm:h-28 rounded-xl overflow-hidden group will-change-transform">
      <video
        ref={ref}
        src={v.src}
        poster={v.poster}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
      />
      <span className="absolute left-1.5 top-1.5 z-10 rounded-md bg-red-500/80 text-white text-[10px] px-1.5 py-0.5">
        LIVE
      </span>
      <TileControls muted={muted} onToggle={() => setMuted((m) => !m)} />
      {v.label && (
        <div className="absolute bottom-1 right-1 rounded-md bg-black/45 text-white text-[10px] px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition">
          {v.label}
        </div>
      )}
    </div>
  );
}

function Hero() {
  const prm = usePrefersReducedMotion();
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const inView = useInViewport(wrapRef);
  const [mode, setMode] = useLocalStorage<"mosaic" | "single">(
    "fit:hero:mode",
    "mosaic",
  );
  const [globalMute, setGlobalMute] = useLocalStorage<boolean>(
    "fit:hero:mute",
    true,
  );

  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const on = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const primary = VIDEO_SET[0];

  return (
    <section className="relative" ref={wrapRef}>
      <BackgroundDecor />
      <FloatingSparkles />

      <div className="mx-auto max-w-6xl px-4 pt-10 pb-12 md:pt-16 md:pb-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          {/* Text Column */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] bg-white/70 dark:bg-black/40 backdrop-blur">
                <SparklesIcon size={14} /> ברוך הבא ל-MATY-FIT
              </p>
              <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
                מסך פתיחה מרשים — אימון חכם, קהילה חזקה.
              </h1>
              <p className="mt-3 text-[15px] leading-7 opacity-80">
                מצא שותפי אימון לידך, הצטרף לקבוצות מאושרות, גלה תרגילים
                מקצועיים ובנה תבניות אימון מותאמות. הכול במקום אחד, בעברית,
                בחינם.
              </p>

              {/* Controls */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setMode("mosaic")}
                  className={cn(
                    btn.subtle,
                    mode === "mosaic" &&
                      "ring-2 ring-amber-500/60 bg-amber-50 dark:bg-amber-500/10",
                  )}
                  aria-pressed={mode === "mosaic"}
                >
                  פסיפס 3×3
                </button>
                <button
                  onClick={() => setMode("single")}
                  className={cn(
                    btn.subtle,
                    mode === "single" &&
                      "ring-2 ring-amber-500/60 bg-amber-50 dark:bg-amber-500/10",
                  )}
                  aria-pressed={mode === "single"}
                >
                  וידאו יחיד
                </button>

                <button
                  onClick={() => setGlobalMute((m) => !m)}
                  className={btn.ghost}
                  aria-label={
                    globalMute
                      ? "הפעלת סאונד לכל הווידאואים"
                      : "השתקת כל הווידאואים"
                  }
                >
                  {globalMute ? <VolumeX size={16} /> : <Volume2 size={16} />}{" "}
                  {globalMute ? "מיוט לכולם" : "סאונד לכולם"}
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/fit/exercises" className={btn.primary}>
                  <Dumbbell size={18} /> ספריית תרגילים
                </Link>
                <Link href="/fit/workouts" className={btn.secondary}>
                  <Timer size={18} /> אימונים אישיים
                </Link>
                <Link href="/fit/partners" className={btn.subtle}>
                  <Users2 size={18} /> מי סביבי
                </Link>
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6, ease: EASE }}
                className="mt-8 grid grid-cols-3 gap-2"
              >
                {[
                  { k: "+1.5K", v: "תרגילים" },
                  { k: "∞", v: "השראה" },
                  { k: "100%", v: "חינם" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border bg-white/70 p-3 text-center backdrop-blur dark:bg-black/30"
                  >
                    <div className="text-xl font-bold">{s.k}</div>
                    <div className="text-xs opacity-70">{s.v}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Visual Column */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE }}
              className="relative overflow-hidden rounded-3xl border bg-white/70 backdrop-blur dark:bg-black/30"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-200/40 via-transparent to-pink-200/30" />

              {mode === "mosaic" ? (
                <div className="grid grid-cols-3 gap-2 p-4">
                  {(isMobile ? VIDEO_SET.slice(0, 6) : VIDEO_SET).map((v) => (
                    <VideoTile
                      key={v.src}
                      v={v}
                      play={inView && !prm}
                      globalMute={globalMute}
                    />
                  ))}
                </div>
              ) : (
                <div className="relative aspect-video">
                  <video
                    src={primary.src}
                    poster={primary.poster}
                    muted={globalMute}
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 grid place-items-center">
                    <button
                      className="pointer-events-auto flex items-center gap-2 rounded-full border bg-white/85 px-4 py-2 text-sm shadow-lg dark:bg-black/60"
                      onClick={() => setGlobalMute((m) => !m)}
                    >
                      <Play size={16} />{" "}
                      {globalMute ? "הפעל סאונד" : "השתק סאונד"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// Features Grid
// -------------------------------------------------------------

const features: Feature[] = [
  {
    title: "תרגילים מקצועיים",
    desc: "ספרייה עשירה עם פילטרים חכמים, תמונות/-GIF והסברים בעברית.",
    icon: Dumbbell,
  },
  {
    title: "אימונים אישיים",
    desc: "בנה תבניות, נהל סטים/חזרות, עקוב אחר התקדמות בזמן אמת.",
    icon: Timer,
  },
  {
    title: "שותפים סביבך",
    desc: "מצא שותפי אימון לפי מיקום, סוג אימון ורמה — קרוב לבית.",
    icon: MapPin,
  },
  {
    title: "קהילות וקבוצות",
    desc: "הצטרף לקבוצות ספורט מאושרות, צ'אטים, אירועים ואתגרים שבועיים.",
    icon: Users2,
  },
  {
    title: "שמירה ופרטיות",
    desc: "הנתונים נשמרים מקומית כברירת מחדל, עם אפשרות סנכרון מאובטח.",
    icon: ShieldCheck,
  },
  {
    title: "מהיר וקל",
    desc: "מינימום חיכוך, מקסימום תוצאה — ממשק RTL נוח ומהיר.",
    icon: Zap,
  },
];

function FeatureCard({ f, i }: { f: Feature; i: number }) {
  const Icon = f.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.03, duration: 0.5, ease: EASE }}
      className="rounded-2xl border bg-white/70 p-4 backdrop-blur hover:shadow-md dark:bg-black/30"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl border bg-amber-500/10 p-2 text-amber-600 dark:text-amber-300">
          <Icon size={18} />
        </div>
        <div className="font-semibold">{f.title}</div>
      </div>
      <p className="mt-2 text-sm leading-6 opacity-80">{f.desc}</p>
    </motion.div>
  );
}

function FeaturesGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-4">
        <h2 className="text-xl font-bold md:text-2xl">למה MATY-FIT?</h2>
        <p className="text-sm opacity-70">פשוט. מהיר. עובד בשבילך.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <FeatureCard key={f.title} f={f} i={i} />
        ))}
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// Showcases
// -------------------------------------------------------------

const showcases: ShowcaseCard[] = [
  {
    href: "/fit/exercises",
    title: "ספריית תרגילים",
    desc: "חפש לפי קטגוריה/שריר/ציוד/רמה. מדיה, הסברים וקיצורי דרך.",
    badge: "חדש",
    icon: Dumbbell,
  },
  {
    href: "/fit/workouts",
    title: "אימונים אישיים",
    desc: "בנה אימון בחמש שניות, שמור תבניות, עקוב אחרי PRs.",
    icon: Flame,
  },
  {
    href: "/fit/partners",
    title: "מי סביבי (שותפים)",
    desc: "התאמת שותפים לאימון לפי מיקום, ימים מועדפים וסוג אימון.",
    icon: Users2,
  },
  {
    href: "/fit/groups",
    title: "קבוצות ספורט",
    desc: "הצטרפות/פתיחת קבוצה (באישור אדמין), אירועים ואתגרים.",
    icon: HeartPulse,
  },
];

function ShowcaseCardView({ item, i }: { item: ShowcaseCard; i: number }) {
  const Icon = item.icon ?? Compass;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.04, duration: 0.6, ease: EASE }}
      className="group relative overflow-hidden rounded-3xl border bg-white/70 p-5 backdrop-blur hover:shadow-lg dark:bg-black/30"
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl transition group-hover:bg-amber-400/30" />
      {item.badge && (
        <span className="inline-flex items-center gap-1 rounded-full border bg-white/70 px-2 py-0.5 text-[11px] dark:bg-black/40">
          <SparklesIcon size={12} /> {item.badge}
        </span>
      )}
      <div className="mt-2 flex items-center gap-3">
        <div className="rounded-xl border bg-amber-500/10 p-2 text-amber-600 dark:text-amber-300">
          <Icon size={18} />
        </div>
        <h3 className="font-semibold">{item.title}</h3>
      </div>
      <p className="mt-1 line-clamp-2 text-sm opacity-80">{item.desc}</p>
      <Link href={item.href} className={cn(btn.ghost, "mt-4")}>
        המשך <ArrowRight size={14} />
      </Link>
    </motion.div>
  );
}

function Showcases() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold md:text-2xl">תתחיל מה שחשוב לך</h2>
          <p className="text-sm opacity-70">קיצורי דרך למסכים המרכזיים</p>
        </div>
        <Link href="/fit/exercises" className={btn.subtle}>
          <Search size={16} /> חיפוש מתקדם
        </Link>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {showcases.map((s, i) => (
          <ShowcaseCardView key={s.href} item={s} i={i} />
        ))}
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// Partner strip (placeholder)
// -------------------------------------------------------------

function BrandLogo({ name }: { name: string }) {
  return (
    <div className="grid h-10 place-items-center rounded-xl border bg-white/60 px-4 text-xs font-semibold opacity-70 backdrop-blur dark:bg-white/5">
      {name}
    </div>
  );
}

function PartnersStrip() {
  const items = [
    "ADIDAS",
    "NIKE",
    "ROGUE",
    "GYM-RAT",
    "IRON",
    "BREEZE",
    "YALLA-FIT",
    "POWER-UP",
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-3xl border bg-white/70 p-4 backdrop-blur dark:bg-black/30">
        <div className="mb-3 text-sm opacity-70">אוהבים אותנו:</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {items.map((n) => (
            <BrandLogo key={n} name={n} />
          ))}
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// How it works
// -------------------------------------------------------------

const steps = [
  {
    title: "גלה תרגילים",
    desc: "חפש לפי שריר/ציוד/רמה וקבל הסבר ברור.",
    icon: Search,
  },
  { title: "בנה אימון", desc: "גרור ושחרר לתבנית, שמור & שתף.", icon: Timer },
  { title: "מצא שותף", desc: "בדוק מי בסביבה שלך ומתי נוח לו.", icon: Users2 },
  {
    title: "הצטרף לקבוצה",
    desc: "אימוני קהילה מאושרים + אתגר שבועי.",
    icon: HeartPulse,
  },
] as const;

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-4">
        <h2 className="text-xl font-bold md:text-2xl">איך זה עובד?</h2>
        <p className="text-sm opacity-70">4 צעדים פשוטים כדי להתחיל לזוז</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.6, ease: EASE }}
              className="rounded-2xl border bg-white/70 p-5 backdrop-blur dark:bg-black/30"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl border bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-300">
                  <Icon size={18} />
                </div>
                <div className="font-semibold">{s.title}</div>
              </div>
              <p className="mt-2 text-sm leading-6 opacity-80">{s.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// Achievements
// -------------------------------------------------------------

function Achievements() {
  const items = [
    {
      icon: Trophy,
      title: "יעדי חודש",
      desc: "סמן 12 אימונים החודש וקבל תג הוקרה.",
    },
    {
      icon: Star,
      title: "רצף שבועי",
      desc: "שמור על 3+ אימונים שבועיים ברצף.",
    },
    {
      icon: Cpu,
      title: "חכם ומהיר",
      desc: "אלגוריתם התאמה לשותפים על בסיס לוח זמנים.",
    },
  ] as const;
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-3xl border bg-white/70 p-5 backdrop-blur dark:bg-black/30">
        <div className="grid gap-3 md:grid-cols-3">
          {items.map((x, i) => {
            const Icon = x.icon;
            return (
              <motion.div
                key={x.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: EASE }}
                className="rounded-2xl border bg-white/80 p-4 dark:bg-black/30"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-300">
                    <Icon size={18} />
                  </div>
                  <div className="font-semibold">{x.title}</div>
                </div>
                <p className="mt-1 text-sm leading-6 opacity-80">{x.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// Categories
// -------------------------------------------------------------

const categories = [
  { title: "חזה", href: "/fit/exercises?muscle=chest" },
  { title: "גב", href: "/fit/exercises?muscle=back" },
  { title: "רגליים", href: "/fit/exercises?muscle=legs" },
  { title: "כתפיים", href: "/fit/exercises?muscle=shoulders" },
  { title: "יד קדמית", href: "/fit/exercises?muscle=biceps" },
  { title: "יד אחורית", href: "/fit/exercises?muscle=triceps" },
  { title: "בטן", href: "/fit/exercises?muscle=abs" },
  { title: "קרדיו", href: "/fit/exercises?type=cardio" },
] as const;

function CategoriesGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold md:text-2xl">קטגוריות מובילות</h2>
          <p className="text-sm opacity-70">קפיצה מהירה לפי שריר/סוג אימון</p>
        </div>
        <Link href="/fit/exercises" className={btn.subtle}>
          <Search size={16} /> לכל התרגילים
        </Link>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03, duration: 0.4, ease: EASE }}
            className="flex items-center justify-between rounded-2xl border bg-white/70 p-4 backdrop-blur dark:bg-black/30"
          >
            <div className="font-semibold">{c.title}</div>
            <Link
              href={c.href}
              className={btn.ghost}
              aria-label={`עבור אל ${c.title}`}
            >
              צפה <ArrowRight size={14} />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// Testimonials
// -------------------------------------------------------------

function Quote({ text, author }: { text: string; author: string }) {
  return (
    <div className="rounded-2xl border bg-white/70 p-4 backdrop-blur dark:bg-black/30">
      <p className="leading-7">“{text}”</p>
      <div className="mt-2 text-sm opacity-70">— {author}</div>
    </div>
  );
}

function Testimonials() {
  const quotes = [
    {
      text: "ה-UI הכי נוח שראיתי. מצאתי שותף לאימונים בפחות משבוע!",
      author: "שחר, תל-אביב",
    },
    {
      text: "ספריית התרגילים בעברית — זהב. חוסך לי זמן בכל אימון.",
      author: "מאי, חיפה",
    },
    {
      text: "אהבתי את האתגרים בקבוצות. זה דוחף אותי להתמיד.",
      author: "דניאל, ירושלים",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-4">
        <h2 className="text-xl font-bold md:text-2xl">מה אנשים אומרים</h2>
        <p className="text-sm opacity-70">פידבקים אמיתיים מהקהילה</p>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        {quotes.map((q, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.6, ease: EASE }}
          >
            <Quote text={q.text} author={q.author} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// FAQ
// -------------------------------------------------------------

const faqs: FAQ[] = [
  {
    q: "האם זה חינם?",
    a: "כן. הספרייה והפיצ'רים הבסיסיים חינם. פיצ'רים מתקדמים בהמשך.",
  },
  { q: "יש תמיכה ב-RTL?", a: "כן. כל הממשק מותאם לעברית, ימין-לשמאל." },
  {
    q: "איך מוצאים שותף?",
    a: "נכנסים ל׳מי סביבי׳, מאפשרים מיקום ובוחרים העדפות.",
  },
  {
    q: "אפשר לשמור אימונים?",
    a: "בטח! בונים תבנית ושומרים — הכול מקומי כברירת מחדל.",
  },
];

function FAQItem({ f }: { f: FAQ }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-2xl border bg-white/70 backdrop-blur dark:bg-black/30">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-right"
        aria-expanded={open}
      >
        <span className="font-medium">{f.q}</span>
        <ChevronDown
          className={cn("transition", open && "rotate-180")}
          size={18}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="px-4 pb-4 text-sm leading-7 opacity-80"
          >
            {f.a}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-4">
        <h2 className="text-xl font-bold md:text-2xl">שאלות נפוצות</h2>
        <p className="text-sm opacity-70">הכול במקום אחד</p>
      </header>
      <div className="grid gap-2 md:grid-cols-2">
        {faqs.map((f) => (
          <FAQItem key={f.q} f={f} />
        ))}
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// CTA
// -------------------------------------------------------------

function CTASection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-amber-100 via-white to-rose-100 p-6 dark:from-amber-500/10 dark:via-black/20 dark:to-pink-500/10 md:p-8">
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-amber-400/30 blur-3xl" />
        <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-pink-400/30 blur-3xl" />
        <div className="relative grid items-center gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-2xl font-black leading-tight">
              יאללה, מתחילים?
            </h3>
            <p className="mt-2 text-[15px] leading-7 opacity-80">
              לחץ/י על אחד הקישורים והתחל/י לבנות תנועה טובה יותר — בעצמך או יחד
              עם הקהילה.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/fit/exercises" className={btn.secondary}>
                <Dumbbell size={18} /> תרגילים
              </Link>
              <Link href="/fit/partners" className={btn.subtle}>
                <Users2 size={18} /> שותפים
              </Link>
              <Link href="/fit/groups" className={btn.ghost}>
                <HeartPulse size={18} /> קבוצות
              </Link>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="rounded-2xl border bg-white/80 p-4 backdrop-blur dark:bg-black/30">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300">
                <Check size={16} /> אין הרשמה חובה
              </div>
              <p className="mt-1 text-sm opacity-80">
                מתחילים לעבוד מיד. שמירה מקומית כברירת מחדל.
              </p>
            </div>
            <div className="rounded-2xl border bg-white/80 p-4 backdrop-blur dark:bg-black/30">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300">
                <ShieldCheck size={16} /> פרטיות קודמת לכול
              </div>
              <p className="mt-1 text-sm opacity-80">
                סנכרון לחשבון — רק אם תרצו, עם שליטה מלאה.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// MATY-FIT AI + LIVE (משתמש בקומפוננטות שהגדרנו קודם)
// -------------------------------------------------------------

function FitAiAndLiveSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-12">
      <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold md:text-2xl">
            AI + LIVE · MATY-FIT
          </h2>
          <p className="text-sm opacity-70">
            בנה תוכנית אימון חכמה בחינם + ראה שידורים חיים של מתאמנים/מאמנים.
          </p>
        </div>
        <Link href="/fit/workouts" className={btn.subtle}>
          <SparklesIcon size={16} /> מעבר למסך האימונים
        </Link>
      </header>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <FitAiBuilder />
        <FitLivePanel />
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// גשר חכם ל-MATY-DATE
// -------------------------------------------------------------

type FitDateSuggestion = {
  id: string;
  name: string;
  city: string;
  trainingStyle: string;
  matchScore: number;
  note: string;
};

type FitDateResp =
  | { ok: true; items: FitDateSuggestion[] }
  | { ok: false; error?: string; message?: string };

function FitDateBridgeSection() {
  const [items, setItems] = React.useState<FitDateSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/fit/date-bridge");
        const data: FitDateResp = await res.json();
        if (!data.ok) {
          if (!cancelled) {
            setError(data.error || data.message || "שגיאה בטעינת התאמות");
          }
        } else if (!cancelled) {
          setItems(data.items);
        }
      } catch {
        if (!cancelled) setError("לא הצלחתי להתחבר לשרת.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-12">
      <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold md:text-2xl">
            MATY-FIT 🤝 MATY-DATE
          </h2>
          <p className="text-sm opacity-70">
            התאמות חכמות של MATY-DATE שמתעדפות אנשים שאוהבים זוז. (דמו – API
            /fit/date-bridge)
          </p>
        </div>
        <Link href="/date" className={btn.secondary}>
          לעמוד MATY-DATE <ArrowRight size={16} />
        </Link>
      </header>

      <div className="rounded-3xl border bg-white/70 p-4 backdrop-blur dark:bg-black/30">
        {loading && (
          <p className="text-sm opacity-80">טוען התאמות לפי כושר ואורח חיים…</p>
        )}
        {error && (
          <p className="text-sm text-red-400">❗ {error}</p>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="text-sm opacity-80">
            כרגע זה דמו. ברגע שתחבר את MATY-DATE האמיתי — כאן תראה התאמות
            שמגיעות מה-DB.
          </p>
        )}

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {items.map((p) => (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-2xl border bg-white/80 p-3 text-sm backdrop-blur dark:bg-black/30"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-[10px] rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-700 dark:text-emerald-200">
                    התאמה {p.matchScore}%
                  </div>
                </div>
                <div className="mt-1 text-[12px] opacity-75">
                  {p.city} · {p.trainingStyle}
                </div>
                <div className="mt-1 text-[12px] opacity-80">{p.note}</div>
              </div>
              <div className="mt-2 flex justify-between text-[11px]">
                <Link
                  href={`/date/profile/${p.id}`}
                  className="text-amber-600 hover:underline"
                >
                  צפה בפרופיל
                </Link>
                <button
                  type="button"
                  className="rounded-full bg-amber-500 px-2 py-0.5 font-medium text-black hover:bg-amber-400"
                >
                  שלח היי
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] opacity-70">
          💡 רעיון: ב־API האמיתי תמשוך פרופילים מ-MATY-DATE עם שדות כמו{" "}
          <code>likesFitness</code>, <code>trainingDays</code>,{" "}
          <code>preferredPartnerGoal</code> — ותחשב ציון התאמה שגם משתמש
          בהעדפות הכושר שלך.
        </p>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// Quick Actions (mobile)
// -------------------------------------------------------------

function QuickActions() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 md:hidden">
      <div className="flex items-center gap-2 rounded-full border bg-white/90 px-3 py-2 shadow-lg backdrop-blur dark:bg-black/60">
        <button
          className="rounded-full border bg-neutral-100 p-2 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
          onClick={() => setOpen((v) => !v)}
          aria-label="עוד אפשרויות"
        >
          <ChevronRight
            className={cn("transition", open && "rotate-180")}
            size={18}
          />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="flex items-center gap-2"
            >
              <Link href="/fit/exercises" className={btn.subtle}>
                תרגילים
              </Link>
              <Link href="/fit/workouts" className={btn.subtle}>
                אימונים
              </Link>
              <Link href="/fit/partners" className={btn.subtle}>
                שותפים
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Page
// -------------------------------------------------------------

export const dynamic = "force-dynamic";

export default function FitHome() {
  return (
    <main dir="rtl" className="relative">
      {/* מתחת ל-Header הגלובלי שלך – זה ה-NAV הפנימי של MATY-FIT */}
      <FitInnerHeader />

      <Hero />
      <FeaturesGrid />
      <Showcases />
      <PartnersStrip />
      <HowItWorks />
      <Achievements />
      <CategoriesGrid />
      <Testimonials />
      <FAQSection />
      <CTASection />
      <FitAiAndLiveSection />
      <FitDateBridgeSection />
      <QuickActions />
    </main>
  );
}

