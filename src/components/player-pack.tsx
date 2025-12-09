// // src/components/player-pack.tsx
// "use client";

// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import Image from "next/image";

// /** ====== טיפוס טראק מינימלי שהנגן צורך ====== */
// export type Track = {
//   id: string;
//   title: string;
//   artist?: string;
//   cover?: string;
//   /** קובץ אודיו אמיתי בלבד (mp3/m4a/ogg/wav). אין YouTube כאן. */
//   src?: string | null;
//   /** לינק חיצוני fallback (YouTube/Spotify/אתר) */
//   link?: string | null;
//   youtube?: { id?: string | null } | null;
// };

// /** ====== המרה מאייטם API → Track לנגן ======
//  * דאגתי:
//  * - אם item.url הוא קובץ אודיו אמיתי → src
//  * - אם לא, נבנה link חיצוני (למשל YouTube) כדי שתהיה פתיחה fallback
//  */
// export function toTrackFromItem(item: any): Track {
//   const artist =
//     Array.isArray(item?.artists) && item.artists.length
//       ? item.artists.join(", ")
//       : item?.composer || item?.artist || "";

//   const hasAudioUrl =
//     typeof item?.url === "string" &&
//     /\.(mp3|m4a|wav|ogg)(\?|$)/i.test(item.url);

//   const youtubeLink = item?.youtube?.id
//     ? `https://www.youtube.com/watch?v=${item.youtube.id}`
//     : undefined;

//   const link =
//     item?.link || item?.videoUrl || item?.externalUrl || youtubeLink || null;

//   return {
//     id: String(item?.id ?? item?._id ?? crypto.randomUUID()),
//     title: String(item?.title ?? "Untitled"),
//     artist,
//     cover: item?.cover || "/icon.svg",
//     src: hasAudioUrl ? item.url : item?.spotify?.preview_url ?? null,
//     link,
//     youtube: item?.youtube || null,
//   };
// }

// /** שליחת אירוע ניגון גלובלי */
// export function playTrack(track: Track, queue?: Track[]) {
//   window.dispatchEvent(
//     new CustomEvent("mm:play", { detail: { track, queue } })
//   );
// }

// /** הוספה לתור בלבד */
// export function addToQueue(track: Track) {
//   window.dispatchEvent(new CustomEvent("mm:queue:add", { detail: { track } }));
// }

// /** ====== הנגן עצמו (ProPlayer) ====== */
// const fmt = (s: number) =>
//   !isFinite(s)
//     ? "0:00"
//     : `${Math.floor(s / 60)}:${Math.floor(s % 60)
//         .toString()
//         .padStart(2, "0")}`;

// const LS_QUEUE = "mm_queue_v1";
// const LS_VOL = "mm_volume";

// const uniqPush = (arr: Track[], t: Track) =>
//   arr.some((x) => x.id === t.id) ? arr : [...arr, t];
// const upsertManyUnique = (arr: Track[], list: Track[]) => {
//   const seen = new Set(arr.map((x) => x.id));
//   const out = [...arr];
//   for (const t of list)
//     if (!seen.has(t.id)) {
//       out.push(t);
//       seen.add(t.id);
//     }
//   return out;
// };

// type Props = { initialQueue?: Track[] };

// export function ProPlayer({ initialQueue = [] }: Props) {
//   const audioRef = useRef<HTMLAudioElement | null>(null);
//   const outerRef = useRef<HTMLDivElement | null>(null);

//   const [queue, setQueue] = useState<Track[]>(initialQueue);
//   const [index, setIndex] = useState(0);
//   const [open, setOpen] = useState(initialQueue.length > 0);
//   const [mounted, setMounted] = useState(false);

//   const track = queue[index];

//   const [playing, setPlaying] = useState(false);
//   const [t, setT] = useState(0);
//   const [dur, setDur] = useState(0);
//   const [volume, setVolume] = useState<number>(0.9);

