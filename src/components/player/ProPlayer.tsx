// "use client";
// import * as React from "react";

// /** ===== Types ===== */
// export type Track = {
//   id: string;
//   title: string;
//   artist?: string;
//   src: string; // https://... או /api/proxy?u=...
//   cover?: string; // תמונת עטיפה
// };

// type Props = {
//   queue: Track[];
//   initialIndex?: number;
//   compact?: boolean; // מצב קומפקטי
//   accent?: "violet" | "emerald" | "sky" | "rose" | "amber";
//   onTrackChange?: (t: Track, index: number) => void;
//   storageKey?: string; // לשמירת מצב אחרון (localStorage)
// };

// const ACCENT = {
//   violet: "violet",
//   emerald: "emerald",
//   sky: "sky",
//   rose: "rose",
//   amber: "amber",
// } as const;

// function formatTime(s: number) {
//   if (!isFinite(s) || s < 0) return "0:00";
//   const m = Math.floor(s / 60);
//   const ss = Math.floor(s % 60);
//   return `${m}:${ss.toString().padStart(2, "0")}`;
// }

// function clamp(n: number, min = 0, max = 1) {
//   return Math.min(max, Math.max(min, n));
// }

// export default function ProPlayer({
//   queue,
//   initialIndex = 0,
//   compact = false,
//   accent = "violet",
//   onTrackChange,
//   storageKey = "mm:proplayer:chabad",
// }: Props) {
//   const [index, setIndex] = React.useState(() => {
//     try {
//       const raw = localStorage.getItem(storageKey);
//       if (raw) {
//         const saved = JSON.parse(raw);
//         if (saved?.index >= 0 && saved.index < queue.length) return saved.index;
//       }
//     } catch {}
//     return initialIndex;
//   });
//   const track = queue[index];

//   const audioRef = React.useRef<HTMLAudioElement | null>(null);
//   const rafRef = React.useRef<number | null>(null);
//   const analyserRef = React.useRef<AnalyserNode | null>(null);
//   const gainRef = React.useRef<GainNode | null>(null);
//   const [ctx, setCtx] = React.useState<AudioContext | null>(null);

//   const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
//   const [playing, setPlaying] = React.useState(false);
//   const [loop, setLoop] = React.useState(false);
//   const [shuffle, setShuffle] = React.useState(false);

//   const [time, setTime] = React.useState(0);
//   const [dur, setDur] = React.useState(0);
//   const [bufEnd, setBufEnd] = React.useState(0);
//   const [vol, setVol] = React.useState(0.9);
//   const [muted, setMuted] = React.useState(false);
//   const [showQueue, setShowQueue] = React.useState(false);

//   // Persist state
//   React.useEffect(() => {
//     try {
//       localStorage.setItem(
//         storageKey,
//         JSON.stringify({ index, time, vol, muted, loop, shuffle }),
//       );
//     } catch {}
//   }, [index, time, vol, muted, loop, shuffle, storageKey]);

//   // Track change side-effect
//   React.useEffect(() => {
//     onTrackChange?.(track, index);
//     // reset time
//     setTime(0);
//     setBufEnd(0);
//     setPlaying(false);
//   }, [index]); // eslint-disable-line

//   // Audio setup
//   React.useEffect(() => {
//     const a = audioRef.current!;
//     const onLoaded = () => {
//       setDur(a.duration || 0);
//       if (ctx && analyserRef.current == null) {
//         // (re)connect analyser
//         try {
//           const source = ctx.createMediaElementSource(a);
//           const gain = ctx.createGain();
//           const analyser = ctx.createAnalyser();
//           analyser.fftSize = 1024;
//           source.connect(gain);
//           gain.connect(analyser);
//           analyser.connect(ctx.destination);
//           analyserRef.current = analyser;
//           gainRef.current = gain;
//         } catch {}
//       }
//     };
//     const onTime = () => setTime(a.currentTime || 0);
//     const onProg = () => {
//       try {
//         if (a.buffered.length) {
//           const end = a.buffered.end(a.buffered.length - 1);
//           setBufEnd(end);
//         }
//       } catch {}
//     };
//     const onEnd = () => {
//       if (loop) {
//         a.currentTime = 0;
//         a.play().catch(() => {});
//         return;
//       }
//       next();
//     };

