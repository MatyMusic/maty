// src/components/ProPlayer.tsx
"use client";

import type { MiniTrack as Track } from "@/components/MiniPlayer";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ========= עוזרים =========
const fmt = (s: number) =>
  !isFinite(s)
    ? "0:00"
    : `${Math.floor(s / 60)}:${Math.floor(s % 60)
        .toString()
        .padStart(2, "0")}`;

const uniqPush = (arr: Track[], t: Track) =>
  arr.some((x) => x.id === t.id) ? arr : [...arr, t];
const upsertManyUnique = (arr: Track[], list: Track[]) => {
  const seen = new Set(arr.map((x) => x.id));
  const out = [...arr];
  for (const t of list)
    if (!seen.has(t.id)) {
      out.push(t);
      seen.add(t.id);
    }
  return out;
};

// normalizers: מאיפה מנגנים? ומה נפתח חיצונית?
function normSrc(t?: Track): string | undefined {
  // תומך בשדות שונים: src | url | spotify.preview_url
  // @ts-expect-error – קיים בחלק מהדאטה
  return t?.src || t?.url || t?.spotify?.preview_url || undefined;
}
function normArtist(t?: Track): string {
  // @ts-expect-error – חלק מהאובייקטים מחזיקים artists[]
  if (!t) return "";
  if (typeof t.artist === "string" && t.artist) return t.artist;
  if (Array.isArray((t as any).artists) && (t as any).artists.length) {
    return (t as any).artists.filter(Boolean).join(", ");
  }
  return "";
}
function normExternal(t?: Track): string | undefined {
  if (!t) return undefined;
  // עדיפות ל־YouTube
  // @ts-expect-error – youtube.id אופציונלי
  const ytId = t?.youtube?.id;
  if (ytId && /^[A-Za-z0-9_-]{11}$/.test(ytId))
    return `https://www.youtube.com/watch?v=${ytId}`;
  if (t.link && /youtu/.test(t.link)) return t.link;
  return t.link || undefined;
}

const LS_QUEUE = "mm_queue_v1";
const LS_VOL = "mm_volume";
const LS_IDX = "mm_queue_index";

type Props = { initialQueue?: Track[] };