//   // ==== עולים: משחזרים תור/ווליום
//   useEffect(() => {
//     setMounted(true);
//     try {
//       const rawQ = localStorage.getItem(LS_QUEUE);
//       if (rawQ) {
//         const saved: Track[] = JSON.parse(rawQ);
//         if (Array.isArray(saved) && saved.length) {
//           setQueue((q) => (q.length ? upsertManyUnique(q, saved) : saved));
//           setIndex(0);
//           setOpen(true);
//         }
//       }
//     } catch {}
//     try {
//       const rawV = localStorage.getItem(LS_VOL);
//       const v = rawV ? Number(rawV) : 0.9;
//       if (Number.isFinite(v)) setVolume(Math.min(1, Math.max(0, v)));
//     } catch {}
//   }, []);

//   // שמירת תור לפתיחה הבאה
//   useEffect(() => {
//     try {
//       localStorage.setItem(LS_QUEUE, JSON.stringify(queue));
//     } catch {}
//     setOpen(queue.length > 0 || playing);
//   }, [queue, playing]);

//   // גובה בטוח + קלאס לבודי
//   useEffect(() => {
//     const apply = () => {
//       const h = open ? outerRef.current?.offsetHeight ?? 96 : 0;
//       document.documentElement.style.setProperty("--player-h", `${h}px`);
//       document.body.classList.toggle("player-open", open);
//     };
//     apply();
//     window.addEventListener("resize", apply);
//     return () => {
//       window.removeEventListener("resize", apply);
//       document.documentElement.style.setProperty("--player-h", "0px");
//       document.body.classList.remove("player-open");
//     };
//   }, [open, queue.length]);

//   const handleNext = useCallback(() => {
//     setIndex((i) => (queue.length ? (i + 1) % queue.length : 0));
//   }, [queue.length]);

//   const handlePrev = useCallback(() => {
//     setIndex((i) => (queue.length ? (i - 1 + queue.length) % queue.length : 0));
//   }, [queue.length]);

//   const seekBy = useCallback((delta: number) => {
//     const el = audioRef.current;
//     if (!el) return;
//     el.currentTime = Math.min(
//       Math.max(0, el.currentTime + delta),
//       el.duration || el.currentTime
//     );
//     setT(el.currentTime);
//   }, []);

//   const seekTo = useCallback((secs: number) => {
//     const el = audioRef.current;
//     if (!el) return;
//     el.currentTime = Math.min(Math.max(0, secs), el.duration || secs);
//     setT(el.currentTime);
//   }, []);

//   /** פתיחת קישור חיצוני כשאין src/יש שגיאת אודיו */
//   const openFallback = useCallback(() => {
//     const link =
//       track?.link ||
//       (track?.youtube?.id
//         ? `https://www.youtube.com/watch?v=${track.youtube.id}`
//         : null);
//     if (link) {
//       window.open(link, "_blank", "noopener,noreferrer");
//     } else {
//       console.warn(
//         "[Player] אין src וגם אין link/youtube fallback לשיר:",
//         track?.title
//       );
//     }
//   }, [track]);

//   const togglePlay = useCallback(() => {
//     const el = audioRef.current;
//     if (!el) return;
//     if (!track?.src) {
//       openFallback();
//       return;
//     } // אין קובץ → פותחים קישור
//     if (el.paused) {
//       el.play()
//         .then(() => {
//           setPlaying(true);
//           if (track)
//             window.dispatchEvent(
//               new CustomEvent("mm:mini:play", {
//                 detail: { id: `pro-${track.id}` },
//               })
//             );
//         })
//         .catch((err) => {
//           console.warn("[Player] play() failed, fallback to link", err);
//           openFallback();
//         });
//     } else {
//       el.pause();
//       setPlaying(false);
//     }
//   }, [track, openFallback]);

//   // אודיו + Media Session + fallback on error
//   useEffect(() => {
//     const el = audioRef.current;
//     if (!el) return;

//     const onLoaded = () => setDur(el.duration || 0);
//     const onTime = () => {
//       setT(el.currentTime || 0);
//       try {
//         // @ts-expect-error
//         const ms: MediaSession | undefined = (navigator as any).mediaSession;
//         if (ms && Number.isFinite(el.duration)) {
//           ms.setPositionState?.({
//             duration: el.duration,
//             playbackRate: 1,
//             position: el.currentTime,
//           });
//         }
//       } catch {}
//     };
//     const onEnded = () => handleNext();
//     const onPlay = () => setPlaying(true);
//     const onPause = () => setPlaying(false);
//     const onError = () => {
//       console.warn("[Player] audio error, opening fallback");
//       setPlaying(false);
//       openFallback();
//     };