//     a.addEventListener("loadedmetadata", onLoaded);
//     a.addEventListener("timeupdate", onTime);
//     a.addEventListener("progress", onProg);
//     a.addEventListener("ended", onEnd);
//     return () => {
//       a.removeEventListener("loadedmetadata", onLoaded);
//       a.removeEventListener("timeupdate", onTime);
//       a.removeEventListener("progress", onProg);
//       a.removeEventListener("ended", onEnd);
//     };
//   }, [track?.src, loop, ctx]);

//   // Create AudioContext lazily on first play (mobile policy)
//   const ensureContext = React.useCallback(async () => {
//     if (!ctx) {
//       const c = new (window.AudioContext ||
//         (window as any).webkitAudioContext)();
//       await c.resume().catch(() => {});
//       setCtx(c);
//     }
//   }, [ctx]);

//   // Visualizer
//   const draw = React.useCallback(() => {
//     const cvs = canvasRef.current;
//     const an = analyserRef.current;
//     if (!cvs || !an) return;

//     const dpr = Math.min(window.devicePixelRatio || 1, 2);
//     const w = cvs.clientWidth * dpr;
//     const h = cvs.clientHeight * dpr;
//     if (cvs.width !== w) cvs.width = w;
//     if (cvs.height !== h) cvs.height = h;

//     const ctx2d = cvs.getContext("2d")!;
//     const data = new Uint8Array(an.frequencyBinCount);
//     an.getByteFrequencyData(data);

//     ctx2d.clearRect(0, 0, w, h);
//     const bars = 48;
//     const step = Math.floor(data.length / bars);
//     const color =
//       getComputedStyle(document.documentElement)
//         .getPropertyValue(`--acc-${ACCENT[accent]}`)
//         .trim() || "#6d28d9";

//     for (let i = 0; i < bars; i++) {
//       const v = data[i * step] / 255; // 0..1
//       const bw = (w / bars) * 0.7;
//       const x = (w / bars) * i + (w / bars - bw) / 2;
//       const bh = Math.max(2, v * (h * 0.9));
//       const y = h - bh;
//       ctx2d.fillStyle = color;
//       ctx2d.fillRect(x, y, bw, bh);
//       ctx2d.globalAlpha = 0.25;
//       ctx2d.fillRect(x, y - 4, bw, 4);
//       ctx2d.globalAlpha = 1;
//     }
//   }, [accent]);

//   React.useEffect(() => {
//     const loop = () => {
//       draw();
//       rafRef.current = requestAnimationFrame(loop);
//     };
//     rafRef.current = requestAnimationFrame(loop);
//     return () => {
//       if (rafRef.current) cancelAnimationFrame(rafRef.current);
//     };
//   }, [draw]);

//   // Controls
//   const play = React.useCallback(async () => {
//     const a = audioRef.current!;
//     await ensureContext();
//     try {
//       await a.play();
//       setPlaying(true);
//     } catch (e) {
//       // ייתכן סירוב אוטופליי — הצגת מצב "מוכן לניגון"
//       setPlaying(false);
//     }
//   }, [ensureContext]);

//   const pause = React.useCallback(() => {
//     const a = audioRef.current!;
//     a.pause();
//     setPlaying(false);
//   }, []);

//   const toggle = React.useCallback(() => {
//     if (playing) pause();
//     else play();
//   }, [playing, play, pause]);

//   const seek = (v: number) => {
//     const a = audioRef.current!;
//     a.currentTime = clamp(v, 0, dur || a.duration || 0);
//   };

//   const changeVol = (v: number) => {
//     const a = audioRef.current!;
//     const nv = clamp(v, 0, 1);
//     a.volume = nv;
//     setVol(nv);
//     setMuted(nv === 0);
//     try {
//       if (gainRef.current) gainRef.current.gain.value = nv;
//     } catch {}
//   };

//   const toggleMute = () => {
//     const a = audioRef.current!;
//     if (muted) {
//       a.muted = false;
//       setMuted(false);
//       if (a.volume === 0) changeVol(0.8);
//     } else {
//       a.muted = true;
//       setMuted(true);
//     }
//   };

//   const prev = () => {
//     setIndex((i) => (i - 1 + queue.length) % queue.length);
//   };
//   const next = () => {
//     if (shuffle) {
//       const r = Math.floor(Math.random() * queue.length);
//       setIndex((i) => (r === i ? (i + 1) % queue.length : r));
//       return;
//     }
//     setIndex((i) => (i + 1) % queue.length);
//   };

