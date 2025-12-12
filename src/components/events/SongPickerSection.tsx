// src/components/events/SongPickerSection.tsx
"use client";

import type {
  ApiSongCategory,
  ApiSongItem,
  ApiSongUseCase,
} from "@/app/api/events/songs/route";
import {
  ArrowLeft,
  Ban,
  Check,
  Heart,
  ListMusic,
  Pause,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * SongPickerSection
 * -----------------
 * - שואב שירים מ- /api/events/songs
 * - פילטר לפי קטגוריה, שימוש, זמר, חיפוש
 * - 3 רמות העדפה: חייב / אשמח / לא לנגן
 * - שמירת טיוטה ב-localStorage (maty:event:playlist)
 * - כפתור Play קטן ל-preview (אם יש previewUrl)
 */

type SongPreference = "must" | "like" | "block";
type PrefMap = Record<string, SongPreference | undefined>;

const CATEGORY_LABEL: Record<ApiSongCategory, string> = {
  chabad: "חב״ד / חסידי",
  nigun: "ניגונים",
  wedding: "חתונות / חופה",
  mizrahit: "מזרחית",
  israeli: "ישראלי כללי",
  kids: "שירי ילדים / משפחה",
  soft: "אווירה שקטה",
};

const USE_LABEL: Record<ApiSongUseCase, string> = {
  hupa: "חופה",
  rikud: "ריקודים",
  farbrengen: "התוועדות",
  family: "משפחתי",
  background: "רקע / קבלת פנים",
};

const LS_KEY = "maty:event:playlist";

export default function SongPickerSection() {
  const [songs, setSongs] = useState<ApiSongItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ApiSongCategory | "all">(
    "all",
  );
  const [useFilter, setUseFilter] = useState<ApiSongUseCase | "all">("all");
  const [artistFilter, setArtistFilter] = useState<string>("all");
  const [prefs, setPrefs] = useState<PrefMap>({});
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // ניגון preview
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // טעינת שירים מה-API
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/events/songs");
        if (!res.ok) {
          throw new Error("אי אפשר לטעון שירים");
        }
        const data = (await res.json()) as {
          songs: ApiSongItem[];
        };
        if (!cancelled) {
          setSongs(data.songs || []);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "תקלה בטעינת רשימת השירים");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // טעינת טיוטת בחירה מהדפדפן
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PrefMap;
      setPrefs(parsed || {});
    } catch {
      // מתעלמים
    }
  }, []);

  // שמירה אוטומטית
  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(prefs));
    } catch {
      // מתעלמים
    }
  }, [prefs]);

  // רשימת זמרים ייחודית (לסלקט)
  const artists = useMemo(() => {
    const set = new Set<string>();
    songs.forEach((s) => {
      if (s.artist) set.add(s.artist);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "he"));
  }, [songs]);

  const filteredSongs = useMemo(() => {
    return songs.filter((s) => {
      if (categoryFilter !== "all" && s.category !== categoryFilter)
        return false;
      if (useFilter !== "all" && !s.use.some((u) => u === useFilter))
        return false;
      if (artistFilter !== "all" && s.artist !== artistFilter) return false;
      if (showOnlySelected && !prefs[s.id]) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [
    songs,
    categoryFilter,
    useFilter,
    artistFilter,
    showOnlySelected,
    prefs,
    search,
  ]);

  const counts = useMemo(() => {
    let must = 0;
    let like = 0;
    let block = 0;
    for (const v of Object.values(prefs)) {
      if (v === "must") must++;
      else if (v === "like") like++;
      else if (v === "block") block++;
    }
    return {
      must,
      like,
      block,
      total: must + like + block,
    };
  }, [prefs]);

  function setPreference(id: string, pref: SongPreference | null) {
    setPrefs((prev) => {
      const next: PrefMap = { ...prev };
      if (!pref) delete next[id];
      else next[id] = pref;
      return next;
    });
  }

  function clearAll() {
    if (!window.confirm("לאפס את בחירת השירים לטופס הזה?")) return;
    setPrefs({});
  }

  // ניהול פליי / פאוז
  function togglePlay(song: ApiSongItem) {
    if (!song.previewUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    // אם לוחצים על אותו שיר שוב – עצירה
    if (playingId === song.id) {
      audio.pause();
      setPlayingId(null);
      return;
    }

    audio.pause();
    audio.src = song.previewUrl;
    audio.currentTime = 0;
    audio
      .play()
      .then(() => {
        setPlayingId(song.id);
      })
      .catch(() => {
        // אפשר להציג טוסט בעתיד
        setPlayingId(null);
      });

    audio.onended = () => {
      setPlayingId(null);
    };
  }

  return (
    <section className="rounded-3xl border dark:border-neutral-800/70 bg-slate-950/92 backdrop-blur-xl p-5 sm:p-6 text-right space-y-4 text-slate-100 shadow-[0_22px_70px_rgba(0,0,0,0.7)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-600/20 border border-violet-500/40 px-3 py-1 text-[11px] text-violet-100">
            <ListMusic className="w-3.5 h-3.5" />
            בניית פלייליסט אישי לאירוע
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-300" />
            תבחר את השירים שאתה אוהב — אנחנו נתאים את הסט.
          </h2>
          <p className="text-xs sm:text-sm opacity-80 max-w-2xl">
            רשימת שירים אמיתית מה־API שלך. אפשר לסמן שירים שחייבים להיות, שירים
            ש&quot;אשמח שיהיו&quot; ושירים שלא רוצים לנגן בכלל. הבחירה נשמרת
            כטיוטה בדפדפן ומתחברת לטופס ההזמנה.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 text-xs sm:text-sm">
          <div className="flex gap-2 flex-wrap justify-end">
            <SummaryBadge label="חייב להיות" value={counts.must} tone="must" />
            <SummaryBadge label="אשמח שיהיה" value={counts.like} tone="like" />
            <SummaryBadge label="לא לנגן" value={counts.block} tone="block" />
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-[11px] hover:bg-slate-800/90"
            >
              איפוס בחירת השירים
            </button>
          </div>
        </div>
      </div>

      {/* פילטרים וחיפוש */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש לפי שם שיר / אמן / תגית…"
                className="w-full rounded-xl bg-slate-900/80 border border-slate-700/80 ps-8 pe-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 ring-violet-500/50"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end text-[11px] sm:text-xs">
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 border border-slate-700/80 px-2 py-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
              פילטרים
            </div>

            {/* קטגוריות */}
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as ApiSongCategory | "all")
              }
              className="rounded-full bg-slate-900/80 border border-slate-700/80 px-2 py-1 outline-none"
            >
              <option value="all">כל הקטגוריות</option>
              {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* שימוש */}
            <select
              value={useFilter}
              onChange={(e) =>
                setUseFilter(e.target.value as ApiSongUseCase | "all")
              }
              className="rounded-full bg-slate-900/80 border border-slate-700/80 px-2 py-1 outline-none"
            >
              <option value="all">כל סוגי השימוש</option>
              {Object.entries(USE_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* זמר */}
            <select
              value={artistFilter}
              onChange={(e) => setArtistFilter(e.target.value)}
              className="rounded-full bg-slate-900/80 border border-slate-700/80 px-2 py-1 outline-none max-w-[160px]"
            >
              <option value="all">כל הזמרים</option>
              {artists.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlySelected}
                onChange={(e) => setShowOnlySelected(e.target.checked)}
                className="rounded border-slate-600 bg-slate-900"
              />
              <span>הצג רק שירים שסימנתי</span>
            </label>
          </div>
        </div>
      </div>

      {/* רשימת השירים + סיכום צד */}
      <div className="grid lg:grid-cols-[2fr_0.9fr] gap-4 items-start">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/95 max-h-[420px] overflow-y-auto thin-scrollbar">
          {loading ? (
            <div className="p-4 text-xs sm:text-sm opacity-80">
              טוען רשימת שירים…
            </div>
          ) : error ? (
            <div className="p-4 text-xs sm:text-sm text-red-300">{error}</div>
          ) : filteredSongs.length === 0 ? (
            <div className="p-4 text-xs sm:text-sm opacity-80">
              לא נמצאו שירים תואמים לחיפוש/פילטרים.
            </div>
          ) : (
            <ul className="divide-y divide-slate-800/80">
              {filteredSongs.map((song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  current={prefs[song.id]}
                  setPref={setPreference}
                  playingId={playingId}
                  onTogglePlay={() => togglePlay(song)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* סיידבר סיכום */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/95 p-4 text-xs sm:text-sm space-y-2">
            <div className="font-semibold text-sm flex items-center justify-between gap-2">
              <span>סיכום בחירת שירים</span>
              <span className="text-[11px] opacity-70">
                {counts.total} שירים מסומנים
              </span>
            </div>
            <ul className="space-y-1 opacity-85">
              <li className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  חייב להיות
                </span>
                <span>{counts.must}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-pink-400" />
                  אשמח שיהיה
                </span>
                <span>{counts.like}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1">
                  <Ban className="w-3.5 h-3.5 text-red-400" />
                  לא לנגן
                </span>
                <span>{counts.block}</span>
              </li>
            </ul>
            <p className="text-[11px] opacity-75 mt-1 leading-relaxed">
              הבחירה נשמרת כטיוטה בדפדפן. כשאתה ממלא את טופס{" "}
              <span className="font-semibold">תיאום האירוע</span>, אפשר יהיה
              לחבר אותה ולהכין פלייליסט עוד לפני השיחה.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-700/90 via-fuchsia-700/90 to-violet-600/90 p-4 text-xs sm:text-sm text-white space-y-2 shadow-[0_14px_40px_rgba(0,0,0,0.7)]">
            <div className="font-semibold flex items-center gap-2 justify-between">
              <span>להמשיך להזמנה?</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="opacity-90">
              אחרי שסימנת שירים, אפשר לעבור לטופס יצירת קשר, לספר על האירוע
              ולהשאיר תאריך משוער.
            </p>
            <div className="flex flex-wrap gap-2 justify-end">
              <Link
                href="/contact?withPlaylist=1"
                className="inline-flex items-center gap-2 rounded-2xl bg-white text-violet-800 px-3 py-1.5 text-xs sm:text-sm font-semibold hover:bg-neutral-100"
              >
                מעבר לטופס ההזמנה
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── קומפוננטות משנה ───────── */

function SummaryBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "must" | "like" | "block";
}) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px]";
  const toneClass =
    tone === "must"
      ? "bg-emerald-500/15 border border-emerald-500/50 text-emerald-200"
      : tone === "like"
        ? "bg-pink-500/15 border border-pink-500/50 text-pink-200"
        : "bg-red-500/12 border border-red-500/50 text-red-200";
  const Icon = tone === "must" ? Check : tone === "like" ? Heart : Ban;

  return (
    <span className={`${base} ${toneClass}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}: <span className="font-semibold">{value}</span>
    </span>
  );
}

function SongRow({
  song,
  current,
  setPref,
  playingId,
  onTogglePlay,
}: {
  song: ApiSongItem;
  current?: SongPreference;
  setPref: (id: string, pref: SongPreference | null) => void;
  playingId: string | null;
  onTogglePlay: () => void;
}) {
  return (
    <li className="px-3 py-2.5 sm:px-4 sm:py-3 hover:bg-slate-900/60 transition">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-50">
              {song.title}
            </div>
            <div className="text-[11px] opacity-70">
              {song.artist} • {CATEGORY_LABEL[song.category]}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex flex-wrap gap-1 justify-end text-[10px]">
              {song.use.map((u) => (
                <span
                  key={u}
                  className="rounded-full bg-slate-900/80 border border-slate-700/80 px-2 py-0.5"
                >
                  {USE_LABEL[u]}
                </span>
              ))}
            </div>

            {/* כפתור פליי קטן */}
            {song.previewUrl && (
              <button
                type="button"
                onClick={onTogglePlay}
                className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 border border-slate-700/80 px-2 py-0.5 text-[10px] hover:bg-slate-800"
              >
                {playingId === song.id ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    עצירה
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    פליי
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 text-[10px] opacity-80">
            {song.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-slate-900/80 border border-slate-800 px-2 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>

          <PreferenceToggle
            current={current}
            onChange={(pref) => setPref(song.id, pref)}
          />
        </div>
      </div>
    </li>
  );
}

function PreferenceToggle({
  current,
  onChange,
}: {
  current?: SongPreference;
  onChange: (pref: SongPreference | null) => void;
}) {
  function handleClick(pref: SongPreference) {
    if (current === pref) onChange(null);
    else onChange(pref);
  }

  const base =
    "px-2 py-1 rounded-full border text-[10px] sm:text-[11px] inline-flex items-center gap-1 cursor-pointer select-none";

  return (
    <div className="inline-flex items-center gap-1 bg-slate-900/80 rounded-full p-0.5 border border-slate-800/80">
      <button
        type="button"
        onClick={() => handleClick("must")}
        className={`${base} ${
          current === "must"
            ? "bg-emerald-500 text-slate-950 border-emerald-400"
            : "border-transparent text-emerald-300 hover:border-emerald-400/60"
        }`}
      >
        <Check className="w-3.5 h-3.5" />
        חייב
      </button>
      <button
        type="button"
        onClick={() => handleClick("like")}
        className={`${base} ${
          current === "like"
            ? "bg-pink-500 text-slate-950 border-pink-400"
            : "border-transparent text-pink-300 hover:border-pink-400/60"
        }`}
      >
        <Heart className="w-3.5 h-3.5" />
        אשמח
      </button>
      <button
        type="button"
        onClick={() => handleClick("block")}
        className={`${base} ${
          current === "block"
            ? "bg-red-500 text-slate-950 border-red-400"
            : "border-transparent text-red-300 hover:border-red-400/60"
        }`}
      >
        <Ban className="w-3.5 h-3.5" />
        לא
      </button>
    </div>
  );
}
