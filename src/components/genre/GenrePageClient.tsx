// src/components/genre/GenrePageClient.tsx
"use client";

import CloudinaryUploadButton from "@/components/admin/CloudinaryUploadButton";
import * as React from "react";

type CatKey = "chabad" | "mizrahi" | "soft" | "fun";

type Props = {
  cat: CatKey;
  title: string;
};

type Track = {
  id: string;
  title: string;
  artist: string;
  src: string;
  cover?: string;
  likes?: number;
};

type SavedMedia = {
  kind: "image" | "video" | "audio";
  title?: string;
  publicId: string;
  url: string;
  thumbUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  tags?: string[];
};

type Comment = { id: string; text: string; at: string };

type ApiTrackFromTracksApi = {
  id?: string;
  _id?: string;
  title?: string;
  artist?: string;
  coverUrl?: string;
  cover?: string;
  audioUrl?: string;
  externalUrl?: string;
  likes?: number;
};

// נגזרת – מבנה לנגן הגלובלי
type MiniTrack = {
  id: string;
  title: string;
  artist: string;
  src?: string;
  cover?: string;
  link?: string;
};

function isBrowserAdmin(): boolean {
  if (typeof window === "undefined") return false;
  const html = document.documentElement;
  if (html.dataset.admin === "1") return true;
  if ((window as any).__MM_IS_ADMIN__ === true) return true;
  return false;
}