//   // Keyboard shortcuts
//   React.useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       // התעלם אם מקלידים בטקסט
//       const t = e.target as HTMLElement;
//       const tag = (t?.tagName || "").toLowerCase();
//       if (tag === "input" || tag === "textarea" || (t as any).isContentEditable)
//         return;

//       if (e.code === "Space") {
//         e.preventDefault();
//         toggle();
//       } else if (e.code === "ArrowRight") seek(time + 5);
//       else if (e.code === "ArrowLeft") seek(time - 5);
//       else if (e.code === "ArrowUp") {
//         e.preventDefault();
//         changeVol(vol + 0.05);
//       } else if (e.code === "ArrowDown") {
//         e.preventDefault();
//         changeVol(vol - 0.05);
//       } else if (e.key.toLowerCase() === "l") setLoop((v) => !v);
//       else if (e.key.toLowerCase() === "s") setShuffle((v) => !v);
//       else if (e.key.toLowerCase() === "m") toggleMute();
//       else if (e.key.toLowerCase() === "n") next();
//       else if (e.key.toLowerCase() === "p") prev();
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [toggle, time, vol, toggleMute, next, prev]);

//   // Auto-play on track change (אחרי שהדפדפן אישר אינטראקציה)
//   React.useEffect(() => {
//     const a = audioRef.current!;
//     if (!a) return;
//     a.autoplay = false;
//     // נסה להמשיך מנקודה שנשמרה
//     try {
//       const raw = localStorage.getItem(storageKey);
//       const saved = raw ? JSON.parse(raw) : null;
//       if (saved?.index === index && typeof saved?.time === "number") {
//         a.currentTime = clamp(saved.time, 0, a.duration || 0);
//       }
//     } catch {}
//     // לא מפעילים אוטומטית כדי לא לחרוג ממדיניות; המשתמש ילחץ Play
//   }, [index, storageKey]);

//   const colorCls = `text-${accent}-600`;
//   const bgAccent = `bg-${accent}-600`;
//   const ringAccent = `focus-visible:ring-${accent}-500`;

//   return (
//     <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 p-3 md:p-4 shadow-md">
//       {/* Head */}
//       <div className="flex items-center gap-3">
//         {/* Cover */}
//         <div className="relative shrink-0">
//           <img
//             src={track?.cover || "/assets/images/avatar-chabad.png"}
//             alt=""
//             className="size-14 md:size-16 rounded-xl object-cover bg-black/10 dark:bg-white/10"
//             onError={(e) => {
//               (e.currentTarget as HTMLImageElement).src =
//                 "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='100%' height='100%' fill='%23ddd'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%23666'>no cover</text></svg>";
//             }}
//           />
//         </div>

//         {/* Meta */}
//         <div className="min-w-0">
//           <div className="font-extrabold truncate">{track?.title || "—"}</div>
//           <div className="text-xs opacity-70 truncate">
//             {track?.artist || "Maty Music · Chabad"}
//           </div>
//         </div>

//         {/* Actions (right) */}
//         <div className="ms-auto flex items-center gap-2">
//           <button
//             onClick={() => setShowQueue((v) => !v)}
//             className={`rounded-lg border px-2.5 py-1 text-xs ${ringAccent} hover:bg-black/5 dark:hover:bg-white/5`}
//             title="תור ניגון (Q)"
//           >
//             תור
//           </button>
//         </div>
//       </div>

//       {/* Visualizer */}
//       {!compact && (
//         <div className="mt-3 h-16 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
//           <canvas ref={canvasRef} className="w-full h-full block" />
//           {/* צבע דינמי דרך CSS var */}
//           <style jsx>{`
//             :root {
//               --acc-violet: #7c3aed;
//               --acc-emerald: #059669;
//               --acc-sky: #0284c7;
//               --acc-rose: #e11d48;
//               --acc-amber: #d97706;
//             }
//           `}</style>
//         </div>
//       )}

//       {/* Controls */}
//       <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3">
//         {/* Transport */}
//         <div className="flex items-center gap-1.5">
//           <IconButton onClick={prev} title="הקודם (P)" ariaLabel="הקודם">
//             <PrevIcon />
//           </IconButton>