//     el.addEventListener("loadedmetadata", onLoaded);
//     el.addEventListener("timeupdate", onTime);
//     el.addEventListener("ended", onEnded);
//     el.addEventListener("play", onPlay);
//     el.addEventListener("pause", onPause);
//     el.addEventListener("error", onError);

//     el.volume = volume;

//     if (track?.src) {
//       el.src = track.src;
//       el.load();

//       try {
//         // @ts-expect-error
//         const ms: MediaSession | undefined = (navigator as any).mediaSession;
//         if (ms && track) {
//           ms.metadata = new window.MediaMetadata({
//             title: track.title,
//             artist: track.artist || "",
//             album: "MATY MUSIC",
//             artwork: track.cover
//               ? [{ src: track.cover, sizes: "512x512", type: "image/png" }]
//               : undefined,
//           });
//           ms.setActionHandler?.("play", () => togglePlay());
//           ms.setActionHandler?.("pause", () => togglePlay());
//           ms.setActionHandler?.("previoustrack", () => handlePrev());
//           ms.setActionHandler?.("nexttrack", () => handleNext());
//           ms.setActionHandler?.("seekbackward", (d: any) =>
//             seekBy(-(d?.seekOffset ?? 10))
//           );
//           ms.setActionHandler?.("seekforward", (d: any) =>
//             seekBy(d?.seekOffset ?? 10)
//           );
//           ms.setActionHandler?.("seekto", (d: any) => {
//             if (typeof d?.seekTime === "number") seekTo(d.seekTime);
//           });
//           ms.playbackState = playing ? "playing" : "paused";
//         }
//       } catch {}
//     } else {
//       el.removeAttribute("src");
//       try {
//         el.pause();
//       } catch {}
//       setPlaying(false);
//       setDur(0);
//       setT(0);
//     }

//     return () => {
//       el.removeEventListener("loadedmetadata", onLoaded);
//       el.removeEventListener("timeupdate", onTime);
//       el.removeEventListener("ended", onEnded);
//       el.removeEventListener("play", onPlay);
//       el.removeEventListener("pause", onPause);
//       el.removeEventListener("error", onError);
//     };
//   }, [
//     track,
//     volume,
//     handleNext,
//     handlePrev,
//     seekBy,
//     seekTo,
//     togglePlay,
//     playing,
//     openFallback,
//   ]);

//   // נגן שומר על ניגון כשעוברים לשיר הבא
//   useEffect(() => {
//     const el = audioRef.current;
//     if (!el || !track) return;
//     if (playing && track?.src) {
//       el.play().catch((err) => {
//         console.warn("[Player] auto-play failed, fallback", err);
//         openFallback();
//       });
//       window.dispatchEvent(
//         new CustomEvent("mm:mini:play", { detail: { id: `pro-${track.id}` } })
//       );
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [index]);

//   // קיצורי מקלדת
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
//       if (tag && /input|textarea|select/.test(tag)) return;
//       if (e.code === "Space") {
//         e.preventDefault();
//         togglePlay();
//       } else if (e.code === "ArrowRight") seekBy(5);
//       else if (e.code === "ArrowLeft") seekBy(-5);
//       else if (e.code === "ArrowUp") setVolume((v) => Math.min(1, v + 0.05));
//       else if (e.code === "ArrowDown") setVolume((v) => Math.max(0, v - 0.05));
//       else if (e.key.toLowerCase() === "n") handleNext();
//       else if (e.key.toLowerCase() === "p") handlePrev();
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [seekBy, togglePlay, handleNext, handlePrev]);

//   // אירועי אתר/מיני־נגן
//   useEffect(() => {
//     const onPlayEvt = (e: any) => {
//       const tr: Track | undefined = e?.detail?.track;
//       const q: Track[] | undefined = e?.detail?.queue;
//       if (!tr) return;
//       setQueue((old) => {
//         let base = old;
//         if (q?.length) base = upsertManyUnique(old, q);
//         base = uniqPush(base, tr);
//         const ix = base.findIndex((x) => x.id === tr.id);
//         setIndex(ix === -1 ? base.length - 1 : ix);
//         return base;
//       });
//       setOpen(true);
//       setPlaying(true);
//       if (!tr.src) {
//         // אין אודיו? פתח מיד קישור
//         setTimeout(openFallback, 0);
//       }
//     };
//     const onAddEvt = (e: any) => {
//       const tr: Track | undefined = e?.detail?.track;
//       if (!tr) return;
//       setQueue((old) => uniqPush(old, tr));
//       setOpen(true);
//     };
//     const onClear = () => {
//       setQueue([]);
//       setIndex(0);
//       setPlaying(false);
//       setOpen(false);
//     };