export default function GenrePageClient({ cat, title }: Props) {
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  const [isAdmin, setIsAdmin] = React.useState(false);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // לייקים ותגובות
  const [likes, setLikes] = React.useState<Record<string, number>>({});
  const [liked, setLiked] = React.useState<Record<string, boolean>>({});
  const [commentsByTrack, setCommentsByTrack] = React.useState<
    Record<string, Comment[]>
  >({});
  const [commentText, setCommentText] = React.useState("");
  const [showComments, setShowComments] = React.useState(false);
  const [shareMsg, setShareMsg] = React.useState<string | null>(null);

  // זיהוי אדמין בצד לקוח
  React.useEffect(() => {
    setIsAdmin(isBrowserAdmin());
  }, []);

  // נגזרת – תור לנגן הגלובלי
  const queueForPlayer: MiniTrack[] = React.useMemo(
    () =>
      tracks.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        src: t.src,
        cover: t.cover,
        link: undefined,
      })),
    [tracks],
  );

  function emitPlayToGlobal(track: Track | null) {
    if (!track || typeof window === "undefined") return;
    const mini: MiniTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      src: track.src,
      cover: track.cover,
      link: undefined,
    };
    const queue = queueForPlayer;

    window.dispatchEvent(
      new CustomEvent("mm:play", { detail: { track: mini, queue } }),
    );
  }

  // פונקציה לטעינת שירים מה-API החדש (/api/tracks)
  const loadTracks = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ❗ בלי featured=1 – נביא את כל השירים בז'אנר
      const res = await fetch(
        `/api/tracks?genre=${encodeURIComponent(cat)}&limit=80`,
        {
          cache: "no-store",
        },
      );
      if (!res.ok) throw new Error("tracks " + res.status);

      const data = (await res.json().catch(() => ({}))) as {
        items?: ApiTrackFromTracksApi[];
        rows?: ApiTrackFromTracksApi[];
      };

      const raw = (data.items || data.rows || []) as ApiTrackFromTracksApi[];

      const initialLikes: Record<string, number> = {};

      const mapped: Track[] = raw
        .map((t) => {
          if (!t || !t.audioUrl) return null;
          const id = String(t.id || t._id || t.title || Math.random());
          const l = Number(t.likes ?? 0);
          initialLikes[id] = Number.isFinite(l) ? l : 0;

          return {
            id,
            title: String(t.title || "Untitled"),
            artist: String(t.artist || "Maty Music"),
            src: String(t.audioUrl),
            cover: t.coverUrl || t.cover || defaultCoverForCat(cat),
            likes: initialLikes[id],
          } as Track;
        })
        .filter(Boolean) as Track[];

      setTracks(mapped);
      setLikes(initialLikes);
      setCurrentIndex(0);
      setIsPlaying(false);
      setProgress(0);
      setDuration(0);
    } catch (err: any) {
      console.error("[GenrePageClient] error:", err);
      setError("לא הצלחתי לטעון שירים כרגע. נסה לרענן את הדף בעוד רגע.");
    } finally {
      setLoading(false);
    }
  }, [cat]);

  // טעינה ראשונית / שינוי קטגוריה
  React.useEffect(() => {
    void loadTracks();
  }, [loadTracks]);

  const current = tracks[currentIndex] || null;

  // שליטה על הנגן – עדכון src בכל פעם שהשיר משתנה
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (current) {
      audio.src = current.src;
      audio.load();
      if (isPlaying) {
        audio.play().catch(() => {
          setIsPlaying(false);
        });
      }
      // לסנכרן גם את הנגן הגלובלי
      emitPlayToGlobal(current);
    } else {
      audio.pause();
      setIsPlaying(false);
      setProgress(0);
      setDuration(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, current?.id]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleNext = () => {
    if (!tracks.length) return;
    setCurrentIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (!tracks.length) return;
    setCurrentIndex((prev) => (prev === 0 ? tracks.length - 1 : prev - 1));
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setProgress(audio.currentTime);
    setDuration(audio.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const value = Number(e.target.value) || 0;
    audio.currentTime = value;
    setProgress(value);
  };

  const handleEnded = () => {
    if (!tracks.length) return;
    setCurrentIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  };

  // ====== לייק ======
  const handleToggleLike = React.useCallback((track: Track | null) => {
    if (!track) return;
    const id = track.id;

    setLiked((prevLiked) => {
      const nextLiked = !prevLiked[id];

      setLikes((prevLikes) => ({
        ...prevLikes,
        [id]: (prevLikes[id] || 0) + (nextLiked ? 1 : -1),
      }));

      // קריאה אופציונלית ל-API (אם תממש בשרת)
      void fetch("/api/music/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: id, like: nextLiked }),
      }).catch(() => {});

      return { ...prevLiked, [id]: nextLiked };
    });
  }, []);

  // ====== שיתוף ======
  const handleShare = React.useCallback(async (track: Track | null) => {
    if (!track || typeof window === "undefined") return;
    const url = window.location.href;
    const titleText = `${track.title} – ${track.artist}`;
    setShareMsg(null);

    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: titleText, url });
        setShareMsg("השיתוף נשלח ✅");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareMsg("קישור הועתק ללוח.");
      } else {
        setShareMsg("אי אפשר לשתף בדפדפן הזה, נסה להעתיק ידנית.");
      }
    } catch {
      setShareMsg("השיתוף בוטל או נכשל.");
    }
    setTimeout(() => setShareMsg(null), 3000);
  }, []);

  // ====== תגובות לוקאליות ======
  const handleAddComment = React.useCallback(
    (track: Track | null) => {
      if (!track) return;
      const text = commentText.trim();
      if (!text) return;
      const id = track.id;
      const c: Comment = {
        id: `${id}-${Date.now().toString(36)}`,
        text,
        at: new Date().toLocaleString("he-IL"),
      };
      setCommentsByTrack((prev) => ({
        ...prev,
        [id]: [...(prev[id] || []), c],
      }));
      setCommentText("");
    },
    [commentText],
  );

  // ====== אזור אדמין – העלאה ושמירה ל-Mongo דרך /api/admin/tracks ======
  const [uploadMsg, setUploadMsg] = React.useState<string | null>(null);
  const [savingFromUpload, setSavingFromUpload] = React.useState(false);

  const handleMediaUploaded = React.useCallback(
    async (media: SavedMedia) => {
      if (!media || !media.publicId) return;

      if (media.kind !== "audio") {
        alert("הקובץ שהועלה אינו מזוהה כאודיו. ודא שהעלית mp3 / wav וכו׳.");
        return;
      }

      setSavingFromUpload(true);
      setUploadMsg("מעלה ושומר את השיר במסד הנתונים…");

      try {
        const body = {
          title: media.title || media.publicId.split("/").pop() || "Track",
          artist: "Maty Music",
          category: cat, // TrackCategory: "chabad" | "mizrahi" | "soft" | "fun"
          audioUrl: media.url,
          coverUrl: media.thumbUrl || defaultCoverForCat(cat),
          mediaPublicId: media.publicId,
          duration: Number(media.duration || 0) || 0,
          published: true,
          featured: false,
          order: 0,
          tags: [cat],
          externalUrl: "",
        };

        const res = await fetch("/api/admin/tracks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const j = await res.json().catch(() => ({}) as any);

        if (!res.ok || !j?.ok) {
          throw new Error(j?.error || `HTTP ${res.status}`);
        }

        setUploadMsg(
          `השיר "${body.title}" נשמר בהצלחה בקטגוריה ${catLabel(cat)}.`,
        );
        await loadTracks();
      } catch (e: any) {
        console.error("[GenrePageClient] handleMediaUploaded error:", e);
        alert("שמירת טראק נכשלה: " + (e?.message || "unknown"));
        setUploadMsg("אירעה שגיאה בשמירת השיר.");
      } finally {
        setSavingFromUpload(false);
      }
    },
    [cat, loadTracks],
  );

  const currentLikes = current ? likes[current.id] || 0 : 0;
  const currentComments = current ? commentsByTrack[current.id] || [] : [];

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50"
      dir="rtl"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:py-10">
        {/* כותרת */}
        <header className="space-y-1 text-right">
          <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
          <p className="text-sm md:text-base opacity-75">
            נגן שירים לפי ז׳אנר: {title}.{" "}
            {isAdmin
              ? "כאן אתה יכול להעלות שירים לקטגוריה הזו, הם יישמרו ב־MongoDB ויופיעו בכל האתר דרך /api/tracks."
              : "בחר שיר מהרשימה כדי לנגן אותו."}
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] md:items-start">
          {/* נגן מרכזי */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            {/* אודיו אמיתי – BeatTap מחפש את האלמנט הזה */}
            <audio
              id="pro-player-audio"
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
              onEnded={handleEnded}
            />

            {loading ? (
              <div className="flex h-40 items-center justify-center text-sm opacity-70">
                טוען שירים...
              </div>
            ) : error ? (
              <div className="flex h-40 items-center justify-center text-center text-sm text-red-300">
                {error}
              </div>
            ) : !current ? (
              <div className="flex h-40 items-center justify-center text-sm opacity-70">
                אין עדיין שירים לקטגוריה הזו.
                {isAdmin && " כאדמין אפשר להעלות שירים בחלק הימני."}
              </div>
            ) : (
              <>
                {/* אזור השיר הנוכחי */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-black/40">
                    {current.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={current.cover}
                        alt={current.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <GeneratedCover title={current.title} />
                    )}
                  </div>

                  <div className="flex-1 space-y-1 text-right">
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
                      {catLabel(cat)}
                    </div>
                    <h2 className="text-lg font-bold md:text-xl">
                      {current.title}
                    </h2>
                    <p className="text-xs md:text-sm opacity-80">
                      {current.artist}
                    </p>
                  </div>
                </div>

                {/* קו התקדמות */}
                <div className="mt-4 space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.5}
                    value={progress}
                    onChange={handleSeek}
                    className="w-full accent-violet-400"
                  />
                  <div className="flex items-center justify-between text-[11px] opacity-75">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* כפתורי שליטה בסיסיים */}
                <div className="mt-4 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={!tracks.length}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-xs hover:border-violet-400/70 hover:text-violet-200 disabled:opacity-40"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    disabled={!current}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500 text-base font-bold text-white shadow hover:bg-violet-400 disabled:opacity-40"
                  >
                    {isPlaying ? "⏸" : "▶"}
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!tracks.length}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-xs hover:border-violet-400/70 hover:text-violet-200 disabled:opacity-40"
                  >
                    ▶
                  </button>
                </div>

                {/* כפתורי אקשן נוספים: לייק / שיתוף / הורדה / תגובות */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(current)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 border text-xs ${
                        liked[current.id]
                          ? "border-pink-400 bg-pink-500/20 text-pink-100"
                          : "border-white/20 bg-black/40 hover:border-pink-300/80"
                      }`}
                    >
                      <span>{liked[current.id] ? "♥" : "♡"}</span>
                      <span>{currentLikes || 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShare(current)}
                      className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs hover:border-violet-300/70"
                    >
                      🔗 שתף
                    </button>

                    {current?.src && (
                      <a
                        href={current.src}
                        download
                        className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs hover:border-emerald-300/70"
                      >
                        ⬇ הורדה
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowComments((v) => !v)}
                      className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs hover:border-sky-300/70"
                    >
                      💬 תגובות ({currentComments.length})
                    </button>
                  </div>

                  <div className="text-[10px] opacity-70">
                    {current && `שיר ${currentIndex + 1} מתוך ${tracks.length}`}
                  </div>
                </div>

                {shareMsg && (
                  <div className="mt-1 text-[10px] text-center opacity-80">
                    {shareMsg}
                  </div>
                )}

                {/* פאנל תגובות לוקאלי */}
                {showComments && current && (
                  <div className="mt-3 rounded-2xl border border-white/15 bg-black/30 p-3 text-[11px]">
                    <div className="mb-11 font-semibold">תגובות לשיר הזה</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 rounded-xl border border-white/20 bg-black/40 px-2 py-1 text-[11px] outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-300/60"
                        placeholder="כתוב תגובה (לוקאלית, לא נשמר בשרת)…"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(current)}
                        className="rounded-xl bg-sky-400 px-3 py-1 text-[11px] font-bold text-black hover:bg-sky-300"
                      >
                        שלח
                      </button>
                    </div>
                    <div className="mt-2 max-h-32 space-y-1 overflow-y-auto pr-1">
                      {!currentComments.length ? (
                        <div className="opacity-60">
                          אין תגובות עדיין. תהיה הראשון להגיב 🙂
                        </div>
                      ) : (
                        currentComments.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-xl bg-white/5 px-2 py-1"
                          >
                            <div className="text-[10px] opacity-60">{c.at}</div>
                            <div>{c.text}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* רשימת שירים */}
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-right">
                רשימת שירים
              </h3>
              {!tracks.length ? (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-center text-xs opacity-70">
                  אין עדיין שירים להצגה.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto pr-1">
                  <ul className="space-y-1.5">
                    {tracks.map((t, idx) => {
                      const active = idx === currentIndex;
                      return (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentIndex(idx);
                              setIsPlaying(true);
                              emitPlayToGlobal(t);
                            }}
                            className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-xs transition ${
                              active
                                ? "bg-violet-500/20 text-violet-100 border border-violet-400/60"
                                : "bg-black/30 border border-white/5 hover:border-violet-300/60 hover:text-violet-100"
                            }`}
                          >
                            <span className="flex-1 truncate text-right">
                              {t.title}
                            </span>
                            <span className="ml-2 shrink-0 opacity-70">
                              {active ? "מנגן" : "נגן"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* אזור אדמין – העלאת שירים שנשמרים ל-DB */}
          {isAdmin && (
            <aside className="rounded-3xl border border-amber-300/40 bg-amber-50/10 p-4 text-right shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
              <h2 className="text-sm font-bold text-amber-100 md:text-base">
                אזור אדמין · הוספת שירים לקטגוריה הזו
              </h2>
              <p className="mt-1 text-[11px] text-amber-50 opacity-80">
                העלה כאן קובץ אודיו (mp3 / wav). השיר יישמר אוטומטית ב־MongoDB
                דרך{" "}
                <code className="mx-1 rounded bg-black/40 px-1 text-[10px]">
                  /api/admin/tracks
                </code>{" "}
                ויופיע בדף הזה ובכל מקום שמשתמש ב־{" "}
                <code className="mx-1 rounded bg-black/40 px-1 text-[10px]">
                  /api/tracks?genre={cat}
                </code>
                .
              </p>

              <div className="mt-3 space-y-2 text-[11px]">
                <div>
                  <label className="mb-1 block opacity-80">
                    העלאת קובץ אודיו (Cloudinary)
                  </label>
                  <CloudinaryUploadButton
                    label={
                      savingFromUpload ? "שומר…" : "העלה אודיו לקטגוריה זו"
                    }
                    className="mm-btn mm-pressable"
                    multiple={false}
                    tags={["track", "audio", cat]}
                    folder="maty-music/audio"
                    onSuccess={handleMediaUploaded}
                    onUploaded={() => {
                      /* כבר שומר ב-onSuccess */
                    }}
                  />
                  {uploadMsg && (
                    <div className="mt-1 text-[11px] text-amber-100">
                      {uploadMsg}
                    </div>
                  )}
                </div>

                <p className="mt-2 text-[10px] text-amber-50 opacity-70">
                  לניהול מתקדם (סדר, מובלט, פרסום, חיפוש וכו׳) מומלץ גם להשתמש
                  במסך{" "}
                  <code className="rounded bg-black/40 px-1 text-[10px]">
                    /songs/manage/music
                  </code>
                  .
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== עוזרים קטנים =====
function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function defaultCoverForCat(cat: CatKey): string {
  switch (cat) {
    case "chabad":
      return "/assets/images/avatar-chabad.png";
    case "mizrahi":
      return "/assets/images/avatar-mizrahi.png";
    case "soft":
      return "/assets/images/avatar-soft.png";
    case "fun":
    default:
      return "/assets/images/avatar-fun.png";
  }
}

function catLabel(cat: CatKey): string {
  switch (cat) {
    case "chabad":
      return "חסידי (חב״ד)";
    case "mizrahi":
      return "מזרחי";
    case "soft":
      return "שקט";
    case "fun":
    default:
      return "מקפיץ";
  }
}

/** קאבר אוטומטי: גרדיאנט + אות ראשונה של השם */
function GeneratedCover({ title }: { title: string }) {
  const trimmed = (title || "").trim();
  const letter = trimmed ? trimmed[0]?.toUpperCase() : "♪";
  const hash = Array.from(trimmed).reduce(
    (acc, ch) => acc + ch.charCodeAt(0),
    0,
  );
  const hue = hash % 360;
  const bg = `linear-gradient(135deg, hsl(${hue},80%,55%), hsl(${
    (hue + 40) % 360
  },80%,45%))`;

  return (
    <div
      className="flex h-full w-full items-center justify-center text-4xl font-extrabold text-white"
      style={{ background: bg }}
    >
      {letter || "♪"}
    </div>
  );
}
