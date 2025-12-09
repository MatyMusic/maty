// "use client";
// import { useEffect, useMemo, useRef, useState } from "react";

// export type MiniTrack = {
//   id: string;
//   title: string;
//   artist: string;
//   src?: string;   // אופציונלי
//   cover?: string;
// };

// const Icon = {
//   Play:  (p: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5v14l11-7-11-7z"/></svg>,
//   Pause: (p: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>,
//   Heart: (p: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 21s-6.716-4.25-9.333-7.5C.167 10 2 6 5.5 6c2.028 0 3.28 1.018 4.125 2.083C10.72 7.018 11.972 6 14 6 17.5 6 19.333 10 21.333 13.5 18.716 16.75 12 21 12 21z"/></svg>,
//   HeartO:(p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M20.8 12.6L12 21l-8.8-8.4A5.5 5.5 0 015.5 3 6.5 6.5 0 0112 7a6.5 6.5 0 016.5-4 5.5 5.5 0 012.3 9.6z"/></svg>,
//   Plus:  (p: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M11 5h2v14h-2z"/><path d="M5 11h14v2H5z"/></svg>,
//   Share: (p: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M18 16.08a3 3 0 00-1.96.77l-7.13-4.14c.05-.23.09-.46.09-.71s-.04-.48-.09-.71l7.13-4.14A3 3 0 0018 7.92 3 3 0 1015 5c0 .27.04.53.11.77l-7.13 4.14A3 3 0 006 9a3 3 0 000 6c.87 0 1.64-.35 2.2-.9l6.91 4.05c-.07.25-.11.51-.11.79a3 3 0 103-2.86z"/></svg>,
//   Eq:    (p: any) => (
//     <svg viewBox="0 0 32 20" {...p}>
//       <rect x="2"  y="6"  width="4" height="8"  rx="2" className="eq1"/>
//       <rect x="9"  y="2"  width="4" height="16" rx="2" className="eq2"/>
//       <rect x="16" y="4"  width="4" height="12" rx="2" className="eq3"/>
//       <rect x="23" y="1"  width="4" height="18" rx="2" className="eq4"/>
//       <style>{`
//         .eq1{animation:eq1 1.3s ease-in-out infinite}
//         .eq2{animation:eq2 1.4s ease-in-out infinite}
//         .eq3{animation:eq3 1.2s ease-in-out infinite}
//         .eq4{animation:eq4 1.5s ease-in-out infinite}
//         @keyframes eq1{0%,100%{transform:scaleY(.5)}50%{transform:scaleY(1)}}
//         @keyframes eq2{0%,100%{transform:scaleY(.7)}50%{transform:scaleY(1)}}
//         @keyframes eq3{0%,100%{transform:scaleY(.6)}50%{transform:scaleY(1)}}
//         @keyframes eq4{0%,100%{transform:scaleY(.8)}50%{transform:scaleY(1)}}
//       `}</style>
//     </svg>
//   ),
// };

// const fmt = (s: number) =>
//   !isFinite(s) ? "0:00" : `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`;

// const toPlayableUrl = (u?: string) =>
//   u ? `/api/proxy?u=${encodeURIComponent(u)}` : "";

// export default function MiniPlayer({ track }: { track: MiniTrack }) {
//   const hasSrc = !!track?.src;
//   const audioRef = useRef<HTMLAudioElement | null>(null); // metadata בלבד

//   const [playing, setPlaying] = useState(false);
//   const [liked, setLiked]     = useState(false);
//   const [t, setT]             = useState(0);
//   const [dur, setDur]         = useState(0);

//   // לייקים
//   useEffect(() => {
//     try {
//       const raw = localStorage.getItem("mm_likes");
//       setLiked(new Set<string>(raw ? JSON.parse(raw) : []).has(track.id));
//     } catch {}
//   }, [track.id]);

//   const toggleLike = () => {
//     try {
//       const raw = localStorage.getItem("mm_likes");
//       const set = new Set<string>(raw ? JSON.parse(raw) : []);
//       set.has(track.id) ? set.delete(track.id) : set.add(track.id);
//       localStorage.setItem("mm_likes", JSON.stringify([...set]));
//       setLiked(set.has(track.id));
//     } catch {}
//   };

//   // טוען metadata (משך) דרך הפרוקסי
//   useEffect(() => {
//     const el = audioRef.current;
//     if (!el || !hasSrc) return;
//     const onLoaded = () => setDur(el.duration || 0);
//     el.addEventListener("loadedmetadata", onLoaded);
//     el.load();
//     return () => el.removeEventListener("loadedmetadata", onLoaded);
//   }, [hasSrc, track.src]);

