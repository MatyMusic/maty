"use client";

/**
 * src/components/maty-date/MatchCard.tsx
 *
 * גרסת NAUPR · חוויית דייטינג חכמה:
 * - אדמין עוקף מנויים (PLUS/PRO/VIP) – הכל פתוח.
 * - כפתור צ׳אט עם צבע ברור (ירוק) וטקסט לבן.
 * - כפתורי לייק / סופר־לייק / שמירה עם אנימציות ופידבק ויזואלי.
 * - קרוסלת תמונות, ציון התאמה, תגיות, הודעת קול, התאמה הדדית (Mutual Match · AI).
 * - תמיכה מלאה ב־RTL + רספונסיבי.
 * - שדרוג חדש: פירוק ציון התאמה לפרופיל/מוזיקה/מרחק + כפתור הסבר AI.
 */

import { motion, useMotionValue, useReducedMotion } from "framer-motion";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flag,
  Heart,
  Info,
  MessageCircle,
  Music2,
  Pause,
  Play,
  ShieldCheck,
  Star,
  Video as VideoIcon,
  Zap,
} from "lucide-react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";

/* ========= Types ========= */
export type Tier = "free" | "plus" | "pro" | "vip";
export type SubStatus = "active" | "inactive";
type Direction =
  | "orthodox"
  | "haredi"
  | "chasidic"
  | "modern"
  | "conservative"
  | "reform"
  | "reconstructionist"
  | "secular";

/**
 * מידע אלגוריתם משודרג (V2) – אופציונלי, לא שובר קוד קיים
 * בד"כ תגיע מתוצאת computeMatchV2 בצד שרת.
 */
export type MatchMeta = {
  finalScore?: number; // ציון סופי (0–100) – אם לא יגיע, נשתמש ב-item.score
  profileScore?: number; // ניקוד התאמת פרופיל (גיל, דתיות, שפה וכו')
  musicScore?: number; // ניקוד התאמת מוזיקה
  distanceScore?: number; // 0–100 – כמה טוב המרחק (ללא ענישה)
};

export type MatchItem = {
  _id?: string;
  userId: string;
  displayName: string;
  age?: number;
  city?: string;
  country?: string;
  direction?: Direction | string;
  goals?: "serious" | "marriage" | "friendship" | string;
  photos?: string[];
  avatarUrl?: string;
  about_me?: string;
  verified?: boolean;
  online?: boolean;
  subscription?: { status: SubStatus; tier: Tier; expiresAt?: string };
  score?: number;
  updatedAt?: number | string;
  lastActiveAt?: string | null;
  distanceKm?: number | null;
  trust?: number | null; // 0..100
  audioGreetingUrl?: string | null;

  // נתוני AI / שרת
  mutualMatch?: boolean;
  initialLiked?: boolean;
  initialWinked?: boolean;
  initialSuperLiked?: boolean;
  initialSaved?: boolean;
};

/* ========= Admin detection ========= */
function readIsAdminQuick(): boolean {
  try {
    if ((window as any).__MM_IS_ADMIN__ === true) return true;

    const html = document.documentElement;
    if (html?.dataset?.admin === "1") return true;

    if (localStorage.getItem("mm:admin") === "1") return true;

    const role = (
      document.cookie.match(/(?:^|;)\s*mm_role=([^;]+)/)?.[1] || ""
    ).toLowerCase();
    if (role === "admin" || role === "superadmin") return true;

    if (process.env.NEXT_PUBLIC_ALLOW_UNSAFE_ADMIN === "1") return true;
  } catch {}
  return false;
}

function useIsAdmin(override?: boolean) {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof override === "boolean") return override;
    if (typeof window === "undefined") return false; // SSR safety
    return readIsAdminQuick();
  });

  useEffect(() => {
    if (typeof override === "boolean") {
      setIsAdmin(override);
      return;
    }
    setIsAdmin(readIsAdminQuick());
  }, [override]);

  return isAdmin;
}