//           <button
//             onClick={toggle}
//             className={`inline-flex items-center justify-center h-10 w-10 rounded-full text-white ${bgAccent} shadow active:scale-95 transition`}
//             aria-label={playing ? "הפסק" : "נגן"}
//             title="נגן/הפסק (Space)"
//           >
//             {playing ? <PauseIcon /> : <PlayIcon />}
//           </button>

//           <IconButton onClick={next} title="הבא (N)" ariaLabel="הבא">
//             <NextIcon />
//           </IconButton>
//         </div>

//         {/* Seek */}
//         <div className="min-w-0">
//           <div className="flex items-center gap-2 text-xs opacity-80">
//             <span className="tabular-nums w-10 text-right">
//               {formatTime(time)}
//             </span>
//             <div className="relative w-full">
//               {/* Buffered */}
//               <div className="absolute inset-y-[9px] left-0 right-0">
//                 <div className="h-1 rounded bg-black/10 dark:bg-white/10 overflow-hidden">
//                   <div
//                     className={`h-full bg-${accent}-600/30`}
//                     style={{
//                       width: dur > 0 ? `${(bufEnd / dur) * 100}%` : "0%",
//                     }}
//                   />
//                 </div>
//               </div>
//               {/* Seek input */}
//               <input
//                 type="range"
//                 min={0}
//                 max={Math.max(1, Math.floor(dur))}
//                 value={Math.floor(time)}
//                 onChange={(e) => seek(Number(e.currentTarget.value))}
//                 className="relative z-10 w-full h-2 appearance-none bg-transparent cursor-pointer"
//                 aria-label="סרגל התקדמות"
//               />
//               <style jsx>{`
//                 input[type="range"]::-webkit-slider-runnable-track {
//                   height: 4px;
//                   background: linear-gradient(
//                     to right,
//                     var(--tw-${accent}) 0%,
//                     var(--tw-${accent}) ${(time / (dur || 1)) * 100}%,
//                     transparent ${(time / (dur || 1)) * 100}%,
//                     transparent 100%
//                   );
//                 }
//               `}</style>
//             </div>
//             <span className="tabular-nums w-10">{formatTime(dur)}</span>
//           </div>
//         </div>

//         {/* Side toggles */}
//         <div className="flex items-center gap-1.5">
//           <ToggleButton
//             active={loop}
//             onClick={() => setLoop((v) => !v)}
//             title="לולאה (L)"
//             ariaLabel="לולאה"
//             accent={accent}
//           >
//             <LoopIcon active={loop} />
//           </ToggleButton>
//           <ToggleButton
//             active={shuffle}
//             onClick={() => setShuffle((v) => !v)}
//             title="אקראי (S)"
//             ariaLabel="אקראי"
//             accent={accent}
//           >
//             <ShuffleIcon active={shuffle} />
//           </ToggleButton>

//           {/* Volume */}
//           <div className="flex items-center gap-1 ms-2">
//             <IconButton onClick={toggleMute} title="השתק (M)" ariaLabel="השתק">
//               {muted || vol === 0 ? (
//                 <MuteIcon />
//               ) : vol < 0.5 ? (
//                 <VolLowIcon />
//               ) : (
//                 <VolHighIcon />
//               )}
//             </IconButton>
//             <input
//               type="range"
//               min={0}
//               max={1}
//               step={0.01}
//               value={muted ? 0 : vol}
//               onChange={(e) => changeVol(Number(e.currentTarget.value))}
//               className="w-24 h-2 cursor-pointer"
//               aria-label="עוצמת קול"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Audio element */}
//       <audio
//         ref={audioRef}
//         src={track?.src || ""}
//         preload="none"
//         crossOrigin="anonymous"
//         onPlay={() => setPlaying(true)}
//         onPause={() => setPlaying(false)}
//         onError={() => setPlaying(false)}
//       />