//   // סנכרון עם נגן גלובלי (אם יש)
//   useEffect(() => {
//     const stopOthers = (e: any) => {
//       const otherId = e?.detail?.id;
//       if (otherId && otherId !== track.id) setPlaying(false);
//     };
//     const onNow = (e: any) => {
//       const id = e?.detail?.id as string | undefined;
//       setPlaying(id === track.id);
//       if (id === track.id && typeof e?.detail?.time === "number" && typeof e?.detail?.duration === "number") {
//         setT(e.detail.time);
//         setDur(e.detail.duration || dur);
//       }
//     };
//     window.addEventListener("mm:mini:play", stopOthers as EventListener);
//     window.addEventListener("mm:now", onNow as EventListener);
//     return () => {
//       window.removeEventListener("mm:mini:play", stopOthers as EventListener);
//       window.removeEventListener("mm:now", onNow as EventListener);
//     };
//   }, [track.id, dur]);

//   const play = () => {
//     if (!hasSrc) return;
//     dispatchEvent(new CustomEvent("mm:play", { detail: { track } }));
//     dispatchEvent(new CustomEvent("mm:mini:play", { detail: { id: track.id } }));
//     setPlaying(true);
//   };
//   const pause = () => {
//     dispatchEvent(new Event("mm:pause"));
//     setPlaying(false);
//   };

//   const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!hasSrc || !dur) return;
//     const nt = (+e.target.value / 100) * dur;
//     setT(nt);
//     dispatchEvent(new CustomEvent("mm:seek", { detail: { id: track.id, time: nt } }));
//   };

//   const share = async () => {
//     const url = typeof location !== "undefined" ? location.href : "";
//     const text = `${track.title} — ${track.artist}`;
//     if ((navigator as any).share) {
//       try { await (navigator as any).share({ title: track.title, text, url }); } catch {}
//     } else {
//       try { await navigator.clipboard.writeText(`${text}\n${url}`); alert("קישור הועתק ✔"); } catch {}
//     }
//   };

//   const addToQueue = () => {
//     if (!hasSrc) return;
//     dispatchEvent(new CustomEvent("mm:queue:add", { detail: { track } }));
//   };

//   const progress = useMemo(() => (dur ? (t / dur) * 100 : 0), [t, dur]);

//   return (
//     <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 p-3 backdrop-blur shadow-sm">
//       {hasSrc && (
//         <audio
//           ref={audioRef}
//           src={toPlayableUrl(track.src)}  // <<< דרך הפרוקסי
//           preload="metadata"
//           playsInline
//           className="hidden"
//         />
//       )}

//       <div className="relative h-1 mb-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
//         <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-400" style={{ width: `${progress}%` }} />
//       </div>

//       <div className="flex items-center gap-3">
//         <button
//           onClick={hasSrc ? (playing ? pause : play) : undefined}
//           disabled={!hasSrc}
//           className={`grid h-11 w-11 place-items-center rounded-full transition shadow
//             ${hasSrc ? "bg-emerald-500 text-white hover:bg-emerald-600"
//                      : "bg-black/10 dark:bg-white/10 text-slate-500 cursor-not-allowed"}`}
//           aria-pressed={playing}
//           title={hasSrc ? (playing ? "השהה" : "נגן") : "בקרוב"}
//         >
//           {playing ? <Icon.Pause className="h-5 w-5" /> : <Icon.Play className="h-5 w-5" />}
//         </button>

//         <div className="min-w-0 flex-1">
//           <div className="truncate text-sm font-semibold">{track.title}</div>
//           <div className="truncate text-xs opacity-70">{track.artist}</div>

//           <div className="mt-1 flex items-center gap-2">
//             <span className="text-[10px] tabular-nums opacity-70">{fmt(t)}</span>
//             <input
//               type="range"
//               min={0}
//               max={100}
//               value={dur ? progress : 0}
//               onChange={onSeek}
//               className="flex-1 accent-emerald-500"
//               disabled={!hasSrc || !dur}
//               aria-label="Seek"
//             />
//             <span className="text-[10px] tabular-nums opacity-70">{fmt(dur)}</span>
//           </div>
//         </div>

//         <div className="flex items-center gap-1.5">
//           <button onClick={share} className="grid h-9 w-9 place-items-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5" title="שיתוף">
//             <Icon.Share className="h-4 w-4" />
//           </button>
//           <button onClick={addToQueue} disabled={!hasSrc} className="grid h-9 w-9 place-items-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed" title="הוסף לתור">
//             <Icon.Plus className="h-4 w-4" />
//           </button>
//           <button onClick={toggleLike} className="grid h-9 w-9 place-items-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5" aria-pressed={liked} title={liked ? "באהובים" : "הוסף לאהובים"}>
//             {liked ? <Icon.Heart className="h-4 w-4" /> : <Icon.HeartO className="h-4 w-4" />}
//           </button>
//         </div>
//       </div>

//       {playing && (
//         <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
//           <Icon.Eq className="h-4 w-6 text-emerald-500" />
//           מנגן עכשיו
//         </div>
//       )}
//     </div>
//   );
// }