/* ========= Helpers ========= */
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const fmtKm = (v?: number | null) =>
  typeof v === "number" && isFinite(v)
    ? `${v.toFixed(v < 10 ? 1 : 0)} ק"מ`
    : "";

const twoLineClamp: React.CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
const threeLineClamp: React.CSSProperties = {
  ...twoLineClamp,
  WebkitLineClamp: 3,
};

const tierLabel = (t: Tier) =>
  t === "vip" ? "VIP" : t === "pro" ? "PRO" : t === "plus" ? "PLUS" : "FREE";

const fallbackInitial = (name: string) =>
  (name?.trim?.() || "?").charAt(0).toUpperCase();

const onlineDot = (online?: boolean) =>
  online
    ? "bg-emerald-500 ring-emerald-300/40"
    : "bg-neutral-400 ring-transparent";

function tierClass(tier: Tier, active: boolean) {
  const base =
    "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide border whitespace-nowrap select-none";
  const off = "opacity-60";
  switch (tier) {
    case "vip":
      return `${base} border-fuchsia-500 bg-fuchsia-50/70 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 ${
        active ? "" : off
      }`;
    case "pro":
      return `${base} border-violet-500 bg-violet-50/70 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 ${
        active ? "" : off
      }`;
    case "plus":
      return `${base} border-emerald-500 bg-emerald-50/70 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 ${
        active ? "" : off
      }`;
    default:
      return `${base} border-neutral-300 bg-white/70 text-neutral-700 dark:bg-neutral-700/20 dark:text-neutral-300 ${
        active ? "" : off
      }`;
  }
}

function gradientByTier(tier: Tier, active: boolean) {
  if (!active)
    return "from-white/90 to-white/70 dark:from-neutral-900/70 dark:to-neutral-900/50";
  if (tier === "vip")
    return "from-fuchsia-50/70 to-violet-50/70 dark:from-violet-900/20 dark:to-fuchsia-900/10";
  if (tier === "pro")
    return "from-violet-50/70 to-indigo-50/70 dark:from-violet-900/20 dark:to-indigo-900/10";
  if (tier === "plus")
    return "from-emerald-50/70 to-teal-50/70 dark:from-emerald-900/10 dark:to-teal-900/10";
  return "from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900";
}

/* ========= CSS פנימי לכפתורים (פעם אחת) ========= */
function useMatchCardStylesOnce() {
  useEffect(() => {
    if ((window as any).__MATY_MATCHCARD_STYLES__) return;
    const style = document.createElement("style");
    style.innerHTML = `
      .mm-btn-like-active {
        box-shadow: 0 0 0 1px rgba(244,114,182,.55), 0 10px 25px rgba(236,72,153,.35);
        animation: mm-like-pop .28s ease-out;
      }
      .mm-btn-wink-active {
        box-shadow: 0 0 0 1px rgba(96,165,250,.45);
        animation: mm-wink-pulse .45s ease-out;
      }
      .mm-btn-super-active {
        box-shadow: 0 0 0 1px rgba(244,114,182,.65);
        animation: mm-super-flash .4s ease-out;
      }
      .mm-btn-saved-active {
        box-shadow: 0 0 0 1px rgba(250,204,21,.6);
        animation: mm-saved-glow 1.2s ease-in-out infinite alternate;
      }

      @keyframes mm-like-pop {
        0%   { transform: scale(.9); }
        60%  { transform: scale(1.06); }
        100% { transform: scale(1); }
      }
      @keyframes mm-wink-pulse {
        0%   { transform: translateY(0); filter: brightness(1); }
        50%  { transform: translateY(-1px); filter: brightness(1.06); }
        100% { transform: translateY(0); filter: brightness(1); }
      }
      @keyframes mm-super-flash {
        0%   { filter: brightness(1); }
        40%  { filter: brightness(1.25); }
        100% { filter: brightness(1.02); }
      }
      @keyframes mm-saved-glow {
        0%   { box-shadow: 0 0 0 1px rgba(250,204,21,.5); }
        100% { box-shadow: 0 0 12px 0 rgba(250,204,21,.9); }
      }
    `;
    document.head.appendChild(style);
    (window as any).__MATY_MATCHCARD_STYLES__ = true;
  }, []);
}