//       {/* Queue */}
//       {showQueue && (
//         <div className="mt-3 max-h-64 overflow-auto rounded-2xl border border-black/10 dark:border-white/10">
//           {queue.map((t, i) => {
//             const active = i === index;
//             return (
//               <button
//                 key={t.id}
//                 onClick={() => setIndex(i)}
//                 className={`flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 ${active ? "bg-black/5 dark:bg-white/10" : ""}`}
//               >
//                 <img
//                   src={t.cover || "/assets/images/avatar-chabad.png"}
//                   alt=""
//                   className="size-9 rounded-lg object-cover bg-black/10 dark:bg-white/10"
//                 />
//                 <div className="min-w-0">
//                   <div
//                     className={`truncate text-sm ${active ? `text-${accent}-600 font-semibold` : ""}`}
//                   >
//                     {t.title}
//                   </div>
//                   <div className="truncate text-xs opacity-70">
//                     {t.artist || "Maty Music"}
//                   </div>
//                 </div>
//                 {active && (
//                   <span className={`ms-auto text-xs ${colorCls}`}>
//                     מנגן כעת
//                   </span>
//                 )}
//               </button>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

// /** ===== UI bits ===== */

// function IconButton({
//   onClick,
//   title,
//   ariaLabel,
//   children,
// }: {
//   onClick?: () => void;
//   title?: string;
//   ariaLabel?: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <button
//       onClick={onClick}
//       title={title}
//       aria-label={ariaLabel}
//       className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition"
//     >
//       {children}
//     </button>
//   );
// }

// function ToggleButton({
//   active,
//   onClick,
//   title,
//   ariaLabel,
//   children,
//   accent = "violet",
// }: {
//   active: boolean;
//   onClick?: () => void;
//   title?: string;
//   ariaLabel?: string;
//   children: React.ReactNode;
//   accent?: Props["accent"];
// }) {
//   return (
//     <button
//       onClick={onClick}
//       title={title}
//       aria-label={ariaLabel}
//       className={`inline-flex items-center justify-center h-9 w-9 rounded-lg border transition active:scale-95
//       ${
//         active
//           ? `border-${accent}-600 text-${accent}-600 bg-${accent}-600/10`
//           : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
//       }`}
//     >
//       {children}
//     </button>
//   );
// }

// /** ===== Icons (inline SVG, אין תלות חיצונית) ===== */
// function PlayIcon() {
//   return (
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//       <path d="M8 5v14l11-7z" />
//     </svg>
//   );
// }
// function PauseIcon() {
//   return (
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//       <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
//     </svg>
//   );
// }
// function PrevIcon() {
//   return (
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//       <path d="M6 5h2v14H6zM9 12l10 7V5z" />
//     </svg>
//   );
// }
// function NextIcon() {
//   return (
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//       <path d="M16 12L6 5v14zM18 5h2v14h-2z" />
//     </svg>
//   );
// }
// function LoopIcon({ active }: { active?: boolean }) {
//   return (
//     <svg
//       width="18"
//       height="18"
//       viewBox="0 0 24 24"
//       fill="currentColor"
//       opacity={active ? 1 : 0.6}
//     >
//       <path d="M7 7h7v2H7a3 3 0 0 0 0 6h2v-2l3 3-3 3v-2H7a5 5 0 1 1 0-10zm10 10h-7v-2h7a3 3 0 1 0 0-6h-2v2l-3-3 3-3v2h2a5 5 0 1 1 0 10z" />
//     </svg>
//   );
// }
// function ShuffleIcon({ active }: { active?: boolean }) {
//   return (
//     <svg
//       width="18"
//       height="18"
//       viewBox="0 0 24 24"
//       fill="currentColor"
//       opacity={active ? 1 : 0.6}
//     >
//       <path d="M17 3l4 4-4 4V8h-2.59l-3 3 3 3H17v-3l4 4-4 4v-3h-3.59L8 13l-5 5H1l6-6-6-6h2l5 5 5-5H17V3z" />
//     </svg>
//   );
// }
// function MuteIcon() {
//   return (
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//       <path d="M16.5 12a4.5 4.5 0 0 1-3.9 4.45v2.05a6.5 6.5 0 0 0 0-13v2.05A4.5 4.5 0 0 1 16.5 12zM4 9v6h4l5 5V4L8 9H4z" />
//     </svg>
//   );
// }
// function VolLowIcon() {
//   return (
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//       <path d="M7 9v6h4l5 5V4l-5 5H7z" />
//     </svg>
//   );
// }
// function VolHighIcon() {
//   return (
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//       <path d="M14 3.23v2.06c3.39.49 6 3.39 6 6.71s-2.61 6.22-6 6.71v2.06c4.56-.52 8-4.39 8-8.77s-3.44-8.25-8-8.77zM7 9v6h4l5 5V4l-5 5H7z" />
//     </svg>
//   );
// }