//     window.addEventListener("mm:play", onPlayEvt as EventListener);
//     window.addEventListener("mm:queue:add", onAddEvt as EventListener);
//     window.addEventListener("mm:queue:clear", onClear as EventListener);
//     return () => {
//       window.removeEventListener("mm:play", onPlayEvt as EventListener);
//       window.removeEventListener("mm:queue:add", onAddEvt as EventListener);
//       window.removeEventListener("mm:queue:clear", onClear as EventListener);
//     };
//   }, [openFallback]);

//   // שימור ווליום
//   useEffect(() => {
//     const el = audioRef.current;
//     if (el) el.volume = volume;
//     try {
//       localStorage.setItem(LS_VOL, String(volume));
//     } catch {}
//   }, [volume]);

//   const progress = useMemo(() => (dur ? (t / dur) * 100 : 0), [t, dur]);

//   if (!mounted) return null;

//   // בועית מזער אם סגור ויש תור/ניגון
//   if (!open && (playing || queue.length > 0)) {
//     const mini = queue[index];
//     return (
//       <button
//         dir="rtl"
//         onClick={() => {
//           setOpen(true);
//         }}
//         className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border bg-white/80 dark:bg-neutral-900/80 backdrop-blur shadow-xl border-black/10 dark:border-white/10 px-3 py-2"
//         aria-label="פתח נגן"
//       >
//         <div className="relative h-8 w-8 overflow-hidden rounded-full border border-black/10 dark:border-white/10">
//           <Image
//             src={mini?.cover ?? "/icon.svg"}
//             alt=""
//             fill
//             sizes="32px"
//             className="object-cover"
//           />
//         </div>
//         <span className="max-w-[160px] truncate text-sm">
//           {mini?.title ?? "נגן"}
//         </span>
//         <span className="text-lg">▲</span>
//       </button>
//     );
//   }

//   if (!open && !playing && queue.length === 0) return null;

//   return (
//     <div
//       dir="rtl"
//       ref={outerRef}
//       className="fixed bottom-4 right-4 z-40 w-[min(520px,calc(100vw-2rem))] rounded-2xl border bg-white/80 dark:bg-neutral-900/80 backdrop-blur shadow-xl border-black/10 dark:border-white/10"
//     >
//       <audio ref={audioRef} preload="metadata" playsInline />

//       {/* פס התקדמות */}
//       <div className="relative h-1 overflow-hidden rounded-t-2xl bg-black/5 dark:bg-white/10">
//         <div
//           className="absolute inset-y-0 right-0 bg-gradient-to-l from-violet-600 to-pink-500"
//           style={{ width: `${progress}%` }}
//         />
//       </div>

//       <div className="p-3 md:p-4 flex items-center gap-3">
//         {/* עטיפה */}
//         <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
//           <Image
//             src={track?.cover ?? "/assets/logo/maty-music-wordmark.svg"}
//             alt={track?.title ?? "Track cover"}
//             fill
//             sizes="56px"
//             className="object-cover"
//           />
//         </div>

//         {/* פרטים + Seek */}
//         <div className="min-w-0 flex-1">
//           <div className="truncate text-sm md:text-base font-semibold">
//             {track?.title ?? "—"}
//           </div>
//           <div className="truncate text-xs md:text-sm opacity-70">
//             {track?.artist ?? ""}
//           </div>
//           <div className="mt-1 flex items-center gap-2">
//             <span className="text-[10px] tabular-nums opacity-70">
//               {fmt(t)}
//             </span>
//             <input
//               type="range"
//               min={0}
//               max={Math.max(1, dur || 0)}
//               value={Math.min(t, dur || 0)}
//               onChange={(e) => seekTo(Number(e.target.value))}
//               className="flex-1 accent-violet-600"
//               aria-label="Seek"
//             />
//             <span className="text-[10px] tabular-nums opacity-70">
//               {fmt(dur)}
//             </span>
//           </div>
//         </div>