/* ========= Score Ring ========= */
function ScoreRing({
  score = 0,
  size = 40,
}: {
  score?: number;
  size?: number;
}) {
  const s = clamp(score, 0, 100);
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const dash = (s / 100) * c;

  return (
    <svg width={size} height={size} className="shrink-0" aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth="6"
        className="fill-none stroke-neutral-200 dark:stroke-neutral-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth="6"
        strokeDasharray={`${dash} ${c - dash}`}
        className="fill-none stroke-amber-500"
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="text-[10px] fill-amber-700 dark:fill-amber-300 font-bold"
      >
        {Math.round(s)}
      </text>
    </svg>
  );
}

function Pill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full border border-black/10 dark:border-white/10 text-[11px] bg-white/70 dark:bg-neutral-900/70 ${className}`}
    >
      {children}
    </span>
  );
}

/* ========= Breakdown Bar ========= */

function FactorRow({
  label,
  value,
  hint,
}: {
  label: string;
  value?: number;
  hint?: string;
}) {
  if (typeof value !== "number") return null;
  const v = clamp(value, 0, 100);

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-[11px]">
        <span className="font-medium">{label}</span>
        <span>{v}</span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-500 dark:bg-amber-400"
          style={{ width: `${v}%` }}
        />
      </div>
      {hint && <div className="text-[10px] text-neutral-500">{hint}</div>}
    </div>
  );
}

/* ========= Carousel ========= */
function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const has = images && images.length > 0;

  useEffect(() => {
    setIdx(0);
  }, [images?.[0]]);

  if (!has) return null;

  const img = images[idx];
  const next = () => setIdx((p) => (p + 1) % images.length);
  const prev = () => setIdx((p) => (p - 1 + images.length) % images.length);

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-neutral-100 dark:bg-neutral-800">
      <img
        src={img}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover"
      />

      {images.length > 1 && (
        <>
          <button
            aria-label="תמונה קודמת"
            onClick={prev}
            className="absolute top-1/2 -translate-y-1/2 right-2 h-8 w-8 grid place-items-center rounded-full bg-white/80 dark:bg-neutral-900/80 border border-black/10 dark:border-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            aria-label="תמונה הבאה"
            onClick={next}
            className="absolute top-1/2 -translate-y-1/2 left-2 h-8 w-8 grid place-items-center rounded-full bg-white/80 dark:bg-neutral-900/80 border border-black/10 dark:border-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 px-2">
            {images.slice(0, 6).map((u, i) => (
              <button
                key={u + i}
                onClick={() => setIdx(i)}
                aria-label={`תמונה ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-5 bg-white" : "w-2 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ========= Audio Greeting ========= */
function AudioGreeting({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = new Audio(url);
    a.preload = "none";
    audioRef.current = a;
    return () => {
      try {
        a.pause();
      } catch {}
      audioRef.current = null;
    };
  }, [url]);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    try {
      if (!playing) {
        await a.play();
        setPlaying(true);
        a.onended = () => setPlaying(false);
      } else {
        a.pause();
        setPlaying(false);
      }
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 text-[12px]"
      title="האזנה להודעת קול קצרה"
    >
      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      <span>הקדמה קולית</span>
      <Music2 className="h-4 w-4 opacity-70" />
    </button>
  );
}

/* ========= Swipe Logic ========= */
function useSwipe(onLike?: () => void, onSkip?: () => void) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const threshold = 120;

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    downRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!downRef.current) return;
    x.set(e.clientX - downRef.current.x);
    y.set(e.clientY - downRef.current.y);
  };

  const onPointerUp = () => {
    const dx = x.get();
    if (dx > threshold && onLike) onLike();
    else if (dx < -threshold && onSkip) onSkip();
    x.set(0);
    y.set(0);
    downRef.current = null;
  };

  return { x, y, onPointerDown, onPointerMove, onPointerUp } as const;
}

