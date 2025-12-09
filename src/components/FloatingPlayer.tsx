"use client";
import { usePlayer } from "@/context/player";
import {
  X,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import React from "react";

function fmt(sec?: number) {
  if (!sec || !Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function FloatingPlayer() {
  const p = usePlayer();
  const t = p.current;

  const playable = t
    ? t.audioUrl || t.previewUrl || t.embedUrl || t.videoId
    : null;
  const ytUrl =
    t?.embedUrl ??
    (t?.videoId ? `https://www.youtube.com/embed/${t.videoId}` : null);

  const [muted, setMuted] = React.useState(false);
  React.useEffect(() => {
    if (muted) p.setVolume(0);
  }, [muted]); // eslint-disable-line

  if (!p.open || !t || !playable) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="fixed bottom-3 left-3 right-3 z-50"
      >
        <div className="mx-auto max-w-5xl rounded-2xl shadow-xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur border border-neutral-200/60 dark:border-neutral-800/60">
          <div className="grid grid-cols-[auto,1fr,auto] gap-3 items-center px-3 py-2 sm:px-4 sm:py-3">
            {/* Cover */}
            <div className="hidden sm:block">
              <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800">
                {t.cover ? (
                  <Image
                    src={t.cover}
                    alt={t.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-xs opacity-50">
                    No Cover
                  </div>
                )}
              </div>
            </div>

            {/* Middle: title + controls */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => (p.playing ? p.toggle() : p.toggle())}
                  className="inline-grid place-items-center size-10 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  title={p.playing ? "Pause" : "Play"}
                >
                  {p.kind === "audio" ? (
                    p.playing ? (
                      <Pause size={20} />
                    ) : (
                      <Play size={20} />
                    )
                  ) : (
                    <Play size={20} />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="truncate font-medium">{t.title}</div>
                  <div className="truncate text-xs opacity-70">
                    {(t.artists || []).join(", ")}
                  </div>
                </div>
              </div>

              {/* Seek (audio only) */}
              {p.kind === "audio" ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] tabular-nums opacity-70">
                    {fmt(p.progress)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={t.durationSec ? Math.max(1, t.durationSec) : 300}
                    value={p.progress}
                    onChange={(e) => p.seek(Number(e.target.value))}
                    className="w-full accent-neutral-900 dark:accent-neutral-100"
                  />
                  <span className="text-[10px] tabular-nums opacity-70">
                    {fmt(t.durationSec)}
                  </span>
                </div>
              ) : (
                <div className="mt-2 text-[11px] opacity-60">
                  ניגון YouTube – השליטה בתוך הנגן.
                </div>
              )}
            </div>

            {/* Right: prev/next, volume, external, close */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={p.prev}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Previous"
              >
                <SkipBack size={18} />
              </button>
              <button
                onClick={p.next}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Next"
              >
                <SkipForward size={18} />
              </button>

              {/* Volume (audio only) */}
              {p.kind === "audio" ? (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => setMuted((m) => !m)}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    title={muted ? "Unmute" : "Mute"}
                  >
                    {muted || p.volume === 0 ? (
                      <VolumeX size={18} />
                    ) : (
                      <Volume2 size={18} />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={muted ? 0 : p.volume}
                    onChange={(e) => p.setVolume(Number(e.target.value))}
                    className="w-24 accent-neutral-900 dark:accent-neutral-100"
                  />
                </div>
              ) : null}

              {/* open source in new tab (לא מנגן מזה!) */}
              {t.externalUrl && (
                <a
                  href={t.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  title="פתיחה במקור"
                >
                  <ExternalLink size={18} />
                </a>
              )}

              {/* Close */}
              <button
                onClick={p.close}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="סגור"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Inline YouTube iframe (אם זה YouTube) */}
          {p.kind === "youtube" && ytUrl && (
            <div className="px-3 pb-3 sm:px-4">
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
                <iframe
                  className="h-full w-full"
                  src={ytUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
