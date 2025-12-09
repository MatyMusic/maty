// src/components/ai/AiGlobalSearchPage.tsx
"use client";

import { useEffect, useState } from "react";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
type SearchHitSong = {
  id: string;
  title: string;
  artist?: string;
  cat?: string;
  tags?: string[];
  url?: string;
};

type SearchHitPost = {
  id: string;
  title: string;
  kind?: string;
  section?: string;
  slug?: string;
  excerpt?: string;
  url?: string;
};

type SearchHitProfile = {
  id: string;
  name: string;
  age?: number;
  city?: string;
  headline?: string;
  url?: string;
};

type SearchResponse = {
  ok: boolean;
  error?: string;
  q?: string;
  songs?: SearchHitSong[];
  posts?: SearchHitPost[];
  profiles?: SearchHitProfile[];
};

type Props = {
  initialQuery: string;
};

/* ─────────────────────────────────────────────
   דף חיפוש AI גלובלי על כל האתר (mode=search)
   ───────────────────────────────────────────── */
export default function AiGlobalSearchPage({ initialQuery }: Props) {
  const [query, setQuery] = useState(initialQuery || "");
  const [lastRunQuery, setLastRunQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "songs" | "posts" | "profiles"
  >("all");

  useEffect(() => {
    if (initialQuery && initialQuery.trim().length > 1) {
      handleSearch(initialQuery.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  async function handleSearch(raw: string) {
    const v = raw.trim();
    if (!v) return;

    setLoading(true);
    setErrorMsg(null);
    setLastRunQuery(v);

    try {
      const url = `/api/ai/search?q=${encodeURIComponent(v)}`;
      const r = await fetch(url, { cache: "no-store" });
      const j = (await r.json().catch(() => null)) as SearchResponse | null;

      if (!j || j.ok === false) {
        setErrorMsg(j?.error || "משהו השתבש בחיפוש. נסה שוב.");
        setResults(null);
      } else {
        setResults(j);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("שגיאה בחיבור לשרת. נסה שוב עוד רגע.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    handleSearch(query);
  }

  const songs = results?.songs ?? [];
  const posts = results?.posts ?? [];
  const profiles = results?.profiles ?? [];

  const totalCount = songs.length + posts.length + profiles.length;

  const showSongs = activeTab === "all" || activeTab === "songs";
  const showPosts = activeTab === "all" || activeTab === "posts";
  const showProfiles = activeTab === "all" || activeTab === "profiles";

  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50"
    >
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* כותרת עליונה */}
        <div className="mb-8 space-y-3 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-sky-300 to-fuchsia-300 bg-clip-text text-transparent">
            חיפוש AI על כל MATY-MUSIC
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto">
            כתוב מה שאתה מחפש – שירים, סטים, פוסטים, תכנים, MATY-DATE – והמערכת
            תנסה להביא לך הכול במקום אחד.
          </p>
        </div>

        {/* טופס חיפוש */}
        <form
          onSubmit={onSubmit}
          className="max-w-3xl mx-auto flex flex-col md:flex-row gap-3 mb-6"
        >
          <div className="relative flex-1">
            <input
              type="text"
              dir="rtl"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חפש: שירים לחתונה חב״ד, סט מזרחי, טיפים ל-DJ, פרופיל שידוכים…"
              className="w-full h-12 rounded-2xl bg-slate-900/70 border border-slate-600/60 px-4 pr-10 text-sm md:text-base outline-none focus:ring-2 focus:ring-emerald-400/70 focus:border-emerald-300/70 placeholder:text-slate-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center h-12 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-fuchsia-500 text-sm md:text-base font-extrabold shadow-lg shadow-emerald-500/30 hover:opacity-95 transition"
          >
            חפש עכשיו
          </button>
        </form>

        {/* שורת סטטוס / טאבים */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-300">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                מחפש בכל האתר…
              </span>
            ) : lastRunQuery ? (
              <span>
                תוצאות עבור{" "}
                <span className="font-bold text-emerald-300">
                  "{lastRunQuery}"
                </span>{" "}
                {totalCount > 0 && (
                  <span className="opacity-80">
                    – נמצא{" "}
                    <span className="font-bold tabular-nums">{totalCount}</span>{" "}
                    פריטים
                  </span>
                )}
              </span>
            ) : (
              <span className="opacity-70">
                טיפ: נסה לכתוב שאלה חכמה כמו{" "}
                <span className="text-emerald-300">
                  "סט שירים לפתיחת ריקודים בחתונה חב״ד"
                </span>
              </span>
            )}
          </div>

          {/* טאבים */}
          <div className="inline-flex items-center rounded-full bg-slate-900/70 border border-slate-700/70 p-1 text-xs md:text-sm">
            <TabButton
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
            >
              הכול{" "}
              {totalCount > 0 && (
                <span className="ml-1 tabular-nums">({totalCount})</span>
              )}
            </TabButton>
            <TabButton
              active={activeTab === "songs"}
              onClick={() => setActiveTab("songs")}
            >
              שירים{" "}
              {songs.length > 0 && (
                <span className="ml-1 tabular-nums">({songs.length})</span>
              )}
            </TabButton>
            <TabButton
              active={activeTab === "posts"}
              onClick={() => setActiveTab("posts")}
            >
              פוסטים / CLUB
              {posts.length > 0 && (
                <span className="ml-1 tabular-nums">({posts.length})</span>
              )}
            </TabButton>
            <TabButton
              active={activeTab === "profiles"}
              onClick={() => setActiveTab("profiles")}
            >
              MATY-DATE
              {profiles.length > 0 && (
                <span className="ml-1 tabular-nums">({profiles.length})</span>
              )}
            </TabButton>
          </div>
        </div>

        {/* הודעת שגיאה */}
        {errorMsg && (
          <div className="max-w-3xl mx-auto mb-4 rounded-2xl border border-rose-500/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {errorMsg}
          </div>
        )}

        {/* אין תוצאות */}
        {!loading && totalCount === 0 && lastRunQuery && !errorMsg && (
          <div className="max-w-3xl mx-auto mt-10 text-center text-slate-300 text-sm">
            לא נמצאו תוצאות מתאימות לביטוי{" "}
            <span className="font-bold text-emerald-300">"{lastRunQuery}"</span>
            .
            <br />
            נסה לכתוב פחות מילים, או מילות מפתח כלליות יותר (למשל:{" "}
            <span className="text-emerald-300">"סט חתונה מזרחי"</span>).
          </div>
        )}

        {/* תוצאות */}
        <div className="grid grid-cols-1 gap-6 mt-2">
          {/* שירים */}
          {showSongs && songs.length > 0 && (
            <section className="rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-slate-900/70 to-slate-950/80 p-4 md:p-5 shadow-lg shadow-emerald-500/20">
              <header className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base md:text-lg font-extrabold text-emerald-200 flex items-center gap-2">
                    🎵 שירים ופלייליסטים מתאימים
                  </h2>
                  <p className="text-xs md:text-sm text-slate-300/90">
                    שירים שמצאנו לפי השאלה שלך. אפשר לקפוץ ישר לנגן.
                  </p>
                </div>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {songs.map((s) => (
                  <SongCard key={s.id} song={s} />
                ))}
              </div>
            </section>
          )}

          {/* פוסטים */}
          {showPosts && posts.length > 0 && (
            <section className="rounded-3xl border border-sky-500/40 bg-gradient-to-b from-slate-900/70 to-slate-950/80 p-4 md:p-5 shadow-lg shadow-sky-500/20">
              <header className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base md:text-lg font-extrabold text-sky-200 flex items-center gap-2">
                    📝 פוסטים, מדריכים ו־MATY-CLUB / JAM / FIT
                  </h2>
                  <p className="text-xs md:text-sm text-slate-300/90">
                    תכנים שעוזרים לך לבנות סטים, להבין ציוד, או לקבל השראה.
                  </p>
                </div>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}

          {/* MATY-DATE */}
          {showProfiles && profiles.length > 0 && (
            <section className="rounded-3xl border border-rose-500/40 bg-gradient-to-b from-slate-900/70 to-slate-950/80 p-4 md:p-5 shadow-lg shadow-rose-500/20">
              <header className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base md:text-lg font-extrabold text-rose-200 flex items-center gap-2">
                    💞 פרופילים רלוונטיים ב־MATY-DATE
                  </h2>
                  <p className="text-xs md:text-sm text-slate-300/90">
                    פרופילים שיכולים להתאים למה שחיפשת (לפי גיל, עיר, כיוון).
                  </p>
                </div>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profiles.map((p) => (
                  <ProfileCard key={p.id} profile={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────
   כפתור טאב
   ───────────────────────────────────────────── */
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 h-8 md:h-9 rounded-full text-xs md:text-sm font-semibold transition whitespace-nowrap",
        active
          ? "bg-slate-800 text-emerald-300 shadow-sm shadow-emerald-500/30"
          : "text-slate-300 hover:bg-slate-800/60",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   כרטיס שיר
   ───────────────────────────────────────────── */
function SongCard({ song }: { song: SearchHitSong }) {
  const href = song.url || `/songs/${encodeURIComponent(song.id)}`;
  const badge = song.cat || (song.tags && song.tags[0]) || "שיר";

  return (
    <a
      href={href}
      className="group rounded-2xl border border-emerald-500/30 bg-slate-900/70 px-3 py-3 flex flex-col gap-1.5 hover:border-emerald-300/80 hover:bg-slate-900 transition shadow-sm hover:shadow-lg hover:shadow-emerald-500/25"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-bold text-emerald-100 truncate">
          {song.title}
        </div>
        <span className="inline-flex items-center px-2 h-6 rounded-full bg-emerald-500/15 text-[11px] font-semibold text-emerald-200 border border-emerald-500/40">
          {badge}
        </span>
      </div>
      {song.artist && (
        <div className="text-xs text-slate-300 truncate">
          מבצע: {song.artist}
        </div>
      )}
      {song.tags && song.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {song.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="inline-flex items-center px-2 h-5 rounded-full bg-slate-800/80 text-[10px] text-slate-200"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-300">
        <span className="inline-flex items-center gap-1">
          ▶<span>נגן עכשיו</span>
        </span>
        <span className="opacity-70 group-hover:translate-x-0.5 transition">
          כניסה לנגן →
        </span>
      </div>
    </a>
  );
}

/* ─────────────────────────────────────────────
   כרטיס פוסט / CLUB / JAM / FIT
   ───────────────────────────────────────────── */
function PostCard({ post }: { post: SearchHitPost }) {
  const href =
    post.url ||
    (post.slug
      ? `/${post.section || "club"}/${encodeURIComponent(post.slug)}`
      : "/club");

  return (
    <a
      href={href}
      className="group rounded-2xl border border-sky-500/30 bg-slate-900/70 px-3 py-3 flex flex-col gap-1.5 hover:border-sky-300/80 hover:bg-slate-900 transition shadow-sm hover:shadow-lg hover:shadow-sky-500/25"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-bold text-sky-100 truncate">
          {post.title}
        </div>
        {post.section && (
          <span className="inline-flex items-center px-2 h-6 rounded-full bg-sky-500/15 text-[11px] font-semibold text-sky-200 border border-sky-500/40">
            {post.section.toUpperCase()}
          </span>
        )}
      </div>
      {post.excerpt && (
        <div className="text-xs text-slate-200 line-clamp-2">
          {post.excerpt}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-[11px] text-sky-300">
        <span className="inline-flex items-center gap-1">
          🔎
          <span>פתח פוסט</span>
        </span>
        <span className="opacity-70 group-hover:translate-x-0.5 transition">
          קרא עוד →
        </span>
      </div>
    </a>
  );
}

/* ─────────────────────────────────────────────
   כרטיס פרופיל MATY-DATE
   ───────────────────────────────────────────── */
function ProfileCard({ profile }: { profile: SearchHitProfile }) {
  const href = profile.url || `/date/profile/${encodeURIComponent(profile.id)}`;

  return (
    <a
      href={href}
      className="group rounded-2xl border border-rose-500/30 bg-slate-900/70 px-3 py-3 flex flex-col gap-1.5 hover:border-rose-300/80 hover:bg-slate-900 transition shadow-sm hover:shadow-lg hover:shadow-rose-500/25"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-bold text-rose-100 truncate">
          {profile.name}
        </div>
        {profile.city && (
          <span className="inline-flex items-center px-2 h-6 rounded-full bg-rose-500/15 text-[11px] font-semibold text-rose-200 border border-rose-500/40">
            {profile.city}
          </span>
        )}
      </div>
      {(profile.age || profile.headline) && (
        <div className="text-xs text-slate-200 line-clamp-2">
          {profile.age && <span>{profile.age} • </span>}
          {profile.headline}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-[11px] text-rose-300">
        <span className="inline-flex items-center gap-1">
          💞
          <span>פתח פרופיל</span>
        </span>
        <span className="opacity-70 group-hover:translate-x-0.5 transition">
          כניסה ל־MATY-DATE →
        </span>
      </div>
    </a>
  );
}
