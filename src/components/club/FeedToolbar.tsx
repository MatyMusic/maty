// src/components/club/FeedToolbar.tsx
"use client";

export type FeedFilters = {
  q: string; // חיפוש לוקאלי בטקסט/תגיות (צד־לקוח)
  genre?: string; // נשלח ל-API
  tag?: string; // נשלח ל-API
  authorId?: string; // נשלח ל-API
  sort?: "latest" | "popular"; // כרגע UI; ה-API תומך latest (ברירת מחדל)
  shortsOnly?: boolean; // קיצור ל-tag="shorts"
};

type Props = {
  value: FeedFilters;
  onChange: (next: FeedFilters) => void;
};

const GENRES = ["club", "chabad", "mizrahi", "soft", "fun"];
const TAGS = ["shorts", "music", "video", "party", "promo"];

export default function FeedToolbar({ value, onChange }: Props) {
  function patch(p: Partial<FeedFilters>) {
    onChange({ ...value, ...p });
  }

  function toggleGenre(genre: string) {
    const next = value.genre === genre ? undefined : (genre as string);
    patch({ genre: next });
  }

  function toggleTag(tag: string) {
    const next = value.tag === tag ? undefined : tag;
    const shortsOnly = tag === "shorts" ? !!next : value.shortsOnly;
    patch({ tag: next, shortsOnly });
  }

  function toggleShortsOnly() {
    const next = !value.shortsOnly;
    const filters: FeedFilters = {
      ...value,
      shortsOnly: next,
    };

    if (next && !value.tag) {
      filters.tag = "shorts";
    }
    if (!next && value.tag === "shorts") {
      filters.tag = undefined;
    }

    onChange(filters);
  }

  function onClear() {
    onChange({
      q: "",
      genre: undefined,
      tag: undefined,
      authorId: undefined,
      sort: "latest",
      shortsOnly: false,
    });
  }

  const hasFilters =
    value.q ||
    value.genre ||
    value.tag ||
    value.authorId ||
    value.shortsOnly ||
    value.sort === "popular";

  return (
    <aside
      className="sticky top-0 z-20 border-b border-slate-200/70 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 backdrop-blur"
      aria-label="סרגל סינון לפיד CLUB"
    >
      <div className="mx-auto max-w-4xl px-3 py-3 space-y-2">
        {/* שורה 1: חיפוש + כפתור ניקוי */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-[280px]">
            <input
              value={value.q}
              onChange={(e) => patch({ q: e.target.value })}
              placeholder="חיפוש בטקסט / תגיות…"
              className="h-9 w-full rounded-xl border border-slate-300/80 dark:border-slate-700 bg-white/80 dark:bg-slate-950/60 pe-8 ps-3 text-[13px] outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
            <span className="absolute end-2 top-2.5 text-xs opacity-60">
              🔎
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            {hasFilters && (
              <button
                type="button"
                onClick={onClear}
                className="rounded-full border border-slate-300/80 dark:border-slate-700 px-3 py-1 text-[11px] text-slate-600 dark:text-slate-200 hover:bg-slate-50/70 dark:hover:bg-slate-900/70"
              >
                איפוס פילטרים
              </button>
            )}

            {value.sort === "popular" && (
              <span className="rounded-full bg-amber-100/80 dark:bg-amber-900/40 px-2 py-1 text-[10px] text-amber-700 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700/70">
                ממויין לפי פופולריות ⭐
              </span>
            )}
          </div>
        </div>

        {/* שורה 2: ז'אנרים */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400">
            ז&apos;אנר:
          </span>
          {GENRES.map((g) => {
            const active = value.genre === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                className={[
                  "rounded-full border px-3 py-1 transition-all",
                  active
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                    : "border-slate-300/70 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-50/70 dark:hover:bg-slate-900/70",
                ].join(" ")}
              >
                {g === "club" && "CLUB"}
                {g === "chabad" && 'חב"ד'}
                {g === "mizrahi" && "מזרחי"}
                {g === "soft" && "שקט"}
                {g === "fun" && "מקפיץ"}
              </button>
            );
          })}
        </div>

        {/* שורה 3: תגיות + שורטס + מיון */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">תגיות:</span>
            {TAGS.map((t) => {
              const active = value.tag === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={[
                    "rounded-full border px-3 py-1 transition-all",
                    active
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200"
                      : "border-slate-300/70 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-50/70 dark:hover:bg-slate-900/70",
                  ].join(" ")}
                >
                  {t === "shorts" ? "Shorts" : `#${t}`}
                </button>
              );
            })}

            <button
              type="button"
              onClick={toggleShortsOnly}
              className={[
                "ms-1 rounded-full px-3 py-1 border text-[11px] transition-all",
                value.shortsOnly
                  ? "border-pink-500 bg-pink-500/10 text-pink-700 dark:text-pink-200"
                  : "border-slate-300/70 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-50/70 dark:hover:bg-slate-900/70",
              ].join(" ")}
            >
              🎬 רק Shorts
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">מיון:</span>
            <button
              type="button"
              onClick={() => patch({ sort: "latest" })}
              className={[
                "rounded-full border px-3 py-1 text-[11px] transition-all",
                !value.sort || value.sort === "latest"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                  : "border-slate-300/70 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-50/70 dark:hover:bg-slate-900/70",
              ].join(" ")}
            >
              אחרונים
            </button>
            <button
              type="button"
              onClick={() => patch({ sort: "popular" })}
              className={[
                "rounded-full border px-3 py-1 text-[11px] transition-all",
                value.sort === "popular"
                  ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-200"
                  : "border-slate-300/70 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-50/70 dark:hover:bg-slate-900/70",
              ].join(" ")}
            >
              פופולרי
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