/* ========= Component ========= */
export default function MatchCard({
  item,
  matchMeta,
  onLike,
  onWink,
  onSkip,
  onChat,
  onVideo,
  onUpgrade,
  onSuperLike,
  onSave,
  onReport,
  onBlock,
  onExplainMatch,
  isAdminOverride,
}: {
  item: MatchItem;
  matchMeta?: MatchMeta; // 🔁 מידע אלגוריתם משודרג (אופציונלי)
  onLike?: (userId: string) => void;
  onWink?: (userId: string) => void;
  onSkip?: (userId: string) => void;
  onChat?: (userId: string) => void;
  onVideo?: (userId: string) => void;
  onUpgrade?: (userId: string, targetTier: Tier) => void;
  onSuperLike?: (userId: string) => void;
  onSave?: (userId: string) => void;
  onReport?: (userId: string) => void;
  onBlock?: (userId: string) => void;
  onExplainMatch?: (userId: string) => void; // 🔁 כפתור הסבר AI
  isAdminOverride?: boolean;
}) {
  useMatchCardStylesOnce();
  const isAdmin = useIsAdmin(isAdminOverride);
  const prefersReducedMotion = useReducedMotion();

  const {
    userId,
    displayName,
    city,
    country,
    age,
    photos,
    avatarUrl,
    online,
    verified,
    about_me,
    subscription,
    score,
    lastActiveAt,
    distanceKm,
    trust,
    audioGreetingUrl,
    mutualMatch,
    initialLiked,
    initialWinked,
    initialSuperLiked,
    initialSaved,
    direction,
    goals,
  } = item;

  const active = subscription?.status === "active";
  const tier = subscription?.tier || "free";

  const canChat = isAdmin || (active && tier !== "free");
  const canVideo = isAdmin || (active && (tier === "pro" || tier === "vip"));
  const canSuper = isAdmin || (active && tier === "vip");

  const needsChatUpgrade = !canChat;
  const needsVideoUpgrade = !canVideo;

  const photosArr = (
    photos && photos.length > 0 ? photos : [avatarUrl].filter(Boolean)
  ) as string[];

  const [liked, setLiked] = useState<boolean>(!!initialLiked);
  const [winked, setWinked] = useState<boolean>(!!initialWinked);
  const [superLiked, setSuperLiked] = useState<boolean>(!!initialSuperLiked);
  const [saved, setSaved] = useState<boolean>(!!initialSaved);

  useEffect(() => setLiked(!!initialLiked), [initialLiked, userId]);
  useEffect(() => setWinked(!!initialWinked), [initialWinked, userId]);
  useEffect(
    () => setSuperLiked(!!initialSuperLiked),
    [initialSuperLiked, userId],
  );
  useEffect(() => setSaved(!!initialSaved), [initialSaved, userId]);

  // קיצורי מקלדת
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "ArrowRight") {
        setLiked(true);
        onLike?.(userId);
      } else if (e.key === "ArrowLeft") {
        onSkip?.(userId);
      } else if (e.key.toLowerCase() === "c") {
        (canChat ? onChat : onUpgrade)?.(userId, "plus");
      } else if (e.key.toLowerCase() === "v") {
        (canVideo ? onVideo : onUpgrade)?.(userId, "pro");
      } else if (e.key.toLowerCase() === "s") {
        if (canSuper) {
          setSuperLiked(true);
          onSuperLike?.(userId);
        } else {
          onUpgrade?.(userId, "vip");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    userId,
    onLike,
    onSkip,
    onChat,
    onVideo,
    onUpgrade,
    onSuperLike,
    canChat,
    canVideo,
    canSuper,
  ]);

  // Swipe
  const swipe = useSwipe(
    () => {
      setLiked(true);
      onLike?.(userId);
    },
    () => onSkip?.(userId),
  );

  const btnBase =
    "inline-flex items-center justify-center gap-1.5 h-9 rounded-xl px-2.5 sm:px-3 whitespace-nowrap overflow-hidden text-ellipsis leading-none text-[12px] sm:text-[13px] select-none";

  const headerRight = (
    <div className="flex items-center gap-1 flex-shrink-0">
      {typeof trust === "number" && trust >= 70 && (
        <Pill className="border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-500/10">
          <ShieldCheck className="h-3.5 w-3.5 inline me-1" /> אמינות{" "}
          {Math.round(trust)}%
        </Pill>
      )}
      {verified && (
        <span
          title="פרופיל מאומת"
          className="text-[10px] rounded-full px-2 py-0.5 border border-sky-500 bg-sky-50/70 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 whitespace-nowrap"
        >
          ✓ מאומת/ת
        </span>
      )}
      <span className={tierClass(tier, active)}>{tierLabel(tier)}</span>
      {isAdmin && (
        <span
          title="Admin bypass"
          className="text-[10px] rounded-full px-2 py-0.5 border border-amber-500 bg-amber-50/70 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 whitespace-nowrap"
        >
          ⭐ Admin
        </span>
      )}
    </div>
  );

  const headerLeft = (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className={`h-2.5 w-2.5 rounded-full ring-2 ${onlineDot(online)}`}
        title={online ? "מחובר/ת" : "לא מחובר/ת"}
      />
      <div className="text-xs opacity-70 truncate min-w-0">
        {age ? `${age} · ` : ""}
        {[city, country].filter(Boolean).join(", ")}
        {distanceKm ? ` · ${fmtKm(distanceKm)}` : ""}
      </div>
    </div>
  );

  const upgradeRibbon = !isAdmin && (needsChatUpgrade || needsVideoUpgrade) && (
    <div className="absolute top-2 right-2 z-10">
      <button
        type="button"
        onClick={() => onUpgrade?.(userId, needsVideoUpgrade ? "pro" : "plus")}
        className={`${btnBase} bg-gradient-to-r from-pink-600 to-violet-600 text-white shadow-sm`}
        title="שדרוג מנוי"
      >
        <Zap className="h-4 w-4" /> שדרוג
      </button>
    </div>
  );

  const fallbackBlock = (
    <div className="aspect-[4/3] rounded-xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-violet-200 to-fuchsia-200 dark:from-violet-800 dark:to-fuchsia-800 grid place-items-center">
      <div className="h-16 w-16 rounded-2xl bg-white/90 dark:bg-neutral-900/80 grid place-items-center text-2xl font-extrabold text-neutral-900 dark:text-white">
        {fallbackInitial(displayName)}
      </div>
    </div>
  );

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    if (next) onLike?.(userId);
  };

  const handleWink = () => {
    const next = !winked;
    setWinked(next);
    if (next) onWink?.(userId);
  };

  const handleSuperLike = () => {
    if (!canSuper) {
      onUpgrade?.(userId, "vip");
      return;
    }
    const next = !superLiked;
    setSuperLiked(next);
    if (next) onSuperLike?.(userId);
  };

  const handleSave = () => {
    const next = !saved;
    setSaved(next);
    onSave?.(userId);
  };

  const finalScore =
    typeof matchMeta?.finalScore === "number"
      ? matchMeta.finalScore
      : typeof score === "number"
        ? score
        : undefined;

  const hasBreakdown =
    matchMeta &&
    (typeof matchMeta.profileScore === "number" ||
      typeof matchMeta.musicScore === "number" ||
      typeof matchMeta.distanceScore === "number");

  return (
    <motion.article
      dir="rtl"
      style={{ x: swipe.x, y: swipe.y }}
      onPointerDown={swipe.onPointerDown}
      onPointerMove={swipe.onPointerMove}
      onPointerUp={swipe.onPointerUp}
      className={[
        "group relative overflow-hidden rounded-2xl border shadow-sm text-right select-none",
        "border-black/10 dark:border-white/10",
        `bg-gradient-to-br ${gradientByTier(tier, active)}`,
      ].join(" ")}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
      aria-label={`פרופיל: ${displayName}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pe-12">
        {headerLeft}
        {headerRight}
      </div>

      {/* Media */}
      <div className="mt-3 mx-3 relative">
        {photosArr.length > 0 ? (
          <ImageCarousel images={photosArr} alt={displayName} />
        ) : (
          fallbackBlock
        )}
        {upgradeRibbon}
      </div>

      {/* Name + score + AI mutual */}
      <div className="px-3 pt-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold truncate" title={displayName}>
              {displayName}
            </h3>
            {mutualMatch && (
              <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-pink-50/80 dark:bg-pink-900/30 px-2 py-0.5 text-[11px] text-pink-700 dark:text-pink-200 border border-pink-200/70 dark:border-pink-500/40">
                <Heart className="h-3.5 w-3.5 fill-pink-500 text-pink-50" />
                <span>התאמה הדדית · AI</span>
              </div>
            )}
          </div>

          {typeof finalScore === "number" && (
            <div
              className="flex flex-col items-center gap-0.5"
              title="ציון התאמה (אלגוריתם)"
            >
              <ScoreRing score={clamp(finalScore, 0, 100)} />
              <span className="text-[10px] text-neutral-500">ציון התאמה</span>
            </div>
          )}
        </div>

        {about_me && (
          <p className="mt-1 text-xs opacity-80" style={threeLineClamp}>
            {about_me}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] opacity-80">
          {direction && <Pill>{String(direction)}</Pill>}
          {goals && (
            <Pill className="border-amber-300/70 text-amber-700 dark:text-amber-300">
              מטרה: {String(goals)}
            </Pill>
          )}
          {lastActiveAt && (
            <Pill
              title="פעילות אחרונה"
              className="border-sky-300/70 text-sky-700 dark:text-sky-300"
            >
              🕒 {new Date(lastActiveAt).toLocaleDateString("he-IL")}
            </Pill>
          )}
        </div>

        {audioGreetingUrl && (
          <div className="mt-2">
            <AudioGreeting url={audioGreetingUrl} />
          </div>
        )}

        {/* Breakdown חכם – חדש */}
        {hasBreakdown && (
          <div className="mt-3 rounded-xl border border-amber-100/80 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-900/10 px-3 py-2.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-100">
                אלגוריתם התאמה · פירוק ציון
              </span>
              {onExplainMatch && (
                <button
                  type="button"
                  onClick={() => onExplainMatch?.(userId)}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  תסביר לי למה זו התאמה טובה
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
              <FactorRow
                label="פרופיל"
                value={matchMeta?.profileScore}
                hint="גיל, כיוון דתי, שפה, מיקום ועוד"
              />
              <FactorRow
                label="מוזיקה"
                value={matchMeta?.musicScore}
                hint="ז׳אנרים ואמנים משותפים"
              />
              <FactorRow
                label="מרחק"
                value={matchMeta?.distanceScore}
                hint="כמה המרחק נוח למפגש"
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {/* לייק */}
          <button
            type="button"
            onClick={handleLike}
            aria-pressed={liked}
            className={[
              btnBase,
              "border border-pink-300/60 bg-pink-50/70 text-pink-700 hover:bg-pink-100 dark:bg-pink-500/10 dark:text-pink-300",
              liked ? "mm-btn-like-active" : "",
            ].join(" ")}
            title="לייק"
          >
            <Heart
              className={`h-4 w-4 ${liked ? "fill-pink-500 text-pink-50" : ""}`}
            />
            {liked ? "נשלח לייק" : "לייק"}
          </button>

          {/* קריצה */}
          <button
            type="button"
            onClick={handleWink}
            aria-pressed={winked}
            className={[
              btnBase,
              "border bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800",
              winked ? "mm-btn-wink-active" : "",
            ].join(" ")}
            title="קריצה"
          >
            <span className="text-base leading-none">😉</span>
            {winked ? "נשלחה קריצה" : "קריצה"}
          </button>

          {/* סופר לייק */}
          <button
            type="button"
            onClick={handleSuperLike}
            aria-pressed={superLiked}
            className={[
              btnBase,
              canSuper
                ? "border border-fuchsia-300/70 bg-fuchsia-50/70 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300"
                : "border bg-neutral-200/60 dark:bg-neutral-800/60 text-neutral-600",
              superLiked && canSuper ? "mm-btn-super-active" : "",
            ].join(" ")}
            title={canSuper ? "סופר-לייק (VIP)" : "סופר-לייק זמין במנוי VIP"}
          >
            <Crown className="h-4 w-4" />
            {superLiked && canSuper ? "סופר־לייק נשלח" : "סופר־לייק"}
          </button>
        </div>

        <div className="flex gap-1.5">
          {/* צ'אט – ✅ צבע חדש ברור */}
          <button
            type="button"
            onClick={() =>
              canChat ? onChat?.(userId) : onUpgrade?.(userId, "plus")
            }
            className={
              canChat
                ? `${btnBase} bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-white`
                : `${btnBase} border bg-neutral-200/60 dark:bg-neutral-800/60 text-neutral-600`
            }
            title={canChat ? "צ'אט" : "צ'אט זמין למנויי PLUS ומעלה"}
          >
            <MessageCircle className="h-4 w-4" /> צ'אט
          </button>

          {/* וידאו */}
          <button
            type="button"
            onClick={() =>
              canVideo ? onVideo?.(userId) : onUpgrade?.(userId, "pro")
            }
            className={
              canVideo
                ? `${btnBase} bg-violet-600 hover:bg-violet-700 text-white shadow-sm dark:bg-violet-500 dark:hover:bg-violet-400 dark:text-white`
                : `${btnBase} border bg-neutral-200/60 dark:bg-neutral-800/60 text-neutral-600`
            }
            title={canVideo ? "וידאו חי" : "וידאו זמין למנויי PRO/VIP"}
          >
            <VideoIcon className="h-4 w-4" /> וידאו
          </button>
        </div>
      </div>

      {/* Footer utility row */}
      <div className="px-3 pb-3 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 opacity-70">
          <Info className="h-3.5 w-3.5" />
          <span>טיפ: ← דלג · → לייק · C צ׳אט · V וידאו · S סופר־לייק</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* שמור */}
          <button
            type="button"
            onClick={handleSave}
            aria-pressed={saved}
            className={[
              "h-8 px-3 rounded-full border bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10",
              saved ? "mm-btn-saved-active" : "",
            ].join(" ")}
            title="שמור פרופיל"
          >
            <Star
              className={`h-3.5 w-3.5 inline me-1 ${
                saved ? "fill-yellow-400 text-yellow-400" : ""
              }`}
            />
            {saved ? "נשמר" : "שמור"}
          </button>

          {/* דווח */}
          <button
            type="button"
            onClick={() => onReport?.(userId)}
            className="h-8 px-3 rounded-full border bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10"
            title="דווח"
          >
            <Flag className="h-3.5 w-3.5 inline me-1" /> דווח
          </button>

          {/* חסום */}
          <button
            type="button"
            onClick={() => onBlock?.(userId)}
            className="h-8 px-3 rounded-full border bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10"
            title="חסימה"
          >
            <Ban className="h-3.5 w-3.5 inline me-1" /> חסום/י
          </button>
        </div>
      </div>

      {/* Skip (X) */}
      <button
        type="button"
        onClick={() => onSkip?.(userId)}
        className="absolute top-2 left-2 z-20 h-8 w-8 rounded-full grid place-items-center bg-white/85 dark:bg-neutral-900/85 border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800"
        title="דלג/י"
      >
        ✕
      </button>
    </motion.article>
  );
}
