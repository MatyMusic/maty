"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

/**
 * ProPlayer – נגן גלובלי אחד לכל האתר
 * - <audio id="pro-player-audio"> כדי ש-BeatTap יתחבר אליו
 * - מאזין לאירוע window: "mm:player:play" עם detail { src, title?, coverUrl? }
 */
export default function ProPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string>("");
  const [title, setTitle] = useState<string>("Playing…");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    const onPlayReq = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const a = audioRef.current;
      if (!a || !d?.src) return;
      try {
        setSrc(d.src);
        setTitle(d.title || d.src.split("/").pop() || "Track");
        setCoverUrl(d.coverUrl || null);
        setOpen(true);

        // טעינה מחדש ואז ניגון
        a.src = d.src;
        a.currentTime = 0;
        a.play()
          .then(() => setPaused(false))
          .catch(() => {});
      } catch {}
    };
    window.addEventListener("mm:player:play", onPlayReq as EventListener);
    return () =>
      window.removeEventListener("mm:player:play", onPlayReq as EventListener);
  }, []);

  // עדכוני זמן/מצב
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime || 0);
    const onDur = () => setDur(isFinite(a.duration) ? a.duration : 0);
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    const onEnd = () => setPaused(true);

    a.addEventListener("timeupdate", onTime);
    a.addEventListener("durationchange", onDur);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnd);

    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("durationchange", onDur);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnd);
    };
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused)
      a.play()
        .then(() => setPaused(false))
        .catch(() => {});
    else a.pause();
  };

  const seek = (v: number) => {
    const a = audioRef.current;
    if (!a || !isFinite(dur) || dur <= 0) return;
    const t = Math.max(0, Math.min(v, dur));
    a.currentTime = t;
    setTime(t);
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <>
      {/* אודיו גלובלי – מזוהה ע"י BeatTap */}
      <audio id="pro-player-audio" ref={audioRef} preload="metadata" />

      {/* דוק תחתון */}
      <div
        className={clsx(
          "fixed bottom-3 left-3 right-3 z-[1000] transition-all",
          open
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="dock-blur mm-card p-3 rounded-2xl grid grid-cols-[auto,1fr,auto] gap-3 items-center">
          {/* Cover */}
          <div className="h-12 w-12 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) =>
                  ((e.currentTarget as HTMLImageElement).style.display = "none")
                }
              />
            ) : null}
          </div>

          {/* Title + seek */}
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{title}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs opacity-60 w-10 text-right">
                {fmt(time)}
              </span>
              <input
                className="mm-range flex-1"
                type="range"
                min={0}
                max={Math.max(1, dur || 1)}
                step={0.01}
                value={Math.min(time, dur || 0)}
                onChange={(e) => seek(Number(e.currentTarget.value))}
              />
              <span className="text-xs opacity-60 w-10">{fmt(dur)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              className="mm-btn mm-pressable"
              onClick={toggle}
              type="button"
            >
              {paused ? "▶︎" : "⏸"}
            </button>
            <button
              className="mm-btn mm-pressable"
              onClick={() => setOpen(false)}
              type="button"
              aria-label="סגור נגן"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
