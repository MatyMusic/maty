// src app/(date)/date/fit-matches/page.tsx
"use client";

import * as React from "react";
import {
  Users2,
  Dumbbell,
  MapPin,
  HeartPulse,
  Activity,
  Loader2,
  Sparkles,
  ChevronRight,
} from "lucide-react";

type TrainDay = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
type TrainStyle =
  | "gym"
  | "home"
  | "outdoor"
  | "crossfit"
  | "run"
  | "combat"
  | "yoga";
type Goal = "fat_loss" | "muscle" | "performance" | "health" | "rehab";

type MatchItem = {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  locationArea?: string;
  score: number;
  reasons: string[];
  common: {
    days: TrainDay[];
    styles: TrainStyle[];
    goals: Goal[];
    muscles: string[];
  };
};

type ApiResp = {
  ok: boolean;
  total: number;
  items: MatchItem[];
  error?: string;
  message?: string;
};

const DAY_LABEL: Record<TrainDay, string> = {
  sun: "א'",
  mon: "ב'",
  tue: "ג'",
  wed: "ד'",
  thu: "ה'",
  fri: "ו'",
  sat: "שבת",
};

const STYLE_LABEL: Record<TrainStyle, string> = {
  gym: "חדר כושר",
  home: "בית",
  outdoor: "חוץ",
  crossfit: "קרוספיט",
  run: "ריצה",
  combat: "קרב מגע / אגרוף",
  yoga: "יוגה",
};

const GOAL_LABEL: Record<Goal, string> = {
  fat_loss: "ירידה בשומן",
  muscle: "מסת שריר",
  performance: "ביצועים",
  health: "בריאות",
  rehab: "שיקום",
};

function clsx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}

function scoreToBadge(score: number) {
  if (score >= 80)
    return {
      label: "התאמה גבוהה",
      color: "bg-emerald-500/10 text-emerald-700 border-emerald-400/60",
    };
  if (score >= 50)
    return {
      label: "התאמה טובה",
      color: "bg-amber-500/10 text-amber-700 border-amber-400/60",
    };
  return {
    label: "התאמה בסיסית",
    color: "bg-sky-500/10 text-sky-700 border-sky-400/60",
  };
}

function genderLabel(g?: MatchItem["gender"]) {
  if (g === "male") return "גבר";
  if (g === "female") return "אישה";
  return "לא צויין";
}

function Avatar({ item }: { item: MatchItem }) {
  if (item.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={item.avatarUrl}
        alt={item.displayName || "avatar"}
        className="h-12 w-12 rounded-2xl object-cover"
      />
    );
  }
  return (
    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center text-white text-lg font-black">
      {(item.displayName || "מ").slice(0, 1)}
    </div>
  );
}

