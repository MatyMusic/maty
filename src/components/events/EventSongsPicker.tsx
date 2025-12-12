// src/components/events/EventSongsPicker.tsx
"use client";

import {
  CheckCircle2,
  Circle,
  Disc3,
  Filter,
  Heart,
  HeartOff,
  Music4,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type EventSong = {
  _id?: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  genres?: string[];
  slug?: string;
  source?: string;
  createdAt?: string;
};

type FetchState = "idle" | "loading" | "ready" | "error";

type ApiResponse = {
  songs: EventSong[];
};

type ViewMode = "all" | "selected";

export function EventSongsPicker() {
  const [state, setState] = useState<FetchState>("idle");
  const [songs, setSongs] = useState<EventSong[]>([]);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [artistFilter, setArtistFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setState("loading");
        const res = await fetch("/api/events/songs?limit=250");
        if (!res.ok) throw new Error("Failed to fetch songs");
        const data = (await res.json()) as ApiResponse;
        if (cancelled) return;

        setSongs(data.songs || []);
        setState("ready");
      } catch (e) {
        console.error("[EventSongsPicker] error:", e);
        if (!cancelled) setState("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ז'אנרים ייחודיים
  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const s of songs) {
      (s.genres || []).forEach((g) => g && set.add(g));
    }
    return ["all", ...Array.from(set).sort()];
  }, [songs]);

  // אמנים ייחודיים
  const artists = useMemo(() => {
    const set = new Set<string>();
    for (const s of songs) {
      if (s.artist) set.add(s.artist);
    }
    return ["all", ...Array.from(set).sort()];
  }, [songs]);

  // סינון לפי חיפוש + ז'אנר + אמן
  const filtered = useMemo(() => {
    let list = songs;

    if (genreFilter !== "all") {
      list = list.filter((s) => (s.genres || []).includes(genreFilter));
    }

    if (artistFilter !== "all") {
      list = list.filter((s) => s.artist === artistFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => {
        const title = s.title?.toLowerCase() || "";
        const artist = s.artist?.toLowerCase() || "";
        const album = s.album?.toLowerCase() || "";
        return title.includes(q) || artist.includes(q) || album.includes(q);
      });
    }

    // מצב "רק נבחרים"
    if (viewMode === "selected") {
      list = list.filter((s) => {
        const key = songKey(s);
        return key && selectedIds.includes(key);
      });
    }

    return list.slice(0, 120);
  }, [songs, genreFilter, artistFilter, search, viewMode, selectedIds]);

  const totalSelected = selectedIds.length;

  function songKey(song: EventSong): string {
    // מפתח יציב וייחודי – מונע אזהרת React על key כפול
    return (
      song._id ||
      song.slug ||
      `${song.title || "unknown"}-${song.artist || "unknown"}`
    );
  }

  function isSelected(song: EventSong): boolean {
    const key = songKey(song);
    if (!key) return false;
    return selectedIds.includes(key);
  }

  function toggleSelected(song: EventSong) {
    const key = songKey(song);
    if (!key) return;
    setSelectedIds((prev) =>
      prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key],
    );
  }

  function clearSelection() {
    setSelectedIds([]);
    setViewMode("all");
  }

  return (
    <section
      className="rounded-3xl border dark:border-neutral-800/70 bg-white/80 dark:bg-neutral-950/85 backdrop-blur-xl p-5 sm:p-6 text-right shadow-md"
      dir="rtl"
    >
      {/* כותרת + תיאור */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 border border-violet-600/30 px-3 py-1 text-[11px] font-medium text-violet-700 dark:text-violet-200">
            <Sparkles className="w-3.5 h-3.5" />
            בחירת שירים לאירוע • מתוך ספריית MATY-MUSIC
          </div>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Music4 className="w-5 h-5 text-violet-600" />
            לבנות פלייליסט מותאם לחתונה / בר מצווה / התוועדות
          </h2>
          <p className="text-xs sm:text-sm opacity-80 max-w-2xl">
            עוברים על רשימת שירים מדגמית לפי ז&apos;אנר/זמר, רואים עטיפה קטנה
            ומסמנים מה אוהבים. בטופס הזמנה אפשר לשלוח לי את הרשימה, ואני בונה
            ממנה סט חזק ומדויק לאירוע שלכם.
          </p>
        </div>

        <div className="text-[11px] sm:text-xs opacity-75 text-left sm:text-right">
          <div>הרשימה נמשכת מתוך בסיס נתונים (Spotify + MATY-MUSIC).</div>
          <div>בשלב הזה זה כלי הדגמה — לא חייב לסמן כל שיר.</div>
        </div>
      </header>

      {/* אזור פילטרים + מצב תצוגה */}
      <div className="mb-4 space-y-3">
        {/* שורה עליונה – חיפוש + מצב תצוגה */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm opacity-80">
            <Filter className="w-4 h-4 text-violet-600" />
            <span>חיפוש מהיר בתוך הרשימה:</span>

            <div className="inline-flex items-center gap-1 rounded-full bg-neutral-100/80 dark:bg-neutral-900/80 px-2 py-0.5 text-[10px] sm:text-[11px]">
              {totalSelected > 0 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>נבחרו {totalSelected} שירים</span>
                </>
              ) : (
                <>
                  <Circle className="w-3.5 h-3.5 text-neutral-400" />
                  <span>עוד לא סימנת שירים</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
            {/* מצב תצוגה: כל השירים / רק נבחרים */}
            <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/90 p-0.5 text-[11px] sm:text-xs">
              <button
                type="button"
                onClick={() => setViewMode("all")}
                className={[
                  "px-3 py-1 rounded-full flex items-center gap-1",
                  viewMode === "all"
                    ? "bg-violet-600 text-white"
                    : "text-neutral-700 dark:text-neutral-200",
                ].join(" ")}
              >
                <Music4 className="w-3.5 h-3.5" />
                <span>כל השירים</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("selected")}
                className={[
                  "px-3 py-1 rounded-full flex items-center gap-1",
                  viewMode === "selected"
                    ? "bg-violet-600 text-white"
                    : "text-neutral-700 dark:text-neutral-200",
                ].join(" ")}
                disabled={!totalSelected}
              >
                {totalSelected ? (
                  <Heart className="w-3.5 h-3.5" />
                ) : (
                  <HeartOff className="w-3.5 h-3.5" />
                )}
                <span>רק השירים שסימנתי</span>
              </button>
            </div>

            {/* אינפוט חיפוש */}
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חפש לפי שם שיר / זמר / אלבום..."
                className="w-full rounded-full border border-neutral-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/90 px-9 py-1.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-violet-500/70"
                dir="rtl"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* שורה תחתונה – ז׳אנר + אמן + ניקוי בחירה */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm">
          <div className="flex flex-wrap gap-2 justify-end">
            <span className="inline-flex items-center gap-1 opacity-75">
              סינון לפי:
            </span>
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="rounded-full border border-neutral-200/80 dark:border-neutral-700/80 bg-white/95 dark:bg-neutral-900/90 px-3 py-1 text-[11px] sm:text-xs outline-none focus:ring-2 focus:ring-violet-500/70"
            >
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g === "all" ? "כל הז׳אנרים" : g}
                </option>
              ))}
            </select>

            <select
              value={artistFilter}
              onChange={(e) => setArtistFilter(e.target.value)}
              className="rounded-full border border-neutral-200/80 dark:border-neutral-700/80 bg-white/95 dark:bg-neutral-900/90 px-3 py-1 text-[11px] sm:text-xs outline-none focus:ring-2 focus:ring-violet-500/70"
            >
              {artists.map((a) => (
                <option key={a} value={a}>
                  {a === "all" ? "כל הזמרים" : a}
                </option>
              ))}
            </select>

            {totalSelected > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/90 px-3 py-1 text-[11px] hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <HeartOff className="w-3.5 h-3.5" />
                נקה בחירה
              </button>
            )}
          </div>

          <div className="text-[11px] opacity-70 text-left sm:text-right">
            מוצגים {filtered.length} שירים מתוך {songs.length}
          </div>
        </div>
      </div>

      {/* גוף הרשימה – עם max-height ו-scroll פנימי */}
      <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-neutral-950/95 overflow-hidden">
        {state === "loading" && (
          <div className="flex items-center justify-center py-10 text-xs sm:text-sm opacity-80 gap-2">
            <Disc3 className="w-4 h-4 animate-spin text-violet-600" />
            טוען רשימת שירים מהשרת...
          </div>
        )}

        {state === "error" && (
          <div className="flex items-center justify-center py-10 text-xs sm:text-sm text-red-600 dark:text-red-400">
            שגיאה בטעינת רשימת השירים. אפשר לנסות לרענן את העמוד.
          </div>
        )}

        {state === "ready" && (
          <>
            {/* כותרת הטבלה (דסקטופ) */}
            <div className="hidden sm:grid grid-cols-[auto_minmax(0,1.8fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-3 px-3 py-2 border-b border-neutral-200/80 dark:border-neutral-800/80 text-[11px] font-semibold opacity-80">
              <div />
              <div>שם השיר</div>
              <div>זמר / אלבום</div>
              <div>ז׳אנר</div>
            </div>

            <div className="max-h-80 sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent">
              {filtered.length === 0 && (
                <div className="flex items-center justify-center py-10 text-xs sm:text-sm opacity-75">
                  לא נמצאו שירים לפי הפילטרים שבחרת.
                </div>
              )}

              <ul className="divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
                {filtered.map((song) => {
                  const selected = isSelected(song);
                  const key = songKey(song);

                  return (
                    <li
                      key={key}
                      className={[
                        "px-3 py-2.5 text-xs sm:text-sm flex flex-col sm:grid sm:grid-cols-[auto_minmax(0,1.8fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-2 items-center sm:items-center transition",
                        selected
                          ? "bg-violet-50/80 dark:bg-violet-950/40"
                          : "hover:bg-neutral-50/80 dark:hover:bg-neutral-900/60",
                      ].join(" ")}
                    >
                      {/* טוגל בחירה + עטיפה */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSelected(song)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-neutral-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/90 hover:bg-violet-50 dark:hover:bg-violet-950/40"
                        >
                          {selected ? (
                            <CheckCircle2 className="w-4 h-4 text-violet-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-neutral-400" />
                          )}
                        </button>

                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                          {song.coverUrl ? (
                            <Image
                              src={song.coverUrl}
                              alt={song.title}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Disc3 className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                      </div>

                      {/* שם שיר */}
                      <div className="w-full text-right">
                        <div className="font-semibold leading-snug">
                          {song.title}
                        </div>
                        {song.source && (
                          <div className="text-[10px] opacity-60">
                            מקור: {song.source}
                          </div>
                        )}
                      </div>

                      {/* אמן / אלבום */}
                      <div className="w-full text-right opacity-80">
                        <div>{song.artist}</div>
                        {song.album && (
                          <div className="text-[11px] opacity-70">
                            {song.album}
                          </div>
                        )}
                      </div>

                      {/* ז'אנר */}
                      <div className="w-full text-right">
                        {(song.genres?.length ?? 0) > 0 ? (
                          <div className="flex flex-wrap justify-end gap-1">
                            {song.genres!.slice(0, 2).map((g) => (
                              <span
                                key={g}
                                className="inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 text-[10px]"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] opacity-60">
                            ללא ז׳אנר מוגדר
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* hidden input לטופס הזמנה (אם העמוד בתוך <form>) */}
      <input
        type="hidden"
        name="favSongIds"
        value={selectedIds.join(",")}
        readOnly
      />

      {/* פוטר קטן מתחת לרשימה */}
      <footer className="mt-3 text-[11px] sm:text-xs opacity-70 space-y-1">
        <div>
          ברגע שסוגרים אירוע, נבנה יחד רשימה מסודרת לפי טעם המשפחה, גיל הקהל
          ואופי האירוע. כאן אתה מסמן כיוון וכל השאר עליי.
        </div>
        {totalSelected > 0 && (
          <div className="font-medium">
            לטופס ההזמנה: יסומנו{" "}
            <span className="text-violet-600 font-semibold">
              {totalSelected} שירים
            </span>{" "}
            מועדפים מתוך הרשימה.
          </div>
        )}
      </footer>
    </section>
  );
}
