// src/app/fit/exercises/_components/ExerciseDetailClient.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import {
  Play,
  Share2,
  Heart,
  HeartHandshake,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/* ============ Action Bar ============ */
function ActionBar({
  id,
  name,
  videoHref,
  openVideoLabel = "צפייה בווידאו",
}: {
  id: string;
  name: string;
  videoHref?: string;
  openVideoLabel?: string;
}) {
  // Favs local
  const favKey = "fit:favs";
  const [fav, setFav] = React.useState(false);
  React.useEffect(() => {
    try {
      const curr = JSON.parse(localStorage.getItem(favKey) || "[]") as string[];
      setFav(curr.includes(id));
    } catch {}
  }, [id]);

  function toast(type: "success" | "info", text: string) {
    try {
      window.dispatchEvent(
        new CustomEvent("mm:toast", { detail: { type, text } }),
      );
    } catch {}
  }

  function toggleFav() {
    try {
      const curr = JSON.parse(localStorage.getItem(favKey) || "[]") as string[];
      const next = curr.includes(id)
        ? curr.filter((x) => x !== id)
        : [...curr, id];
      localStorage.setItem(favKey, JSON.stringify(Array.from(new Set(next))));
      setFav(next.includes(id));
      toast(
        next.includes(id) ? "success" : "info",
        next.includes(id) ? "נשמר למועדפים ❤️" : "הוסר מהמועדפים",
      );
    } catch {}
  }

  async function share() {
    const url = new URL(window.location.href);
    url.searchParams.set("src", "detail");
    try {
      await navigator.clipboard.writeText(url.toString());
      toast("success", "קישור הועתק 🎉");
    } catch {
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    }
  }

  function addToWorkout() {
    try {
      window.dispatchEvent(
        new CustomEvent("fit:add_to_workout", { detail: { id, name } }),
      );
      toast("success", "נוסף לאימון ✨");
    } catch {}
  }

  return (
    <div className="grid gap-2">
      {/* video */}
      {!!videoHref && (
        <a
          href={videoHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70"
        >
          <Play size={16} /> {openVideoLabel}
        </a>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button
          onClick={addToWorkout}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium border hover:bg-amber-50 dark:hover:bg-amber-500/10"
        >
          <HeartHandshake size={16} /> הוסף לאימון
        </button>
        <button
          onClick={toggleFav}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium border focus:outline-none focus-visible:ring-2",
            fav
              ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500/70"
              : "bg-white/70 dark:bg-white/10 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-neutral-200 dark:border-white/10 focus-visible:ring-rose-400/50",
          )}
          aria-pressed={fav}
        >
          <Heart size={16} className={fav ? "fill-current" : ""} />{" "}
          {fav ? "מועדף" : "מועדפים"}
        </button>
        <button
          onClick={share}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium bg-white/70 dark:bg-white/10 hover:bg-amber-50 dark:hover:bg-amber-500/10 border border-neutral-200 dark:border-white/10"
        >
          <Share2 size={16} /> שתף
        </button>
      </div>
    </div>
  );
}

/* ============ Media Gallery + Lightbox ============ */
function MediaGallery({
  cover,
  images,
  youtubeId,
  videoUrl,
  title,
}: {
  cover: string;
  images: string[];
  youtubeId?: string;
  videoUrl?: string;
  title: string;
}) {
  const gallery = React.useMemo(() => {
    const base = images && images.length ? images : [cover];
    return Array.from(new Set([cover, ...base]));
  }, [cover, images]);

  const [active, setActive] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const videoHref = youtubeId
    ? `https://www.youtube.com/watch?v=${youtubeId}`
    : videoUrl || "";

  function openLightbox(idx: number) {
    setActive(idx);
    setOpen(true);
  }
  function closeLightbox() {
    setOpen(false);
  }
  function prev() {
    setActive((i) => (i - 1 + gallery.length) % gallery.length);
  }
  function next() {
    setActive((i) => (i + 1) % gallery.length);
  }

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, gallery.length]);

  return (
    <div>
      {/* Main */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-white/60 dark:bg-white/10">
        <Image
          src={gallery[active]}
          alt={title}
          fill
          className="object-cover"
          unoptimized
          sizes="(min-width:1024px) 832px, 100vw"
          onClick={() => openLightbox(active)}
        />
        <button
          onClick={() => openLightbox(active)}
          className="absolute bottom-2 left-2 inline-flex items-center gap-2 rounded-full border bg-black/55 text-white px-3 py-1.5 text-xs backdrop-blur hover:bg-black/70"
          aria-label="תצוגה במסך מלא"
        >
          <Maximize2 size={14} /> מסך מלא
        </button>

        {!!videoHref && (
          <a
            href={videoHref}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-2 right-2 inline-flex items-center gap-2 rounded-full border bg-black/55 text-white px-3 py-1.5 text-xs backdrop-blur hover:bg-black/70"
          >
            <Play size={14} /> צפייה בווידאו
          </a>
        )}
      </div>

      {/* Thumbs */}
      {gallery.length > 1 && (
        <div className="mt-3 grid grid-cols-4 sm:grid-cols-8 gap-2">
          {gallery.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 overflow-hidden rounded-xl border bg-white/60 dark:bg-white/10",
                i === active && "ring-2 ring-amber-500/70",
              )}
              aria-pressed={i === active}
              aria-label={`תמונה ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4"
          role="dialog"
          aria-modal
        >
          <div className="relative w-full max-w-5xl">
            <button
              onClick={closeLightbox}
              className="absolute -top-10 right-0 rounded-full border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="סגירה"
            >
              <X size={18} />
            </button>
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery[active]}
                alt=""
                className="h-full w-full object-contain bg-black"
              />
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="הקודם"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="הבא"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ExerciseDetailClient = { ActionBar, MediaGallery };
export default ExerciseDetailClient;