//         {/* שליטה */}
//         <div className="flex items-center gap-1.5 md:gap-2">
//           <button
//             className="grid h-9 w-9 place-items-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
//             onClick={() => setOpen(false)}
//             title="מזער"
//             aria-label="Minimize"
//           >
//             ⤢
//           </button>
//           <button
//             className="grid h-9 w-9 place-items-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
//             onClick={handlePrev}
//             title="שיר קודם (P)"
//             aria-label="Previous"
//           >
//             <span className="inline-block rotate-180">⏭️</span>
//           </button>

//           <button
//             className="grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 shadow"
//             onClick={togglePlay}
//             title={playing ? "Pause (Space)" : "Play (Space)"}
//             aria-pressed={playing}
//           >
//             {playing ? (
//               <svg
//                 viewBox="0 0 24 24"
//                 className="h-5 w-5 md:h-6 md:w-6"
//                 fill="currentColor"
//               >
//                 <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
//               </svg>
//             ) : (
//               <svg
//                 viewBox="0 0 24 24"
//                 className="h-5 w-5 md:h-6 md:w-6"
//                 fill="currentColor"
//               >
//                 <path d="M8 5v14l11-7-11-7z" />
//               </svg>
//             )}
//           </button>

//           <button
//             className="grid h-9 w-9 place-items-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
//             onClick={handleNext}
//             title="שיר הבא (N)"
//             aria-label="Next"
//           >
//             <span>⏭️</span>
//           </button>

//           <button
//             className="grid h-9 w-9 place-items-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
//             onClick={() => {
//               setQueue([]);
//               setIndex(0);
//               setPlaying(false);
//               setOpen(false);
//               dispatchEvent(new Event("mm:queue:clear"));
//             }}
//             title="נקה תור"
//             aria-label="Clear queue"
//           >
//             ✕
//           </button>
//         </div>
//       </div>

//       {/* ווליום */}
//       <div className="px-4 pb-3">
//         <div className="flex items-center gap-2">
//           <span className="text-xs opacity-70">ווליום</span>
//           <input
//             type="range"
//             min={0}
//             max={1}
//             step={0.01}
//             value={volume}
//             onChange={(e) => setVolume(Number(e.target.value))}
//             className="flex-1 accent-violet-600"
//             aria-label="Volume"
//           />
//           <span className="text-xs tabular-nums w-10 text-right opacity-70">
//             {Math.round(volume * 100)}%
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ProPlayer;

"use client";
import { usePlayer, type TrackLike } from "@/context/player";
import React from "react";

function toTrackLike(item: any): TrackLike {
  return {
    _id: item._id || item.id,
    title: item.title || "Untitled",
    artists: item.artists || [],
    cover:
      item.cover || item.thumbnails?.high?.url || item.thumbnails?.default?.url,
    audioUrl:
      item.audioUrl || item.previewUrl
        ? item.audioUrl || item.previewUrl
        : undefined,
    previewUrl: item.previewUrl,
    embedUrl: item.embedUrl,
    videoId: item.videoId,
    externalUrl: item.externalUrl || item.sourceUrl,
    durationSec: item.durationSec,
    source: item.source,
  };
}

export default function PlayerPack({ items }: { items: any[] }) {
  const p = usePlayer();
  const queue = React.useMemo(() => items.map(toTrackLike), [items]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((raw, i) => {
        const t = queue[i];
        const play = () => p.play(t, queue);
        return (
          <div
            key={t._id}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900"
          >
            <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 grid place-items-center text-sm">
              {/* תוכל לשים פה תמונה/thumbnail אם קיים */}
              {t.cover ? (
                <img
                  src={t.cover}
                  alt={t.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                "No Cover"
              )}
            </div>
            <div className="p-3">
              <div className="font-medium truncate">{t.title}</div>
              <div className="text-xs opacity-70 truncate">
                {(t.artists || []).join(", ")}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={play}
                  className="px-3 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-sm"
                >
                  נגן
                </button>
                {t.externalUrl && (
                  <a
                    className="text-xs underline opacity-70"
                    href={t.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    פתח במקור
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
