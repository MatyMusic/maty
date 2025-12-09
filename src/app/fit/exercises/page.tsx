"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  ExternalLink,
} from "lucide-react";

type Item = {
  id?: string;
  name: string;
  muscle: string;
  level?: string;
  provider?: string;
  images?: string[];
  youtubeId?: string;
  videoUrl?: string;
  description?: string;
};

const PAGE_SIZE = 5;
const PROVIDERS_ALL = ["wger", "exercisedb", "apininjas"] as const;

function clsx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}

async function fetchExercises(params: {
  q?: string;
  muscle?: string;
  level?: string;
  providers: string[];
  page: number;
  pageSize: number;
  sort?: string;
  signal?: AbortSignal;
}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.muscle) sp.set("muscle", params.muscle);
  if (params.level) sp.set("level", params.level);
  if (params.sort) sp.set("sort", params.sort);
  sp.set("page", String(params.page));
  sp.set("pageSize", String(params.pageSize));
  (params.providers.length
    ? params.providers
    : Array.from(PROVIDERS_ALL)
  ).forEach((p) => sp.append("provider", p));

  const res = await fetch(`/api/fit/exercises?${sp.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
    signal: params.signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  return {
    items: (j.items || []) as Item[],
    total: Number(j.total || 0),
  };
}

function ExerciseCard({ it }: { it: Item }) {
  const cover =
    (it.images && it.images[0]) ||
    // fallback קטן
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=70&auto=format";

  return (
    <article
      className="rounded-2xl border bg-white/80 shadow-sm backdrop-blur transition hover:shadow-md dark:bg-zinc-900/70"
      dir="rtl"
    >
      <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={it.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <span className="absolute start-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
          {it.muscle || "כללי"}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-bold" title={it.name}>
            {it.name}
          </h3>
          <span className="rounded border px-2 py-0.5 text-[11px] opacity-80">
            {it.provider || "—"}
          </span>
        </div>

        {it.description && (
          <p className="mt-1 line-clamp-2 text-sm opacity-80">
            {it.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border px-2 py-1">
            רמה: {it.level || "כל הרמות"}
          </span>
          <a
            href={`/fit/exercises/${encodeURIComponent(it.id || it.name)}`}
            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium hover:bg-amber-50 dark:hover:bg-white/10"
            title="פתח תרגיל"
          >
            <ExternalLink size={14} /> פתח תרגיל
          </a>
          <a
            href={`/fit/workouts?add=${encodeURIComponent(it.name)}`}
            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 hover:bg-amber-50 dark:hover:bg-white/10"
            title="הוסף לאימון"
          >
            <Dumbbell size={14} /> הוסף לאימון
          </a>
        </div>
      </div>
    </article>
  );
}

export default function FitExercisesList() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // מסננים בסיסיים (פשוטים וקריאים)
  const [q, setQ] = React.useState(searchParams.get("q") || "");
  const [muscle, setMuscle] = React.useState(searchParams.get("muscle") || "");
  const [level, setLevel] = React.useState(searchParams.get("level") || "");
  const [providers, setProviders] = React.useState<string[]>(
    searchParams.getAll("provider").length
      ? searchParams.getAll("provider")
      : Array.from(PROVIDERS_ALL),
  );
  const [sort, setSort] = React.useState(
    searchParams.get("sort") || "relevance",
  );

  // עמוד נוכחי (עם סנכרון ל־URL)
  const pageFromUrl = Number(searchParams.get("page") || "1");
  const [page, setPage] = React.useState(Math.max(1, pageFromUrl));

  const [items, setItems] = React.useState<Item[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const controllerRef = React.useRef<AbortController | null>(null);

  const applyToUrl = React.useCallback(
    (nextPage: number) => {
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      if (muscle) sp.set("muscle", muscle);
      if (level) sp.set("level", level);
      if (sort) sp.set("sort", sort);
      (providers.length ? providers : Array.from(PROVIDERS_ALL)).forEach((p) =>
        sp.append("provider", p),
      );
      sp.set("page", String(nextPage));
      router.push(`/fit/exercises?${sp.toString()}`);
    },
    [q, muscle, level, sort, providers, router],
  );

  const fetchPage = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    if (controllerRef.current) controllerRef.current.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    try {
      const res = await fetchExercises({
        q: q || undefined,
        muscle: muscle || undefined,
        level: level || undefined,
        providers,
        page,
        pageSize: PAGE_SIZE,
        sort,
        signal: ctrl.signal,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e?.message || "שגיאה בלתי צפויה");
    } finally {
      setLoading(false);
    }
  }, [q, muscle, level, providers, page, sort]);

  // טעינה ראשונית ושינויים
  React.useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // שינוי מסננים מאפס דף ל־1
  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    setPage(1);
    applyToUrl(1);
    // fetchPage יתופעל ע״י useEffect על page/params דרך ה-URL
  }

  // דפדוף
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  function goPrev() {
    if (page <= 1) return;
    const p = page - 1;
    setPage(p);
    applyToUrl(p);
  }
  function goNext() {
    if (page >= pages) return;
    const p = page + 1;
    setPage(p);
    applyToUrl(p);
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-amber-50 to-white px-4 py-6 dark:from-black dark:to-zinc-900"
    >
      <div className="mx-auto max-w-5xl space-y-4">
        {/* כותרת */}
        <header className="rounded-3xl border bg-white/80 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/70">
          <h1 className="text-2xl font-extrabold tracking-tight">
            ספריית תרגילים
          </h1>
          <p className="mt-1 text-sm opacity-70">
            דפדוף של 5 לכרטיסיה, עם תמונת תצוגה מקדימה.
          </p>
        </header>

        {/* מסננים */}
        <section className="rounded-2xl border bg-white/75 p-3 shadow-sm backdrop-blur dark:bg-zinc-900/70">
          <form
            onSubmit={applyFilters}
            className="grid gap-2 sm:grid-cols-[1fr_160px_160px_120px] items-center"
          >
            <label className="flex items-center gap-2 rounded-xl border bg-white/70 px-3 py-2 dark:bg-white/10">
              <Search size={16} className="opacity-60" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="חפש תרגיל…"
                className="w-full bg-transparent outline-none"
              />
            </label>

            <select
              value={muscle}
              onChange={(e) => setMuscle(e.target.value)}
              className="rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-white/10"
            >
              <option value="">כל השרירים</option>
              <option>חזה</option>
              <option>גב</option>
              <option>רגליים</option>
              <option>כתפיים</option>
              <option>בטן</option>
              <option>יד קדמית</option>
              <option>יד אחורית</option>
            </select>

            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg:white/10"
            >
              <option value="">כל הרמות</option>
              <option>קל</option>
              <option>בינוני</option>
              <option>מתקדם</option>
            </select>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-amber-50 dark:hover:bg-white/10"
              title="החל מסננים"
            >
              <Filter size={16} /> החל מסננים
            </button>
          </form>
        </section>

        {/* תוצאות */}
        <section className="space-y-3">
          {error && (
            <div className="rounded-2xl border border-red-300/60 bg-red-50 p-3 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          )}
          {loading && <div className="text-sm opacity-70">טוען תרגילים…</div>}
          {!loading && !items.length && (
            <div className="text-sm opacity-70">לא נמצאו תרגילים.</div>
          )}

          {!!items.length && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {items.map((it) => (
                <li key={`${it.provider}:${it.id || it.name}`}>
                  <ExerciseCard it={it} />
                </li>
              ))}
            </ul>
          )}

          {/* דפדוף */}
          {pages > 1 && (
            <nav
              className="mt-2 flex items-center justify-center gap-2"
              aria-label="דפדוף"
            >
              <button
                onClick={goPrev}
                disabled={page <= 1}
                className={clsx(
                  "inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm",
                  page <= 1 ? "opacity-40" : "hover:bg-amber-50",
                )}
              >
                <ChevronRight size={16} /> הקודם
              </button>

              <span className="rounded-xl border bg-white/60 px-3 py-1.5 text-sm dark:bg-zinc-800">
                עמוד {page} מתוך {pages}
              </span>

              <button
                onClick={goNext}
                disabled={page >= pages}
                className={clsx(
                  "inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm",
                  page >= pages ? "opacity-40" : "hover:bg-amber-50",
                )}
              >
                הבא <ChevronLeft size={16} />
              </button>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