// src/components/MiniPlayer.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type MiniTrack = {
  id: string;
  title: string;
  artist: string;
  src: string;
  cover?: string;
  link?: string;
};

type MiniPlayerProps = {
  track: MiniTrack;
};

/**
 * נגן מיני פשוט לטראק בודד
 * מתאים לשימוש ב־HomeHero (קטגוריות מוזיקה)
 */
export default function MiniPlayer({ track }: MiniPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [progress, setProgress] = useState(0); // בין 0–1
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // עדכון מקור האודיו
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setDuration(0);
    setError(null);
    setReady(false);

    const el = audioRef.current;
    if (!el) return;

    try {
      el.pause();
      el.currentTime = 0;
      el.src = track.src;
      el.load();
    } catch (e: any) {
      setError("שגיאה בטעינת האודיו");
    }
  }, [track.src]);

  // האזנה לאירועים מהאלמנט
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoaded = () => {
      setReady(true);
      setDuration(el.duration || 0);
      setError(null);
    };
    const onTime = () => {
      if (seeking) return;
      if (!el.duration || !isFinite(el.duration)) return;
      setProgress(el.currentTime / el.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(1);
    };
    const onError = () => {
      setError("לא הצלחנו לנגן את הטראק");
      setReady(false);
      setPlaying(false);
    };

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    el.addEventListener("error", onError);

    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("error", onError);
    };
  }, [seeking]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !ready || !track.src) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play()
        .then(() => setPlaying(true))
        .catch(() => setError("הדפדפן חסם את הניגון האוטומטי"));
    }
  };

  const handleSeekStart = () => {
    setSeeking(true);
  };

  const handleSeek = (v: number) => {
    setProgress(v);
  };

  const handleSeekEnd = (v: number) => {
    const el = audioRef.current;
    setSeeking(false);
    if (!el || !el.duration || !isFinite(el.duration)) return;
    el.currentTime = v * el.duration;
  };

  const fmtTime = (sec: number) => {
    if (!sec || !isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const currentTime = duration * progress;

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 px-3 py-2 text-xs"
      dir="rtl"
      data-mm-role="hero-mini-player"
    >
      {/* אודיו חבוי */}
      <audio ref={audioRef} preload="metadata" />

      {/* עטיפה */}
      {track.cover && (
        <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={track.cover}
            alt={track.title}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      {/* מרכז: שם הטראק + התקדמות */}
      <div className="flex-1 min-w-0">
        <div className="truncate font-semibold text-[11px] md:text-xs">
          {track.title || "טראק ללא שם"}
        </div>
        <div className="truncate text-[10px] opacity-70">
          {track.artist || "Maty Music"}
        </div>

        {/* פס התקדמות */}
        <div className="mt-1 flex items-center gap-1">
          <span className="text-[10px] tabular-nums opacity-60">
            {fmtTime(currentTime)}
          </span>
          <button
            type="button"
            className="relative h-1.5 flex-1 rounded-full bg-black/10 dark:bg-white/10 cursor-pointer"
            aria-label="שינוי מיקום הניגון"
            onMouseDown={(e) => {
              e.preventDefault();
              const rect = (
                e.currentTarget as HTMLButtonElement
              ).getBoundingClientRect();
              const calc = (clientX: number) => {
                const px = (clientX - rect.left) / rect.width;
                const v = Math.min(1, Math.max(0, px));
                return v;
              };
              const v0 = calc(e.clientX);
              handleSeekStart();
              handleSeek(v0);

              const onMove = (ev: MouseEvent) => {
                const v = calc(ev.clientX);
                handleSeek(v);
              };
              const onUp = (ev: MouseEvent) => {
                const v = calc(ev.clientX);
                handleSeekEnd(v);
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              };

              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
          >
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div
                className="h-full w-full origin-left rounded-full bg-gradient-to-l from-violet-500 via-pink-500 to-amber-400"
                style={{ transform: `scaleX(${progress || 0})` }}
              />
            </div>
          </button>
          <span className="text-[10px] tabular-nums opacity-60">
            {fmtTime(duration)}
          </span>
        </div>

        {error && (
          <div className="mt-1 text-[10px] text-red-500 truncate">{error}</div>
        )}
      </div>

      {/* כפתור פליי/פוז */}
      <button
        type="button"
        onClick={togglePlay}
        disabled={!track.src}
        className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-black/10 dark:border-white/10 bg-black/90 text-white dark:bg-white/90 dark:text-black hover:scale-105 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label={playing ? "השהה" : "נגן"}
      >
        {playing ? (
          <span className="inline-flex gap-[3px]" aria-hidden>
            <span className="h-3.5 w-[2px] rounded-full bg-current" />
            <span className="h-3.5 w-[2px] rounded-full bg-current" />
          </span>
        ) : (
          <span className="ml-[2px]" aria-hidden>
            ▶
          </span>
        )}
      </button>
    </div>
  );
}
