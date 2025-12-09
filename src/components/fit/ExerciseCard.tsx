// src/components/fit/ExerciseCard.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Play,
  Heart,
  HeartHandshake,
  Flame,
  BadgeInfo,
  Dumbbell,
  Trophy,
  ShieldCheck,
  Sparkles,
  Video,
  Share2,
  Layers,
} from "lucide-react";

/** ===== Types (כמו שביקשת) ===== */
type Difficulty = "" | "beginner" | "intermediate" | "advanced";
type Exercise = {
  _id: string | number;
  name: string;
  muscle?: string;
  level?: string;
  provider?: string;
  thumbnail?: string;
  images?: string[];
  equipment?: string[];
  difficulty?: Difficulty;
  category?: string;
  youtubeId?: string;
  videoUrl?: string;
  isNew?: boolean;
  isTrending?: boolean;
};

type Props = {
  item?: Exercise;
  loading?: boolean;
  onAddToWorkout?: (ex: Exercise) => void;
  onFavoriteToggle?: (ex: Exercise, next: boolean) => void;
  listMode?: boolean; // תמיכה מוצקה בגריד/רשימה
};

/** ===== Utils ===== */
function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function diffToText(d?: Difficulty, fallback?: string) {
  if (!d && fallback) {
    const t = fallback.toLowerCase();
    if (t.includes("begin")) d = "beginner";
    else if (t.includes("inter") || t.includes("medium")) d = "intermediate";
    else if (t.includes("adv") || t.includes("expert")) d = "advanced";
  }
  if (d === "beginner") return "מתחילים";
  if (d === "intermediate") return "בינוני";
  if (d === "advanced") return "מתקדם";
  return "כללי";
}

function difficultyChipClass(d?: Difficulty, fallback?: string) {
  const t = diffToText(d, fallback);
  if (t === "מתחילים")
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/20";
  if (t === "בינוני")
    return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/20";
  if (t === "מתקדם")
    return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:border-rose-500/20";
  return "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-white/10 dark:text-white/80 dark:border-white/10";
}

function providerChip(provider?: string) {
  const p = (provider || "").toLowerCase();
  if (!p)
    return {
      label: "מקור לא ידוע",
      cls: "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-white/10 dark:text-white/80 dark:border-white/10",
    };
  if (p.includes("wger"))
    return {
      label: "WGER",
      cls: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-200 dark:border-indigo-500/20",
    };
  if (p.includes("exercisedb"))
    return {
      label: "ExerciseDB",
      cls: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:border-sky-500/20",
    };
  if (p.includes("nin"))
    return {
      label: "API Ninjas",
      cls: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-500/10 dark:text-fuchsia-200 dark:border-fuchsia-500/20",
    };
  if (p.includes("demo"))
    return {
      label: "Demo",
      cls: "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-white/10 dark:text-white/80 dark:border-white/10",
    };
  return {
    label: provider!,
    cls: "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-white/10 dark:text-white/80 dark:border-white/10",
  };
}