function MatchCard({ item }: { item: MatchItem }) {
  const badge = scoreToBadge(item.score);
  const hasCommon =
    item.common.days.length ||
    item.common.styles.length ||
    item.common.goals.length ||
    item.common.muscles.length;

  return (
    <article className="rounded-3xl border bg-white/80 p-4 shadow-sm backdrop-blur dark:bg-zinc-900/70 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar item={item} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1 text-sm font-semibold">
            <span>{item.displayName || "משתמש אנונימי"}</span>
            {item.age && (
              <span className="text-xs opacity-70">
                · {item.age}
              </span>
            )}
            <span className="text-xs opacity-70">
              · {genderLabel(item.gender)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {item.locationArea && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 dark:bg-zinc-800">
                <MapPin className="w-3 h-3" />
                {item.locationArea}
              </span>
            )}
            <span
              className={clsx(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                badge.color,
              )}
            >
              <Sparkles className="w-3 h-3" />
              {badge.label} · {item.score} נק'
            </span>
          </div>
        </div>
      </div>

      {/* משותף */}
      {hasCommon && (
        <div className="rounded-2xl border bg-white/70 p-3 text-xs space-y-2 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-pink-500" />
            <span className="font-semibold">
              מה משותף לכם באימונים?
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.common.days.map((d) => (
              <span
                key={d}
                className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-200"
              >
                ימי אימון: {DAY_LABEL[d]}
              </span>
            ))}
            {item.common.styles.map((s) => (
              <span
                key={s}
                className="rounded-full bg-sky-500/10 px-2 py-0.5 text-sky-700 dark:text-sky-200"
              >
                סטייל: {STYLE_LABEL[s]}
              </span>
            ))}
            {item.common.goals.map((g) => (
              <span
                key={g}
                className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-200"
              >
                יעד: {GOAL_LABEL[g]}
              </span>
            ))}
            {item.common.muscles.map((m) => (
              <span
                key={m}
                className="rounded-full bg-rose-500/10 px-2 py-0.5 text-rose-700 dark:text-rose-200"
              >
                שריר: {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* סיבות / הסבר ציון */}
      {!!item.reasons.length && (
        <div className="rounded-2xl bg-white/70 p-3 text-[11px] leading-relaxed dark:bg-zinc-900">
          <div className="mb-1 font-semibold text-xs">
            למה זה מאצ' טוב?
          </div>
          <ul className="list-disc pr-4 space-y-0.5">
            {item.reasons.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA – מעבר לצ'אט / פרופיל DATE (תבנה אח"כ רוטים מתאימים) */}
      <div className="flex items-center justify-between pt-1">
        <a
          href={`/date/profile/${encodeURIComponent(
            item.userId,
          )}`}
          className="inline-flex items-center gap-1 rounded-full border bg-white/70 px-3 py-1.5 text-xs hover:bg-amber-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <ChevronRight className="w-3 h-3" />
          לצפייה בפרופיל MATY-DATE
        </a>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800"
        >
          <Users2 className="w-3 h-3" />
          פתח צ'אט / בקשת אימון
        </button>
      </div>
    </article>
  );
}

export default function FitMatchesPage() {
  const [items, setItems] = React.useState<MatchItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [limit, setLimit] = React.useState(24);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/date/fit-matches?limit=${limit}`,
          {
            credentials: "same-origin",
            cache: "no-store",
          },
        );
        const j: ApiResp = await res.json();
        if (!res.ok || !j.ok) {
          throw new Error(
            j.error ||
              j.message ||
              `HTTP ${res.status}`,
          );
        }
        if (!cancelled) {
          setItems(j.items || []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.message ||
              "שגיאה בטעינת שידוכי כושר",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [limit, refreshKey]);

  const hasMatches = items.length > 0;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-amber-50 to-white dark:from-black dark:to-zinc-900 px-4 py-8"
    >
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-3xl border bg-white/80 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/70 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center text-white">
              <Users2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                שידוכי כושר · MATY-DATE × MATY-FIT
              </h1>
              <p className="mt-1 text-xs md:text-sm opacity-70">
                כאן אתה רואה אנשים ש־MATY חושב שהם
                מתאימים לך לאימונים – לפי פרופיל הכושר
                שבנית ב־MATY-FIT.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
            <a
              href="/fit/profile"
              className="inline-flex items-center gap-1 rounded-full border bg-white/70 px-3 py-1.5 hover:bg-amber-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <Dumbbell className="w-4 h-4" />
              עדכון פרופיל MATY-FIT
            </a>
            <button
              type="button"
              onClick={() =>
                setRefreshKey((x) => x + 1)
              }
              className="inline-flex items-center gap-1 rounded-full border bg-white/70 px-3 py-1.5 hover:bg-emerald-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <Activity className="w-4 h-4" />
              רענן התאמות
            </button>
          </div>
        </header>

        <section className="rounded-3xl border bg-white/80 p-4 shadow-sm backdrop-blur dark:bg-zinc-900/70 flex flex-wrap items-center gap-3 text-xs md:text-sm">
          <div className="inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>איך זה עובד?</span>
          </div>
          <ul className="flex flex-wrap gap-3">
            <li className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-amber-500" />
              הציון מבוסס על ימים, סגנון, יעדים ואזור.
            </li>
            <li className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              אפשר לפתוח צ'אט / בקשה דרך MATY-DATE.
            </li>
            <li className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-sky-500" />
              רוצה לשנות התאמות? עדכן את פרופיל
              MATY-FIT.
            </li>
          </ul>
        </section>

        <div className="flex items-center justify-between text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <span>מספר התאמות להציג:</span>
            <select
              className="rounded-full border bg-white/80 px-3 py-1 dark:bg-zinc-900"
              value={limit}
              onChange={(e) =>
                setLimit(Number(e.target.value))
              }
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={36}>36</option>
              <option value={48}>48</option>
            </select>
          </div>
          {hasMatches && (
            <div className="flex items-center gap-2 text-xs opacity-70">
              <Users2 className="w-4 h-4" />
              נמצאו {items.length} התאמות
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-300/60 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border bg-white/80 p-4 text-sm flex items-center gap-2 shadow-sm backdrop-blur dark:bg-zinc-900/70">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>טוען שידוכי כושר עבורך…</span>
          </div>
        )}

        {!loading && !error && !hasMatches && (
          <div className="rounded-3xl border bg-white/80 p-5 text-sm shadow-sm backdrop-blur dark:bg-zinc-900/70 space-y-2">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-pink-500" />
              <span className="font-semibold">
                כרגע אין התאמות מתאימות.
              </span>
            </div>
            <p className="text-xs md:text-sm opacity-70">
              נסה לעדכן את פרופיל MATY-FIT (אזור, ימים,
              סגנון אימון) או הגדל את הרדיוס.
            </p>
            <a
              href="/fit/profile"
              className="inline-flex items-center gap-1 rounded-full border bg-white/70 px-3 py-1.5 text-xs mt-2 hover:bg-amber-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <ChevronRight className="w-3 h-3" />
              לעדכון פרופיל MATY-FIT
            </a>
          </div>
        )}

        {hasMatches && (
          <section className="grid gap-3 md:grid-cols-2">
            {items.map((m) => (
              <MatchCard key={m.userId} item={m} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