export default function ProPlayer({ initialQueue = [] }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const outerRef = useRef<HTMLDivElement | null>(null);

  const [queue, setQueue] = useState<Track[]>(initialQueue);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState<boolean>(initialQueue.length > 0);
  const [mounted, setMounted] = useState(false);

  const track = queue[index];
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [volume, setVolume] = useState<number>(0.9);
  const [repeat, setRepeat] = useState<false | "one" | "all">(false);
  const [shuffle, setShuffle] = useState<boolean>(false);

  // ====== טעינת סטייט מהדפדפן ======
  useEffect(() => {
    setMounted(true);

    try {
      const rawQ = localStorage.getItem(LS_QUEUE);
      if (rawQ) {
        const saved: Track[] = JSON.parse(rawQ);
        if (Array.isArray(saved) && saved.length) {
          setQueue((q) => (q.length ? upsertManyUnique(q, saved) : saved));
        }
      }
      const rawIdx = localStorage.getItem(LS_IDX);
      if (rawIdx) {
        const i = Number(rawIdx);
        if (Number.isFinite(i) && i >= 0) setIndex(i);
      }
    } catch {}

    try {
      const rawV = localStorage.getItem(LS_VOL);
      const v = rawV ? Number(rawV) : 0.9;
      if (Number.isFinite(v)) setVolume(Math.min(1, Math.max(0, v)));
    } catch {}
  }, []);

  // שמירה
  useEffect(() => {
    try {
      localStorage.setItem(LS_QUEUE, JSON.stringify(queue));
    } catch {}
    try {
      localStorage.setItem(LS_IDX, String(index));
    } catch {}
    setOpen(queue.length > 0 || playing);
  }, [queue, playing, index]);

  // safe-area + class ל-body
  useEffect(() => {
    const apply = () => {
      const h = open ? (outerRef.current?.offsetHeight ?? 96) : 0;
      document.documentElement.style.setProperty("--player-h", `${h}px`);
      document.body.classList.toggle("player-open", open);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      document.documentElement.style.setProperty("--player-h", "0px");
      document.body.classList.remove("player-open");
    };
  }, [open, queue.length]);

  // ====== ניווט ======
  const handleNext = useCallback(() => {
    setIndex((i) => {
      if (!queue.length) return 0;
      if (repeat === "one") return i; // נשארים על אותו שיר
      if (shuffle) {
        const r = Math.floor(Math.random() * queue.length);
        return r === i && queue.length > 1 ? (r + 1) % queue.length : r;
      }
      if (i + 1 < queue.length) return i + 1;
      return repeat === "all" ? 0 : i; // אם אין repeat all – נעצור ב־onEnded
    });
  }, [queue.length, repeat, shuffle]);

  const handlePrev = useCallback(() => {
    setIndex((i) => {
      if (!queue.length) return 0;
      if (shuffle) {
        const r = Math.floor(Math.random() * queue.length);
        return r;
      }
      return i > 0 ? i - 1 : repeat === "all" ? queue.length - 1 : 0;
    });
  }, [queue.length, repeat, shuffle]);

  const seekBy = useCallback((delta: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.min(
      Math.max(0, el.currentTime + delta),
      el.duration || el.currentTime,
    );
    setT(el.currentTime);
  }, []);

  const seekTo = useCallback((secs: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.min(Math.max(0, secs), el.duration || secs);
    setT(el.currentTime);
  }, []);

  // ====== פתיחת מקור חיצוני (YouTube/וכו') ======
  const openExternal = useCallback((t?: Track) => {
    const ext = normExternal(t);
    if (ext) window.open(ext, "_blank", "noopener,noreferrer");
  }, []);

  // ====== הפעלה/השהיה ======
  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play()
        .then(() => {
          setPlaying(true);
          if (track)
            window.dispatchEvent(
              new CustomEvent("mm:mini:play", {
                detail: { id: `pro-${track.id}` },
              }),
            );
        })
        .catch((err: any) => {
          // Autoplay חסום? בקשת הקלקה שניה; אם שגיאה אמיתית – פתיחה חיצונית
          if (err?.name === "NotAllowedError") return;
          openExternal(track);
        });
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [track, openExternal]);

  // ====== אודיו + Media Session + נפילות ליוטיוב ======
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoaded = () => setDur(el.duration || 0);
    const onTime = () => {
      setT(el.currentTime || 0);
      try {
        // @ts-expect-error
        const ms: MediaSession | undefined = (navigator as any).mediaSession;
        if (ms && Number.isFinite(el.duration)) {
          ms.setPositionState?.({
            duration: el.duration,
            playbackRate: 1,
            position: el.currentTime,
          });
        }
      } catch {}
    };
    const onEnded = () => {
      if (repeat === "one") {
        el.currentTime = 0;
        el.play().catch(() => {});
        return;
      }
      if (index === queue.length - 1 && repeat !== "all" && !shuffle) {
        setPlaying(false);
        return;
      }
      handleNext();
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => {
      // אם קובץ לא רץ — נעבור ללינק חיצוני (יוטיוב)
      openExternal(track);
    };
    const onStalled = () => {
      // קרה תקיעה? ננסה אחרי 2 שניות לגבות ליוטיוב
      setTimeout(() => {
        if (el.readyState < 2) openExternal(track);
      }, 2000);
    };

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("error", onError);
    el.addEventListener("stalled", onStalled);

    el.volume = volume;

    const src = normSrc(track);
    if (src) {
      if (el.src !== src) {
        el.src = src;
        el.load();
      }
      // Media Session
      try {
        // @ts-expect-error
        const ms: MediaSession | undefined = (navigator as any).mediaSession;
        if (ms && track) {
          ms.metadata = new window.MediaMetadata({
            title: track.title ?? "Untitled",
            artist: normArtist(track),
            album: "MATY MUSIC",
            artwork: track.cover
              ? [{ src: track.cover, sizes: "512x512", type: "image/png" }]
              : undefined,
          });
          ms.setActionHandler?.("play", () => togglePlay());
          ms.setActionHandler?.("pause", () => togglePlay());
          ms.setActionHandler?.("previoustrack", () => handlePrev());
          ms.setActionHandler?.("nexttrack", () => handleNext());
          ms.setActionHandler?.("seekbackward", (d: any) =>
            seekBy(-(d?.seekOffset ?? 10)),
          );
          ms.setActionHandler?.("seekforward", (d: any) =>
            seekBy(d?.seekOffset ?? 10),
          );
          ms.setActionHandler?.("seekto", (d: any) => {
            if (typeof d?.seekTime === "number") seekTo(d.seekTime);
          });
          ms.playbackState = playing ? "playing" : "paused";
        }
      } catch {}
    } else {
      // אין src – נעבור ישר לחיצוני אם יש
      el.removeAttribute("src");
      try {
        el.pause();
      } catch {}
      setPlaying(false);
      setDur(0);
      setT(0);
      if (normExternal(track)) openExternal(track);
    }

    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("error", onError);
      el.removeEventListener("stalled", onStalled);
    };
  }, [
    track,
    volume,
    playing,
    index,
    queue.length,
    handleNext,
    handlePrev,
    seekBy,
    seekTo,
    togglePlay,
    openExternal,
    repeat,
    shuffle,
  ]);

  // המשך אוטומטי כאשר index משתנה תוך כדי ניגון
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !track) return;
    if (playing) {
      el.play().catch((err) => {
        if (err?.name !== "NotAllowedError") openExternal(track);
      });
      window.dispatchEvent(
        new CustomEvent("mm:mini:play", { detail: { id: `pro-${track.id}` } }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // קיצורי מקלדת
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag && /input|textarea|select/.test(tag)) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") seekBy(5);
      else if (e.code === "ArrowLeft") seekBy(-5);
      else if (e.code === "ArrowUp") setVolume((v) => Math.min(1, v + 0.05));
      else if (e.code === "ArrowDown") setVolume((v) => Math.max(0, v - 0.05));
      else if (e.key.toLowerCase() === "n") handleNext();
      else if (e.key.toLowerCase() === "p") handlePrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [seekBy, togglePlay, handleNext, handlePrev]);

  // אירועים גלובליים (מכרטיסים/קומפוננטות באתר)
  useEffect(() => {
    const onPlayEvt = (e: any) => {
      const tr: Track | undefined = e?.detail?.track;
      const q: Track[] | undefined = e?.detail?.queue;
      if (!tr) return;

      setQueue((old) => {
        let base = old;
        if (q?.length) base = upsertManyUnique(old, q);
        base = uniqPush(base, tr);
        const ix = base.findIndex((x) => x.id === tr.id);
        setIndex(ix === -1 ? base.length - 1 : ix);
        return base;
      });
      setOpen(true);
      setPlaying(true);
    };

    const onAddEvt = (e: any) => {
      const tr: Track | undefined = e?.detail?.track;
      if (!tr) return;
      setQueue((old) => uniqPush(old, tr));
      setOpen(true);
    };

    const onClear = () => {
      setQueue([]);
      setIndex(0);
      setPlaying(false);
      setOpen(false);
    };

    window.addEventListener("mm:play", onPlayEvt as EventListener);
    window.addEventListener("mm:queue:add", onAddEvt as EventListener);
    window.addEventListener("mm:queue:clear", onClear as EventListener);
    return () => {
      window.removeEventListener("mm:play", onPlayEvt as EventListener);
      window.removeEventListener("mm:queue:add", onAddEvt as EventListener);
      window.removeEventListener("mm:queue:clear", onClear as EventListener);
    };
  }, []);

  // ווליום -> אודיו + שמירה
  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = volume;
    try {
      localStorage.setItem(LS_VOL, String(volume));
    } catch {}
  }, [volume]);

  const progress = useMemo(() => (dur ? (t / dur) * 100 : 0), [t, dur]);

  // SSR guard
  if (!mounted) return null;

  // "בועית" מזער אם סגור אבל יש תור/ניגון
  if (!open && (playing || queue.length > 0)) {
    const mini = queue[index];
    return (
      <button
        dir="rtl"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border bg-white/80 dark:bg-neutral-900/80 backdrop-blur shadow-xl border-black/10 dark:border-white/10 px-3 py-2"
        aria-label="פתח נגן"
      >
        <div className="relative h-8 w-8 overflow-hidden rounded-full border border-black/10 dark:border-white/10">
          <Image
            src={mini?.cover ?? "/icon.svg"}
            alt=""
            fill
            sizes="32px"
            className="object-cover"
          />
        </div>
        <span className="max-w-[160px] truncate text-sm">
          {mini?.title ?? "נגן"}
        </span>
        <span className="text-lg">▲</span>
      </button>
    );
  }

  // אין תור ואין ניגון – לא לצייר
  if (!open && !playing && queue.length === 0) return null;

  return (
    <div
      dir="rtl"
      ref={outerRef}
      className="fixed bottom-4 right-4 z-40 w-[min(560px,calc(100vw-2rem))] rounded-2xl border bg-white/80 dark:bg-neutral-900/80 backdrop-blur shadow-xl border-black/10 dark:border-white/10"
    >
      {/* 👇 חשוב ל־BeatTap */}
      <audio
        id="pro-player-audio"
        ref={audioRef}
        preload="metadata"
        playsInline
      />

      {/* פס התקדמות */}
      <div className="relative h-1 overflow-hidden rounded-t-2xl bg-black/5 dark:bg-white/10">
        <div
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-violet-600 to-pink-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-3 md:p-4 flex items-center gap-3">
        {/* עטיפה */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          <Image
            src={track?.cover ?? "/assets/logo/maty-music-wordmark.svg"}
            alt={track?.title ?? "Track cover"}
            fill
            sizes="56px"
            className="object-cover"
            priority={false}
          />
        </div>

        {/* פרטים + Seek */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm md:text-base font-semibold">
            {track?.title ?? "—"}
          </div>
          <div className="truncate text-xs md:text-sm opacity-70">
            {normArtist(track)}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] tabular-nums opacity-70">
              {fmt(t)}
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(1, dur || 0)}
              value={Math.min(t, dur || 0)}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="flex-1 accent-violet-600"
              aria-label="Seek"
            />
            <span className="text-[10px] tabular-nums opacity-70">
              {fmt(dur)}
            </span>
          </div>
        </div>

        {/* שליטה */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Shuffle */}
          <button
            className={`grid h-9 w-9 place-items-center rounded-full border hover:bg-black/5 dark:hover:bg-white/5 ${
              shuffle ? "bg-black/10 dark:bg-white/10" : ""
            }`}
            onClick={() => setShuffle((s) => !s)}
            title="Shuffle"
            aria-pressed={shuffle}
          >
            🔀
          </button>

          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
            onClick={handlePrev}
            title="שיר קודם (P)"
            aria-label="Previous"
          >
            <span className="inline-block rotate-180">⏭️</span>
          </button>

          <button
            className="grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 shadow"
            onClick={togglePlay}
            title={playing ? "Pause (Space)" : "Play (Space)"}
            aria-pressed={playing}
          >
            {playing ? (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 md:h-6 md:w-6"
                fill="currentColor"
              >
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 md:h-6 md:w-6"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7-11-7z" />
              </svg>
            )}
          </button>

          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
            onClick={handleNext}
            title="שיר הבא (N)"
            aria-label="Next"
          >
            ⏭️
          </button>

          {/* Repeat */}
          <button
            className={`grid h-9 w-9 place-items-center rounded-full border hover:bg-black/5 dark:hover:bg-white/5 ${
              repeat ? "bg-black/10 dark:bg-white/10" : ""
            }`}
            onClick={() =>
              setRepeat((r) =>
                r === false ? "all" : r === "all" ? "one" : false,
              )
            }
            title={`Repeat: ${
              repeat === false ? "Off" : repeat === "all" ? "All" : "One"
            }`}
            aria-pressed={!!repeat}
          >
            {repeat === "one" ? "🔂" : "🔁"}
          </button>

          {/* פתיחה חיצונית אם יש */}
          {normExternal(track) ? (
            <a
              href={normExternal(track)}
              target="_blank"
              className="ml-1 grid h-9 px-3 place-items-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 underline"
              rel="noopener noreferrer"
              title="פתח במקור (YouTube)"
            >
              YouTube
            </a>
          ) : null}

          {/* מזער/ניקוי */}
          <button
            className="ml-1 grid h-9 w-9 place-items-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
            onClick={() => setOpen(false)}
            title="מזער"
            aria-label="Minimize"
          >
            ⤢
          </button>
          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
            onClick={() => {
              setQueue([]);
              setIndex(0);
              setPlaying(false);
              setOpen(false);
              dispatchEvent(new Event("mm:queue:clear"));
            }}
            title="נקה תור"
            aria-label="Clear queue"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ווליום */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-70">ווליום</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 accent-violet-600"
            aria-label="Volume"
          />
          <span className="text-xs tabular-nums w-10 text-right opacity-70">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