function safeLocalGet<T>(k: string, fallback: T): T {
  try {
    const r = localStorage.getItem(k);
    return r ? (JSON.parse(r) as T) : fallback;
  } catch {
    return fallback;
  }
}
function safeLocalSet(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

/** ===== Skeleton ===== */
function CardSkeleton({ list = false }: { list?: boolean }) {
  return (
    <article
      className={cn(
        "rounded-2xl border bg-white/70 dark:bg-black/30 backdrop-blur p-3 animate-pulse",
        list && "flex gap-3",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border bg-white/60 dark:bg-white/10",
          list ? "w-[220px] shrink-0 aspect-video" : "h-40",
        )}
      />
      <div className={cn(list ? "min-w-0 flex-1" : "mt-3")}>
        <div className="mt-2 h-4 w-2/3 rounded bg-neutral-200 dark:bg-white/10" />
        <div className="mt-2 h-3 w-1/2 rounded bg-neutral-200 dark:bg-white/10" />
        <div className="mt-4 flex gap-2">
          <div className="h-8 w-24 rounded bg-neutral-200 dark:bg-white/10" />
          <div className="h-8 w-28 rounded bg-neutral-200 dark:bg-white/10" />
        </div>
      </div>
    </article>
  );
}

/** ===== Component ===== */
export default function ExerciseCard({
  item,
  loading,
  onAddToWorkout,
  onFavoriteToggle,
  listMode = false,
}: Props) {
  const router = useRouter();

  // ----- skeleton -----
  if (loading || !item) return <CardSkeleton list={listMode} />;

  // ----- base -----
  const href = `/fit/exercises/${encodeURIComponent(item._id)}`;
  const onCardClick = () => router.push(href);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  // ----- media & posters -----
  const youtubeThumb = item.youtubeId
    ? `https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`
    : undefined;

  const poster = React.useMemo(() => {
    return (
      item.thumbnail ||
      item.images?.find((u) => !!u) ||
      youtubeThumb ||
      "/assets/images/fit/exercise-placeholder.jpg"
    );
  }, [item.thumbnail, item.images, youtubeThumb]);

  const hasVideo = Boolean(item.youtubeId || item.videoUrl);
  const videoHref = item.youtubeId
    ? `https://www.youtube.com/watch?v=${item.youtubeId}`
    : item.videoUrl || "";

  // ----- difficulty / provider -----
  const diffText = diffToText(item.difficulty, item.level);
  const providerMeta = providerChip(item.provider);

  // ----- favorites (לוקאלי) -----
  const favKey = "fit:favs";
  const [favorite, setFavorite] = React.useState(false);
  React.useEffect(() => {
    const current = safeLocalGet<string[]>(favKey, []);
    const sig = String(item._id);
    setFavorite(current.includes(sig));
  }, [item._id]);

  function toggleFav(next?: boolean) {
    const sig = String(item._id);
    const current = safeLocalGet<string[]>(favKey, []);
    const will = typeof next === "boolean" ? next : !current.includes(sig);
    const updated = will
      ? Array.from(new Set([...current, sig]))
      : current.filter((x) => x !== sig);
    safeLocalSet(favKey, updated);
    setFavorite(will);
    onFavoriteToggle?.(item, will);
    window.dispatchEvent(
      new CustomEvent("mm:toast", {
        detail: {
          type: will ? "success" : "info",
          text: will ? "נשמר למועדפים ❤️" : "הוסר מהמועדפים",
        },
      }),
    );
  }

  // ----- actions -----
  function handleAdd(e: React.MouseEvent) {
    stop(e);
    if (onAddToWorkout) onAddToWorkout(item);
    else {
      window.dispatchEvent(
        new CustomEvent("fit:add_to_workout", { detail: { item } }),
      );
    }
    window.dispatchEvent(
      new CustomEvent("mm:toast", {
        detail: { type: "success", text: "נוסף לאימון ✨" },
      }),
    );
  }

  async function handleShare(e: React.MouseEvent) {
    stop(e);
    const url = new URL(window.location.origin + href);
    url.searchParams.set("src", "card");
    try {
      await navigator.clipboard.writeText(url.toString());
      window.dispatchEvent(
        new CustomEvent("mm:toast", {
          detail: { type: "success", text: "קישור הועתק 🎉" },
        }),
      );
    } catch {
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    }
  }

  // ----- thumbnails (אם יש גלריה) -----
  const thumbs = (item.images || []).slice(0, 3);

  return (
    <article
      dir="rtl"
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onCardClick()}
      aria-label={`פתח תרגיל: ${item.name}`}
      className={cn(
        "group rounded-2xl border bg-white/70 dark:bg-black/30 backdrop-blur p-3",
        "hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 transition",
        listMode && "flex gap-3",
      )}
    >
      {/* ===== מדיה ===== */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border bg-white/60 dark:bg-white/10",
          listMode ? "w-[220px] shrink-0 aspect-video" : "h-40",
        )}
      >
        {/* תמונה ראשית (unoptimized כדי לא ליפול על דומיינים חיצוניים) */}
        <Image
          src={poster}
          alt={item.name}
          fill
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          unoptimized
          onError={(e) => {
            try {
              (e.currentTarget as any).src =
                "/assets/images/fit/exercise-placeholder.jpg";
            } catch {}
          }}
        />

        {/* שכבת אפקט */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />

        {/* כפתור Play על המדיה */}
        {hasVideo && (
          <a
            href={videoHref}
            target="_blank"
            rel="noreferrer"
            onClick={stop}
            aria-label="פתח וידאו"
            className="pointer-events-auto absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition"
          >
            <span className="rounded-full border bg-black/60 text-white px-3 py-1.5 text-sm flex items-center gap-2 backdrop-blur">
              <Play size={16} /> צפייה בווידאו
            </span>
          </a>
        )}

        {/* באדג'ים */}
        <div className="absolute top-2 right-2 flex gap-1">
          {item.isNew && (
            <span className="rounded-full border px-2 py-0.5 text-[11px] bg-white/85 dark:bg-black/40 flex items-center gap-1">
              <Sparkles size={12} /> חדש
            </span>
          )}
          {item.isTrending && (
            <span className="rounded-full border px-2 py-0.5 text-[11px] bg-white/85 dark:bg-black/40 flex items-center gap-1">
              <Flame size={12} /> פופולרי
            </span>
          )}
        </div>
      </div>

      {/* ===== גוף הכרטיס ===== */}
      <div className={cn(listMode ? "min-w-0 flex-1" : "mt-3")}>
        {/* כותרת */}
        <div className="mt-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold leading-6 line-clamp-2">
              {item.name}
            </h3>
            <p className="text-xs opacity-70 mt-0.5">
              {item.muscle ? `שריר: ${item.muscle}` : "תרגיל"}
              {" • "}
              {diffText}
              {item.category ? ` • ${item.category}` : ""}
            </p>
          </div>
          <ArrowRight
            size={16}
            className="opacity-40 group-hover:translate-x-0.5 transition shrink-0"
            aria-hidden
          />
        </div>

        {/* תגיות/מטא */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {/* ספק */}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
              providerMeta.cls,
            )}
            title={`מקור: ${providerMeta.label}`}
          >
            <BadgeInfo size={12} />
            {providerMeta.label}
          </span>

          {/* רמה */}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
              difficultyChipClass(item.difficulty, item.level),
            )}
            title={`רמה: ${diffText}`}
          >
            <Trophy size={12} />
            {diffText}
          </span>

          {/* ציוד */}
          {item.equipment?.slice(0, 2).map((eq) => (
            <span
              key={eq}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] bg-white/70 dark:bg-white/10 border-neutral-200 dark:border-white/10"
              title={`ציוד: ${eq}`}
            >
              <Dumbbell size={12} /> {eq}
            </span>
          ))}

          {/* אינדיקציה לוידאו */}
          {hasVideo && (
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] bg-white/70 dark:bg-white/10 border-neutral-200 dark:border-white/10"
              title="כולל וידאו"
            >
              <Video size={12} /> וידאו
            </span>
          )}
        </div>

        {/* שורת תמונות נוספות (אם קיימות) */}
        {!!thumbs.length && (
          <div className="mt-2 flex items-center gap-1.5">
            <Layers size={14} className="opacity-60" />
            <div className="flex items-center gap-1.5 overflow-hidden">
              {thumbs.map((u, i) => (
                <div
                  key={u + i}
                  className="relative h-8 w-12 overflow-hidden rounded-md border bg-white/60 dark:bg-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* תמונות נוספות לא חוסמות על דומיינים – unoptimized */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* פעולות */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70"
            aria-label="פתח דף התרגיל"
          >
            פתיחה
          </Link>

          {item.provider && (
            <Link
              href={`/fit/exercises/${encodeURIComponent(item._id)}?provider=${encodeURIComponent(
                item.provider,
              )}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 border border-neutral-200 dark:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/50"
              aria-label={`פתח ממקור: ${providerMeta.label}`}
            >
              מקור: {providerMeta.label}
            </Link>
          )}

          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-500/10 border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
            aria-label="הוסף לאימון"
          >
            <HeartHandshake size={16} /> הוסף לאימון
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleFav();
              e.stopPropagation();
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium border focus:outline-none focus-visible:ring-2",
              favorite
                ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500/70"
                : "bg-white/70 dark:bg-white/10 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-neutral-200 dark:border-white/10 focus-visible:ring-rose-400/50",
            )}
            aria-pressed={favorite}
            aria-label={favorite ? "הסר ממועדפים" : "הוסף למועדפים"}
            title={favorite ? "הסר ממועדפים" : "הוסף למועדפים"}
          >
            <Heart size={16} className={favorite ? "fill-current" : ""} />
            {favorite ? "מועדף" : "מועדפים"}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium bg-white/70 dark:bg-white/10 hover:bg-amber-50 dark:hover:bg-amber-500/10 border border-neutral-200 dark:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
            aria-label="שיתוף קישור"
            title="העתקת קישור"
          >
            <Share2 size={16} /> שתף
          </button>
        </div>

        {/* תחתית קטנה */}
        <div className="mt-3 flex items-center justify-between text-[11px] opacity-70">
          <div className="flex items-center gap-2">
            <ShieldCheck size={12} />
            <span>פרטיות בידיים שלך</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={12} />
            <span>UI מהיר ו־RTL מלא</span>
          </div>
        </div>
      </div>
    </article>
  );
}
