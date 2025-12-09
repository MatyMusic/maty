// //=============================================================================================================================================================================

// "use client";

// /**
//  * PostComposer — MATY-MUSIC / FLUB · ++Responsive & Motion (FIXED FULL)
//  * - בלי ייבוא לא-נדרש
//  * - טיפוסים מדויקים
//  * - אין רפרנסים חסרים
//  * - RTL + רספונסיביות + נגישות
//  * - טיפול מלא באודיו/תמונות/סקר/תזמון/מיקום
//  */

// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
//   ChangeEvent,
//   KeyboardEvent,
// } from "react";
// import { motion } from "framer-motion";
// import {
//   Image as ImageIcon,
//   Video,
//   Music4,
//   Mic,
//   MapPin,
//   CalendarClock,
//   Send,
//   Smile,
//   Hash,
//   AtSign,
//   Users2,
//   Lock,
//   ShieldCheck,
//   Globe2,
//   Sparkles,
//   Undo2,
//   Redo2,
//   Eye,
//   EyeOff,
//   X,
//   CheckCircle2,
//   Loader2,
//   Trash2,
//   Plus,
//   Minus,
//   AlarmClock,
//   ListChecks,
//   FileAudio2,
//   MessageSquareText,
//   Bookmark,
//   Stars,
// } from "lucide-react";
// import { useResponsive } from "@/hooks/useResponsive";

// /* ============================================================================
//    Keyframes + Utilities (גלובלי)
//    ============================================================================ */
// const GlobalKeyframes = () => (
//   <style
//     dangerouslySetInnerHTML={{
//       __html: `
//       @keyframes glow { 0%,100%{filter:drop-shadow(0 0 0 rgba(109,74,255,0));} 50%{filter:drop-shadow(0 0 16px rgba(109,74,255,.35));} }
//       @keyframes floaty { 0%{transform:translateY(0)} 50%{transform:translateY(-8px)} 100%{transform:translateY(0)} }
//       @keyframes shake { 0%,100%{ transform:translate3d(0,0,0) } 25%{ transform:translate3d(-1px,0,0) } 75%{ transform:translate3d(1px,0,0) } }
//       @keyframes rumble { 0%,100%{ transform:translate3d(0,0,0) rotate(0) } 25%{ transform:translate3d(-0.8px,0.4px,0) rotate(-0.3deg) } 75%{ transform:translate3d(0.8px,-0.4px,0) rotate(0.3deg) } }
//       @keyframes wiggle { 0%,100%{ transform:rotate(0deg) } 25%{ transform:rotate(1.2deg) } 75%{ transform:rotate(-1.2deg) } }
//       @keyframes popIn { 0%{ opacity:0; transform:scale(.96) translateY(6px) } 100%{ opacity:1; transform:scale(1) translateY(0) } }
//       .rumble-soft:hover { animation: rumble .35s ease-in-out; }
//       .pop-in { animation: popIn .22s ease-out both }
//     `,
//     }}
//   />
// );

// function GlobalUtilities() {
//   return (
//     <style
//       dangerouslySetInnerHTML={{
//         __html: `
// .no-scrollbar::-webkit-scrollbar { display: none; }
// .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
// .mm-truncate { max-width: 18ch; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
// @media (min-width: 640px) { .mm-truncate { max-width: 24ch; } }
// @media (min-width: 768px) { .mm-truncate { max-width: none; } }
// .mm-nowrap { white-space: nowrap; }
// .card { will-change: transform, box-shadow; }
// `,
//       }}
//     />
//   );
// }

// /* ============================================================================
//    קבועים
//    ============================================================================ */
// const MAX_CHARS = 3000;
// const AUTOSAVE_KEY = "mm.flub.draft.v2";
// const HISTORY_SIZE = 80;

// const glowPulse = "animate-[glow_2.6s_ease-in-out_infinite]";
// const floatY = "animate-[floaty_8s_ease-in-out_infinite]";

// const fadeUp = {
//   initial: { opacity: 0, y: 18 },
//   animate: { opacity: 1, y: 0 },
//   transition: { duration: 0.28, ease: "easeOut" },
// };

// /* ============================================================================
//    טיפוסים
//    ============================================================================ */
// type Audience = "public" | "community" | "private" | "matchmaker";
// type Mode = "post" | "poll" | "audio";
// type PostVisibility = "visible" | "hidden";

// type UploadImage = { id: string; file: File; url: string };
// type AudioClip = {
//   id: string;
//   file?: File;
//   url?: string;
//   durationMs?: number;
//   waveform?: number[];
// };

// type PollOption = { id: string; text: string };
// type PollData = {
//   question: string;
//   options: PollOption[];
//   multi: boolean;
//   durationHours: number;
// };

// /* ============================================================================
//    דאטה קטנים
//    ============================================================================ */
// const EMOJIS = [
//   "😀",
//   "😁",
//   "😂",
//   "🤣",
//   "😊",
//   "😍",
//   "🤩",
//   "🥳",
//   "🙌",
//   "👏",
//   "🙏",
//   "💪",
//   "🔥",
//   "✨",
//   "🎉",
//   "🎵",
//   "🎶",
//   "🎤",
//   "🎧",
//   "🎹",
//   "🥁",
//   "🎷",
//   "🕺",
//   "💃",
//   "🪩",
//   "💜",
//   "💙",
//   "💚",
//   "💛",
//   "🧡",
//   "❤️",
//   "🤍",
//   "⭐",
//   "🌟",
//   "🌈",
//   "☀️",
//   "🌙",
//   "⚡",
//   "❄️",
//   "🍰",
//   "🍩",
//   "🍿",
//   "🍫",
//   "🍎",
//   "🍯",
//   "☕",
//   "🍵",
//   "🎁",
//   "📸",
//   "🎬",
//   "🧭",
//   "🧠",
//   "🎯",
//   "🏆",
//   "🧿",
//   "🕊️",
//   "✡️",
//   "🕯️",
//   "📖",
//   "🎭",
//   "🧑‍🎤",
// ];

// const HASHTAG_SUGGESTIONS = [
//   "#חופה",
//   "#אירוע",
//   "#חתונה",
//   "#בר_מצווה",
//   "#בת_מצווה",
//   "#התוועדות",
//   "#ניגונים",
//   "#חב״ד",
//   "#770",
//   "#בית_חיינו",
//   "#הרבי",
//   "#ים_תיכוני",
//   "#בלדות",
//   "#סט_מקפיץ",
//   "#לייב",
//   "#פלייליסט",
//   "#נגינה",
//   "#שידוכים",
//   "#קהילה",
//   "#שבת",
//   "#שמחה",
// ];

// const MENTION_SUGGESTIONS = [
//   "@admin",
//   "@maty",
//   "@moderator",
//   "@shadchanit",
//   "@merav",
//   "@levi",
//   "@moshe",
//   "@sara",
//   "@miri",
//   "@david",
// ];

// const QUICK_TEMPLATES: Array<{
//   id: string;
//   title: string;
//   text: string;
//   tags?: string[];
// }> = [
//   {
//     id: "farbrengen-770",
//     title: "התוועדות 770 — שידור חי",
//     text: `מזמינים אתכם להתוועדות חמה מבית חיינו 770!

// נשיר יחד ניגוני חב"ד, נספר סיפורים מהרבי שליט"א מלך המשיח, ונרים את האווירה בע"ה!

// מוזמנים לכתוב בתגובות איזה ניגון תרצו שננגן 🎵`,
//     tags: ["#התוועדות", "#770", "#בית_חיינו", "#הרבי", "#ניגונים"],
//   },
//   {
//     id: "wedding-set",
//     title: "סט מקפיץ לחתונה",
//     text: "פותחים סט מקפיץ במיוחד לזוג הטרי! יש לכם שיר חובה? כתבו לנו בתגובות ✨",
//     tags: ["#חתונה", "#סט_מקפיץ", "#לייב"],
//   },
//   {
//     id: "shiduch-night",
//     title: "ערב שידוכים מוזיקלי",
//     text: "מפגש היכרות מוזיקלי בסגנון נקי ומכבד. שירים שקטים, ניגונים מרוממים, והזדמנות להכיר. מוזמנים להרשם ולהציע שירים. 💜",
//     tags: ["#שידוכים", "#קהילה", "#אווירה"],
//   },
// ];

// /* ============================================================================
//    Markdown-lite
//    ============================================================================ */
// function renderMarkdownLite(src: string): React.ReactNode {
//   const parts = src.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|https?:\/\/\S+)/g);
//   return parts.map((p, i) => {
//     if (p.startsWith("**") && p.endsWith("**"))
//       return <strong key={i}>{p.slice(2, -2)}</strong>;
//     if (p.startsWith("_") && p.endsWith("_"))
//       return <em key={i}>{p.slice(1, -1)}</em>;
//     if (p.startsWith("`") && p.endsWith("`"))
//       return (
//         <code key={i} className="rounded bg-black/5 dark:bg-white/10 px-1">
//           {p.slice(1, -1)}
//         </code>
//       );
//     if (p.startsWith("http://") || p.startsWith("https://"))
//       return (
//         <a
//           key={i}
//           href={p}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="underline"
//         >
//           {p}
//         </a>
//       );
//     const lines = p.split("\n");
//     return lines.map((l, j) => (
//       <React.Fragment key={`${i}-${j}`}>
//         {l}
//         {j < lines.length - 1 ? <br /> : null}
//       </React.Fragment>
//     ));
//   });
// }

// /* ============================================================================
//    קומפוננטים קטנים
//    ============================================================================ */
// function ToolbarScroller({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="relative">
//       <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white/90 dark:from-neutral-950/90 to-transparent z-10 rounded-r" />
//       <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white/90 dark:from-neutral-950/90 to-transparent z-10 rounded-l" />
//       <div className="flex gap-2 overflow-x-auto no-scrollbar px-2 sm:px-0 snap-x snap-mandatory [scrollbar-gutter:stable]">
//         {children}
//       </div>
//     </div>
//   );
// }

// function ToolbarButton({
//   icon,
//   label,
//   onClick,
//   active = false,
//   disabled = false,
//   title,
// }: {
//   icon: React.ReactNode;
//   label: string;
//   onClick?: () => void;
//   active?: boolean;
//   disabled?: boolean;
//   title?: string;
// }) {
//   return (
//     <motion.button
//       type="button"
//       whileTap={{ scale: 0.98 }}
//       onClick={onClick}
//       disabled={disabled}
//       title={title || label}
//       aria-label={label}
//       className={[
//         "inline-flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition select-none snap-start",
//         active
//           ? "bg-violet-600 text-white border-violet-700 hover:brightness-110"
//           : "bg-white/70 dark:bg-neutral-950/60 border-neutral-200/70 dark:border-neutral-800/60 hover:bg-white/90 dark:hover:bg-neutral-900/80",
//         disabled ? "opacity-50 cursor-not-allowed" : "",
//         "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60",
//         "rumble-soft",
//       ].join(" ")}
//     >
//       <span className="shrink-0">{icon}</span>
//       <span className="truncate max-w-[9ch] sm:max-w-[12ch] md:max-w-none whitespace-nowrap">
//         {label}
//       </span>
//     </motion.button>
//   );
// }

// function StatPill({ icon, text }: { icon: React.ReactNode; text: string }) {
//   return (
//     <div className="inline-flex min-w-0 items-center gap-2 rounded-full px-3 py-1 border dark:border-white/10 bg-white/70 dark:bg-neutral-950/70">
//       <span className="shrink-0">{icon}</span>
//       <span className="text-xs truncate max-w-[20ch] md:max-w-none">
//         {text}
//       </span>
//     </div>
//   );
// }

// function Chip({
//   children,
//   selected,
//   onToggle,
// }: {
//   children: React.ReactNode;
//   selected?: boolean;
//   onToggle?: () => void;
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onToggle}
//       className={[
//         "rounded-full px-3 py-1 text-xs border transition select-none",
//         selected
//           ? "bg-violet-600 text-white border-violet-700 hover:brightness-110"
//           : "bg-white/70 dark:bg-neutral-950/60 border-neutral-200/70 dark:border-neutral-800/60 hover:bg-white/90 dark:hover:bg-neutral-900/80",
//       ].join(" ")}
//     >
//       <span className="truncate max-w-[20ch] md:max-w-none whitespace-nowrap">
//         {children}
//       </span>
//     </button>
//   );
// }

// function ImagePreviewGrid({
//   images,
//   onRemove,
// }: {
//   images: UploadImage[];
//   onRemove: (id: string) => void;
// }) {
//   if (!images.length) return null;
//   return (
//     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
//       {images.map((img) => (
//         <div
//           key={img.id}
//           className="relative rounded-xl overflow-hidden border dark:border-white/10"
//         >
//           <img
//             src={img.url}
//             alt="preview"
//             className="w-full aspect-[4/3] object-cover"
//           />
//           <button
//             type="button"
//             title="הסר"
//             aria-label="הסר"
//             onClick={() => onRemove(img.id)}
//             className="absolute top-1 left-1 rounded-full bg-black/60 text-white p-1 hover:bg-black/80"
//           >
//             <X className="w-4 h-4" />
//           </button>
//         </div>
//       ))}
//     </div>
//   );
// }

// function AudioPreview({
//   clip,
//   onRemove,
// }: {
//   clip: AudioClip | null;
//   onRemove: () => void;
// }) {
//   if (!clip) return null;
//   return (
//     <div className="mt-3 rounded-xl border dark:border-white/10 p-3 pop-in">
//       <div className="flex items-center justify-between">
//         <div className="font-semibold text-sm">אודיו מצורף</div>
//         <button
//           className="rounded-full bg-black/50 text-white p-1 hover:bg-black/70"
//           onClick={onRemove}
//           title="הסר אודיו"
//           aria-label="הסר אודיו"
//         >
//           <Trash2 className="w-4 h-4" />
//         </button>
//       </div>
//       <div className="mt-2">
//         {clip.url ? (
//           <audio controls src={clip.url} className="w-full">
//             הדפדפן לא תומך בנגן האודיו.
//           </audio>
//         ) : (
//           <div className="text-xs opacity-70">הקלטה תוצג כאן…</div>
//         )}
//       </div>
//       <div className="mt-2 h-10 flex items-end gap-0.5">
//         {(clip.waveform || makeWaveform(60)).map((h, i) => (
//           <div
//             key={i}
//             className="w-1 bg-violet-500/50"
//             style={{ height: `${Math.max(4, Math.min(36, h))}px` }}
//           />
//         ))}
//       </div>
//       <div className="text-xs opacity-70 mt-1">
//         משך משוער: {clip.durationMs ? Math.round(clip.durationMs / 1000) : "?"}{" "}
//         שנ׳
//       </div>
//     </div>
//   );
// }

// function AudienceSelector({
//   value,
//   onChange,
// }: {
//   value: Audience;
//   onChange: (v: Audience) => void;
// }) {
//   const opts: {
//     key: Audience;
//     label: string;
//     icon: React.ReactNode;
//     desc: string;
//   }[] = [
//     {
//       key: "public",
//       label: "ציבורי",
//       icon: <Globe2 className="w-4 h-4" />,
//       desc: "כולם יכולים לראות",
//     },
//     {
//       key: "community",
//       label: "קהילה",
//       icon: <Users2 className="w-4 h-4" />,
//       desc: "רק משתמשים מאומתים",
//     },
//     {
//       key: "private",
//       label: "פרטי",
//       icon: <Lock className="w-4 h-4" />,
//       desc: "רק אתה/צוות",
//     },
//     {
//       key: "matchmaker",
//       label: "שדכנית",
//       icon: <ShieldCheck className="w-4 h-4" />,
//       desc: "נראה רק לשדכנית/רכזת",
//     },
//   ];

//   return (
//     <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2 items-stretch auto-rows-fr">
//       {opts.map((o) => (
//         <button
//           key={o.key}
//           type="button"
//           onClick={() => onChange(o.key)}
//           className={[
//             "w-full h-full overflow-hidden rounded-xl border p-3 text-right transition",
//             o.key === value
//               ? "bg-violet-600/10 border-violet-300/50 dark:border-violet-500/30"
//               : "bg-white/60 dark:bg-neutral-950/60 border-neutral-200/70 dark:border-neutral-800/60 hover:bg-white/90 dark:hover:bg-neutral-900/80",
//           ].join(" ")}
//         >
//           <div className="flex items-start justify-between gap-2 min-w-0">
//             <div className="min-w-0">
//               <div className="font-semibold text-sm flex items-center gap-2 min-w-0">
//                 <span className="shrink-0">{o.icon}</span>
//                 <span className="truncate block">{o.label}</span>
//               </div>
//               <div className="text-[11px] opacity-70 truncate" title={o.desc}>
//                 {o.desc}
//               </div>
//             </div>
//             {o.key === value ? (
//               <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
//             ) : (
//               <span className="shrink-0" />
//             )}
//           </div>
//         </button>
//       ))}
//     </div>
//   );
// }

// function PollEditor({
//   value,
//   onChange,
// }: {
//   value: PollData;
//   onChange: (v: PollData) => void;
// }) {
//   const setField = <K extends keyof PollData>(k: K, v: PollData[K]) =>
//     onChange({ ...value, [k]: v });
//   const addOption = () => {
//     if (value.options.length >= 6) return;
//     onChange({
//       ...value,
//       options: [...value.options, { id: cryptoRandomId(), text: "" }],
//     });
//   };
//   const rmOption = (id: string) =>
//     onChange({ ...value, options: value.options.filter((o) => o.id !== id) });
//   const changeText = (id: string, text: string) =>
//     onChange({
//       ...value,
//       options: value.options.map((o) => (o.id === id ? { ...o, text } : o)),
//     });

//   return (
//     <div className="rounded-2xl border dark:border-white/10 p-3">
//       <div className="font-semibold text-sm flex items-center gap-2">
//         <ListChecks className="w-4 h-4" /> סקר
//       </div>
//       <div className="mt-2">
//         <label className="text-xs opacity-80">שאלה</label>
//         <input
//           value={value.question}
//           onChange={(e) => setField("question", e.target.value)}
//           placeholder="על מה תרצה לקבל הצבעה?"
//           className="input-base mt-1"
//         />
//       </div>
//       <div className="mt-2 space-y-2">
//         {value.options.map((o, i) => (
//           <div key={o.id} className="flex items-center gap-2 min-w-0">
//             <input
//               value={o.text}
//               onChange={(e) => changeText(o.id, e.target.value)}
//               placeholder={`אפשרות ${i + 1}`}
//               className="input-base flex-1 min-w-0"
//               maxLength={120}
//             />
//             <button
//               type="button"
//               onClick={() => rmOption(o.id)}
//               className="rounded-lg border px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-900"
//               title="הסר אפשרות"
//             >
//               <Minus className="w-4 h-4" />
//             </button>
//           </div>
//         ))}
//         <div className="flex justify-end">
//           <button
//             type="button"
//             onClick={addOption}
//             className="rounded-lg border px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-900 inline-flex items-center gap-2"
//           >
//             <Plus className="w-4 h-4" /> הוסף אפשרות
//           </button>
//         </div>
//       </div>
//       <div className="mt-3 grid md:grid-cols-3 gap-2">
//         <label className="text-right">
//           <span className="text-xs opacity-80">משך (שעות)</span>
//           <input
//             type="number"
//             min={1}
//             max={240}
//             value={value.durationHours}
//             onChange={(e) =>
//               setField(
//                 "durationHours",
//                 Math.max(1, Math.min(240, Number(e.target.value) || 1)),
//               )
//             }
//             className="input-base mt-1"
//           />
//         </label>
//         <label className="text-right flex items-center gap-2 md:justify-end">
//           <input
//             type="checkbox"
//             checked={value.multi}
//             onChange={(e) => setField("multi", e.target.checked)}
//           />
//           <span className="text-sm">אפשר לבחור כמה</span>
//         </label>
//         <div className="text-xs opacity-70 md:text-right">
//           * עד 6 אפשרויות. ניתן להפעיל/לכבות ריבוי בחירות.
//         </div>
//       </div>
//     </div>
//   );
// }

// function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
//   const [limit, setLimit] = React.useState(48);
//   const cols =
//     "grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 gap-1.5 place-items-center";
//   return (
//     <div className="rounded-2xl border dark:border-white/10 p-3">
//       <div className="font-semibold text-sm flex items-center gap-2">
//         <Smile className="w-4 h-4" /> אמוג׳ים
//       </div>
//       <div className={`mt-2 ${cols} max-h-40 overflow-y-auto pr-1`}>
//         {EMOJIS.slice(0, limit).map((e) => (
//           <button
//             key={e}
//             onClick={() => onPick(e)}
//             type="button"
//             className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
//             aria-label={`emoji ${e}`}
//             title={e}
//           >
//             <span className="text-xl leading-none">{e}</span>
//           </button>
//         ))}
//       </div>
//       <div className="mt-2 flex items-center justify-between">
//         {limit < EMOJIS.length ? (
//           <button
//             onClick={() => setLimit(limit + 48)}
//             className="rounded-xl border px-3 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900"
//           >
//             טען עוד
//           </button>
//         ) : (
//           <span className="text-xs opacity-60">כל האימוג׳ים נטענו</span>
//         )}
//         <span className="text-[11px] opacity-60">גלול למטה לעוד</span>
//       </div>
//     </div>
//   );
// }

// function HashtagSuggestions({
//   onPick,
//   selected,
// }: {
//   onPick: (tag: string) => void;
//   selected: string[];
// }) {
//   return (
//     <div className="rounded-2xl border dark:border-white/10 p-3">
//       <div className="font-semibold text-sm flex items-center gap-2">
//         <Hash className="w-4 h-4" /> האשטגים
//       </div>
//       <div className="mt-2 flex flex-wrap gap-2">
//         {HASHTAG_SUGGESTIONS.map((t) => (
//           <Chip
//             key={t}
//             selected={selected.includes(t)}
//             onToggle={() => onPick(t)}
//           >
//             {t}
//           </Chip>
//         ))}
//       </div>
//     </div>
//   );
// }

// function MentionSuggestions({ onPick }: { onPick: (mention: string) => void }) {
//   return (
//     <div className="rounded-2xl border dark:border-white/10 p-3">
//       <div className="font-semibold text-sm flex items-center gap-2">
//         <AtSign className="w-4 h-4" /> אזכורים
//       </div>
//       <div className="mt-2 flex flex-wrap gap-2">
//         {MENTION_SUGGESTIONS.map((m) => (
//           <Chip key={m} onToggle={() => onPick(m)}>
//             {m}
//           </Chip>
//         ))}
//       </div>
//     </div>
//   );
// }

// function MarkdownPreview({ text }: { text: string }) {
//   if (!text.trim()) return null;
//   return (
//     <div className="rounded-2xl border dark:border-white/10 p-3 bg-white/80 dark:bg-neutral-950/80">
//       <div className="font-semibold text-sm flex items-center gap-2">
//         <Eye className="w-4 h-4" /> תצוגה מקדימה
//       </div>
//       <div className="prose dark:prose-invert rtl text-right max-w-none prose-p:my-2 prose-ul:my-1 prose-li:my-0 text-sm mt-2">
//         {renderMarkdownLite(text)}
//       </div>
//     </div>
//   );
// }

// function SquareStopIcon() {
//   return (
//     <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current">
//       <rect x="6" y="6" width="12" height="12" rx="2"></rect>
//     </svg>
//   );
// }

// function VideoEmbed({ url }: { url: string }) {
//   const p = parseVideo(url);
//   if (!url.trim()) return <div className="text-xs opacity-70">אין וידאו</div>;
//   if (p.type === "youtube" && p.id) {
//     return (
//       <div className="aspect-video rounded-xl overflow-hidden border dark:border-white/10">
//         <iframe
//           src={`https://www.youtube.com/embed/${p.id}`}
//           className="w-full h-full"
//           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//           allowFullScreen
//           title="YouTube preview"
//         />
//       </div>
//     );
//   }
//   if (p.type === "vimeo" && p.id) {
//     return (
//       <div className="aspect-video rounded-xl overflow-hidden border dark:border-white/10">
//         <iframe
//           src={`https://player.vimeo.com/video/${p.id}`}
//           className="w-full h-full"
//           allow="autoplay; fullscreen; picture-in-picture"
//           allowFullScreen
//           title="Vimeo preview"
//         />
//       </div>
//     );
//   }
//   return <div className="text-xs opacity-70">לינק לא נתמך להצגה מקדימה</div>;
// }

// function QuickTemplates({
//   onInsert,
// }: {
//   onInsert: (text: string, tags?: string[]) => void;
// }) {
//   return (
//     <div className="rounded-2xl border dark:border-white/10 p-3">
//       <div className="font-semibold text-sm flex items-center gap-2">
//         <Stars className="w-4 h-4" /> תבניות מהירות (770/חב"ד)
//       </div>
//       <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
//         {QUICK_TEMPLATES.map((tpl) => (
//           <button
//             key={tpl.id}
//             type="button"
//             className="card text-right hover:translate-y-[-1px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
//             onClick={() => onInsert(tpl.text, tpl.tags)}
//             title={tpl.title}
//           >
//             <div className="font-semibold text-sm truncate">{tpl.title}</div>
//             <div className="text-xs opacity-80 line-clamp-3 mt-1">
//               {tpl.text}
//             </div>
//             {tpl.tags?.length ? (
//               <div className="mt-2 flex flex-wrap gap-1">
//                 {tpl.tags.map((t) => (
//                   <span
//                     key={t}
//                     className="text-[10px] px-2 py-0.5 rounded-full border dark:border-white/10"
//                   >
//                     {t}
//                   </span>
//                 ))}
//               </div>
//             ) : null}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }

// /* ============================================================================
//    Utilities
//    ============================================================================ */
// function cryptoRandomId() {
//   if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
//     // @ts-ignore
//     return crypto.randomUUID();
//   }
//   return "id_" + Math.random().toString(16).slice(2);
// }
// function clamp(n: number, a: number, b: number) {
//   return Math.max(a, Math.min(b, n));
// }
// function makeWaveform(n = 48): number[] {
//   return Array.from({ length: n }, () => Math.floor(6 + Math.random() * 36));
// }
// function useHistoryState(initial: string) {
//   const [value, setValue] = useState(initial);
//   const history = useRef<string[]>([initial]);
//   const idx = useRef(0);
//   const push = useCallback((v: string) => {
//     if (history.current[idx.current] === v) return;
//     history.current = history.current.slice(0, idx.current + 1);
//     history.current.push(v);
//     if (history.current.length > HISTORY_SIZE) history.current.shift();
//     else idx.current++;
//     setValue(v);
//   }, []);
//   const undo = useCallback(() => {
//     if (idx.current <= 0) return;
//     idx.current--;
//     setValue(history.current[idx.current]);
//   }, []);
//   const redo = useCallback(() => {
//     if (idx.current >= history.current.length - 1) return;
//     idx.current++;
//     setValue(history.current[idx.current]);
//   }, []);
//   return { value, setValue: push, undo, redo };
// }
// function useAutosave<T>(key: string, state: T, deps: any[]) {
//   useEffect(() => {
//     try {
//       localStorage.setItem(key, JSON.stringify(state));
//     } catch {}
//   }, deps);
// }
// function loadAutosave<T>(key: string, fallback: T): T {
//   if (typeof window === "undefined") return fallback;
//   try {
//     const raw = localStorage.getItem(key);
//     return raw ? (JSON.parse(raw) as T) : fallback;
//   } catch {
//     return fallback;
//   }
// }
// function toast(text: string, type: "success" | "error" | "info" = "info") {
//   if (typeof window !== "undefined")
//     window.dispatchEvent(
//       new CustomEvent("mm:toast", { detail: { type, text } }),
//     );
// }
// function parseVideo(url: string): {
//   type: "youtube" | "vimeo" | "other";
//   id?: string;
// } {
//   try {
//     const u = new URL(url);
//     if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
//       const id = u.hostname.includes("youtu.be")
//         ? u.pathname.slice(1)
//         : u.searchParams.get("v") || undefined;
//       return { type: "youtube", id };
//     }
//     if (u.hostname.includes("vimeo.com")) {
//       const id = u.pathname.split("/").filter(Boolean)[0];
//       return { type: "vimeo", id };
//     }
//   } catch {}
//   return { type: "other" };
// }

// /* ============================================================================
//    SchedulePicker
//    ============================================================================ */
// type SchedulePickerProps = {
//   dt: string | null;
//   onChange: (iso: string | null) => void;
// };

// function SchedulePicker({ dt, onChange }: SchedulePickerProps) {
//   const [date, time] = useMemo(() => {
//     if (!dt) return ["", ""] as const;
//     const d = new Date(dt);
//     const y = d.getFullYear();
//     const m = String(d.getMonth() + 1).padStart(2, "0");
//     const day = String(d.getDate()).padStart(2, "0");
//     const hh = String(d.getHours()).padStart(2, "0");
//     const mm = String(d.getMinutes()).padStart(2, "0");
//     return [`${y}-${m}-${day}`, `${hh}:${mm}`] as const;
//   }, [dt]);

//   const setDate = (v: string) => {
//     if (!v && !time) return onChange(null);
//     const now = new Date();
//     const [hh, mm] = (time || "12:00").split(":").map(Number);
//     const d = v ? new Date(v) : now;
//     d.setHours(hh || 12, mm || 0, 0, 0);
//     onChange(d.toISOString());
//   };

//   const setTime = (v: string) => {
//     const [hh, mm] = (v || "12:00").split(":").map(Number);
//     const base = date ? new Date(date) : new Date();
//     base.setHours(hh || 12, mm || 0, 0, 0);
//     onChange(base.toISOString());
//   };

//   return (
//     <div className="rounded-2xl border dark:border-white/10 p-3">
//       <div className="font-semibold text-sm flex items-center gap-2">
//         <CalendarClock className="w-4 h-4" /> תזמון פרסום
//       </div>
//       <div className="grid md:grid-cols-2 gap-2 mt-2">
//         <label className="text-right">
//           <span className="text-xs opacity-80">תאריך</span>
//           <input
//             type="date"
//             value={date}
//             onChange={(e) => setDate(e.target.value)}
//             className="input-base mt-1"
//           />
//         </label>
//         <label className="text-right">
//           <span className="text-xs opacity-80">שעה</span>
//           <input
//             type="time"
//             value={time}
//             onChange={(e) => setTime(e.target.value)}
//             className="input-base mt-1"
//           />
//         </label>
//       </div>
//       <div className="text-xs opacity-70 mt-1">
//         * אם לא תבחר/י — נפרסם מייד לאחר שליחה.
//       </div>
//     </div>
//   );
// }

// /* ============================================================================
//    קומפוננטה ראשית
//    ============================================================================ */
// export default function PostComposer() {
//   const R = useResponsive();

//   const [mode, setMode] = useState<Mode>("post");
//   const textHist = useHistoryState("");
//   const [charsLeft, setCharsLeft] = useState(MAX_CHARS);
//   const [images, setImages] = useState<UploadImage[]>([]);
//   const [videoUrl, setVideoUrl] = useState("");
//   const [audio, setAudio] = useState<AudioClip | null>(null);
//   const [audience, setAudience] = useState<Audience>("community");
//   const [visibility, setVisibility] = useState<PostVisibility>("visible");
//   const [scheduleISO, setScheduleISO] = useState<string | null>(null);
//   const [hashtags, setHashtags] = useState<string[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [preview, setPreview] = useState(true);
//   const [recording, setRecording] = useState(false);
//   const [poll, setPoll] = useState<PollData>({
//     question: "",
//     options: [
//       { id: cryptoRandomId(), text: "" },
//       { id: cryptoRandomId(), text: "" },
//     ],
//     multi: false,
//     durationHours: 24,
//   });
//   const [location, setLocation] = useState<{ lat: number; lon: number } | null>(
//     null,
//   );

//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const audioInputRef = useRef<HTMLInputElement | null>(null);
//   const recorderRef = useRef<MediaRecorder | null>(null);
//   const chunksRef = useRef<Blob[]>([]);

//   // אוטוסייב לוד
//   useEffect(() => {
//     const data = loadAutosave<any>(AUTOSAVE_KEY, null as any);
//     if (data) {
//       try {
//         if (typeof data.text === "string") textHist.setValue(data.text);
//         if (Array.isArray(data.hashtags)) setHashtags(data.hashtags);
//         if (typeof data.videoUrl === "string") setVideoUrl(data.videoUrl);
//         if (typeof data.mode === "string") setMode(data.mode as Mode);
//         if (typeof data.audience === "string")
//           setAudience(data.audience as Audience);
//         if (typeof data.visibility === "string")
//           setVisibility(data.visibility as PostVisibility);
//         if (data.scheduleISO) setScheduleISO(data.scheduleISO);
//       } catch {}
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // אוטוסייב
//   useAutosave(
//     AUTOSAVE_KEY,
//     {
//       text: textHist.value,
//       hashtags,
//       videoUrl,
//       mode,
//       audience,
//       visibility,
//       scheduleISO,
//     },
//     [
//       textHist.value,
//       hashtags,
//       videoUrl,
//       mode,
//       audience,
//       visibility,
//       scheduleISO,
//     ],
//   );

//   useEffect(() => {
//     setCharsLeft(
//       clamp(MAX_CHARS - (textHist.value?.length || 0), 0, MAX_CHARS),
//     );
//   }, [textHist.value]);

//   const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.ctrlKey || e.metaKey) {
//       if (e.key.toLowerCase() === "z") {
//         e.preventDefault();
//         if (e.shiftKey) textHist.redo();
//         else textHist.undo();
//       }
//     }
//   };

//   // תמונות
//   const onPickImages = (e: ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(e.target.files || []);
//     if (!files.length) return;
//     const newOnes: UploadImage[] = files
//       .slice(0, 12 - images.length)
//       .map((f) => ({
//         id: cryptoRandomId(),
//         file: f,
//         url: URL.createObjectURL(f),
//       }));
//     setImages((arr) => [...arr, ...newOnes]);
//     e.target.value = "";
//   };
//   const removeImage = (id: string) => {
//     setImages((arr) => {
//       const target = arr.find((x) => x.id === id);
//       if (target) URL.revokeObjectURL(target.url);
//       return arr.filter((x) => x.id !== id);
//     });
//   };

//   // אודיו
//   const onPickAudio = (e: ChangeEvent<HTMLInputElement>) => {
//     const f = e.target.files?.[0];
//     if (!f) return;
//     const url = URL.createObjectURL(f);
//     setAudio({
//       id: cryptoRandomId(),
//       file: f,
//       url,
//       durationMs: undefined,
//       waveform: makeWaveform(60),
//     });
//     e.target.value = "";
//   };
//   const removeAudio = () => {
//     if (audio?.url) URL.revokeObjectURL(audio.url);
//     setAudio(null);
//   };

//   // הקלטה
//   const startRecording = async () => {
//     if (!navigator.mediaDevices?.getUserMedia) {
//       toast("הדפדפן לא תומך בהקלטה", "error");
//       return;
//     }
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const rec = new MediaRecorder(stream);
//       recorderRef.current = rec;
//       chunksRef.current = [];
//       rec.ondataavailable = (ev) => chunksRef.current.push(ev.data);
//       rec.onstop = () => {
//         const blob = new Blob(chunksRef.current, { type: "audio/webm" });
//         const url = URL.createObjectURL(blob);
//         setAudio({
//           id: cryptoRandomId(),
//           file: new File([blob], `recording_${Date.now()}.webm`, {
//             type: "audio/webm",
//           }),
//           url,
//           durationMs: undefined,
//           waveform: makeWaveform(70),
//         });
//       };
//       rec.start();
//       setRecording(true);
//     } catch {
//       toast("שגיאה בהקלטה", "error");
//     }
//   };
//   const stopRecording = () => {
//     const rec = recorderRef.current;
//     if (rec && rec.state !== "inactive") {
//       rec.stop();
//       rec.stream.getTracks().forEach((t) => t.stop());
//     }
//     recorderRef.current = null;
//     setRecording(false);
//   };

//   // מיקום
//   const askLocation = () => {
//     if (!navigator.geolocation) {
//       toast("הדפדפן לא תומך בגאולוקציה", "error");
//       return;
//     }
//     navigator.geolocation.getCurrentPosition(
//       (pos) =>
//         setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
//       () => toast("לא ניתן להשיג מיקום", "error"),
//       { enableHighAccuracy: true, timeout: 8000 },
//     );
//   };

//   // אסיסט לטוקנים
//   const addToken = (token: string) => {
//     const sep = textHist.value && !/\s$/.test(textHist.value) ? " " : "";
//     textHist.setValue(textHist.value + sep + token + " ");
//   };
//   const toggleHashtag = (tag: string) =>
//     setHashtags((arr) =>
//       arr.includes(tag) ? arr.filter((t) => t !== tag) : [...arr, tag],
//     );

//   // תבנית מהירה
//   const insertTemplate = (text: string, tags?: string[]) => {
//     const sep = textHist.value ? "\n\n" : "";
//     textHist.setValue((textHist.value || "") + sep + text);
//     if (tags?.length) {
//       const add = tags.filter((t) => !hashtags.includes(t));
//       if (add.length) setHashtags((h) => [...h, ...add]);
//     }
//     toast("תבנית הוזרקה", "success");
//   };

//   // שליחה
//   const onSubmit = async () => {
//     if (
//       !textHist.value.trim() &&
//       !images.length &&
//       !videoUrl &&
//       !audio &&
//       mode !== "poll"
//     ) {
//       toast("אין תוכן לשליחה", "error");
//       return;
//     }
//     if (mode === "poll" && !poll.question.trim()) {
//       toast("סקר חייב שאלה", "error");
//       return;
//     }
//     try {
//       setLoading(true);
//       const payload: any = {
//         mode,
//         text: textHist.value,
//         hashtags,
//         videoUrl: videoUrl || null,
//         audience,
//         visibility,
//         scheduleISO,
//         location,
//         poll: mode === "poll" ? poll : null,
//         images: images.map((img) => ({
//           name: img.file.name,
//           size: img.file.size,
//         })),
//         audio: audio
//           ? { name: audio.file?.name, size: audio.file?.size }
//           : null,
//       };
//       const res = await fetch("/api/flub/posts", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       if (!res.ok) throw new Error("שליחה נכשלה");

//       toast("הפוסט הוגש, מחכים לאישור/פרסום", "success");

//       // reset
//       textHist.setValue("");
//       setImages((arr) => {
//         arr.forEach((x) => URL.revokeObjectURL(x.url));
//         return [];
//       });
//       if (audio?.url) URL.revokeObjectURL(audio.url);
//       setAudio(null);
//       setVideoUrl("");
//       setPoll({
//         question: "",
//         options: [
//           { id: cryptoRandomId(), text: "" },
//           { id: cryptoRandomId(), text: "" },
//         ],
//         multi: false,
//         durationHours: 24,
//       });
//       setScheduleISO(null);
//       setHashtags([]);
//     } catch (err: any) {
//       toast(err?.message || "שגיאת רשת", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const counterColor = useMemo(() => {
//     const ratio = 1 - charsLeft / MAX_CHARS;
//     if (ratio < 0.5) return "text-emerald-600";
//     if (ratio < 0.8) return "text-amber-600";
//     return "text-red-600";
//   }, [charsLeft]);

//   return (
//     <section className="section-padding overflow-x-hidden" dir="rtl">
//       <GlobalKeyframes />
//       <GlobalUtilities />

//       {/* רקע אנימטיבי קל */}
//       <div className="absolute -z-10 inset-0 pointer-events-none">
//         <div
//           aria-hidden
//           className={`absolute inset-x-0 -top-24 mx-auto h-[240px] w-[min(100%,900px)] rounded-[56px] blur-3xl bg-[radial-gradient(60%_60%_at_50%_50%,rgba(109,74,255,.26),rgba(109,74,255,0)_65%)] ${glowPulse}`}
//         />
//         <div
//           aria-hidden
//           className={`absolute inset-x-0 top-12 mx-auto h-[220px] w-[min(100%,700px)] rounded-[56px] blur-3xl bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,134,98,.22),rgba(255,134,98,0)_65%)] ${floatY}`}
//         />
//       </div>

//       <div className="container-section">
//         <motion.div {...fadeUp} className="card">
//           {/* Header */}
//           <div className="flex items-center justify-between gap-3">
//             <div className="text-right min-w-0">
//               <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 border dark:border-white/10 bg-white/70 dark:bg-neutral-950/70">
//                 <Sparkles className="w-4 h-4 text-violet-600" />
//                 <span className="text-xs opacity-80 truncate">
//                   קומפוזר פוסטים
//                 </span>
//               </div>
//               <h2 className="mt-2 text-xl font-extrabold truncate">
//                 פרסם משהו חדש
//               </h2>
//               <div className="mt-1 flex flex-wrap gap-2 justify-end">
//                 <StatPill
//                   icon={<Users2 className="w-3.5 h-3.5" />}
//                   text={R.lg ? "מצב שולחן" : R.md ? "מצב טאבלט" : "מצב מובייל"}
//                 />
//                 <StatPill
//                   icon={<AlarmClock className="w-3.5 h-3.5" />}
//                   text={scheduleISO ? "מתוזמן" : "מיידי"}
//                 />
//                 <StatPill
//                   icon={<Eye className="w-3.5 h-3.5" />}
//                   text={visibility === "visible" ? "נראה" : "מוסתר"}
//                 />
//               </div>
//             </div>
//             <div className="hidden md:flex gap-2">
//               <ToolbarButton
//                 icon={<Undo2 className="w-4 h-4" />}
//                 label="Undo"
//                 onClick={textHist.undo}
//               />
//               <ToolbarButton
//                 icon={<Redo2 className="w-4 h-4" />}
//                 label="Redo"
//                 onClick={textHist.redo}
//               />
//             </div>
//           </div>

//           {/* Modes */}
//           <div className="mt-3">
//             <ToolbarScroller>
//               <ToolbarButton
//                 icon={<MessageSquareText className="w-4 h-4" />}
//                 label="פוסט"
//                 active={mode === "post"}
//                 onClick={() => setMode("post")}
//               />
//               <ToolbarButton
//                 icon={<ListChecks className="w-4 h-4" />}
//                 label="סקר"
//                 active={mode === "poll"}
//                 onClick={() => setMode("poll")}
//               />
//               <ToolbarButton
//                 icon={<Music4 className="w-4 h-4" />}
//                 label="אודיו"
//                 active={mode === "audio"}
//                 onClick={() => setMode("audio")}
//               />
//               <ToolbarButton
//                 icon={<Stars className="w-4 h-4" />}
//                 label="תבניות 770"
//                 onClick={() =>
//                   document
//                     .getElementById("quick-templates")
//                     ?.scrollIntoView({ behavior: "smooth", block: "center" })
//                 }
//               />
//             </ToolbarScroller>
//           </div>

//           {/* Text area */}
//           {mode !== "audio" && (
//             <div className="mt-3">
//               <textarea
//                 className="input-base input-rtl rounded-2xl min-h-[140px] resize-y"
//                 value={textHist.value}
//                 onChange={(e) =>
//                   textHist.setValue(e.target.value.slice(0, MAX_CHARS))
//                 }
//                 onKeyDown={onKeyDown}
//                 placeholder="מה חדש? אפשר **bold**, _italic_, או שים לינק https://…"
//               />
//               <div className="mt-1 flex items-center justify-between gap-2">
//                 <div className={`text-xs ${counterColor}`}>
//                   נותרו {charsLeft} תווים
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <label className="inline-flex items-center gap-2 cursor-pointer rounded-xl border px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-900">
//                     <ImageIcon className="w-4 h-4" />
//                     <span className="text-xs truncate">תמונות</span>
//                     <input
//                       ref={fileInputRef}
//                       type="file"
//                       accept="image/*"
//                       multiple
//                       onChange={onPickImages}
//                       className="hidden"
//                     />
//                   </label>
//                   <label className="inline-flex items-center gap-2 cursor-pointer rounded-xl border px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-900">
//                     <FileAudio2 className="w-4 h-4" />
//                     <span className="text-xs truncate">אודיו</span>
//                     <input
//                       ref={audioInputRef}
//                       type="file"
//                       accept="audio/*"
//                       onChange={onPickAudio}
//                       className="hidden"
//                     />
//                   </label>
//                 </div>
//               </div>

//               {/* Video URL */}
//               <div className="mt-2 grid md:grid-cols-[1fr_auto] gap-2">
//                 <input
//                   value={videoUrl}
//                   onChange={(e) => setVideoUrl(e.target.value)}
//                   placeholder="לינק וידאו (YouTube/Vimeo) — אופציונלי"
//                   className="input-base input-ltr"
//                 />
//                 <div className="flex items-center justify-end gap-2">
//                   <ToolbarButton
//                     icon={<Video className="w-4 h-4" />}
//                     label="בדוק לינק"
//                     onClick={() => {
//                       const parsed = parseVideo(videoUrl);
//                       if (parsed.type === "other")
//                         toast("לא זוהה לינק YouTube/Vimeo", "error");
//                       else
//                         toast(`זוהה ${parsed.type.toUpperCase()}`, "success");
//                     }}
//                   />
//                   <ToolbarButton
//                     icon={
//                       preview ? (
//                         <Eye className="w-4 h-4" />
//                       ) : (
//                         <EyeOff className="w-4 h-4" />
//                       )
//                     }
//                     label={preview ? "הסתר פריוויו" : "הצג פריוויו"}
//                     onClick={() => setPreview((v) => !v)}
//                   />
//                 </div>
//               </div>

//               <ImagePreviewGrid images={images} onRemove={removeImage} />
//             </div>
//           )}

//           {/* Audio mode */}
//           {mode === "audio" && (
//             <div className="mt-3 rounded-2xl border dark:border-white/10 p-3">
//               <div className="flex flex-wrap gap-2 justify-end">
//                 {!recording ? (
//                   <ToolbarButton
//                     icon={<Mic className="w-4 h-4" />}
//                     label="התחל הקלטה"
//                     onClick={startRecording}
//                   />
//                 ) : (
//                   <ToolbarButton
//                     icon={<SquareStopIcon />}
//                     label="עצור הקלטה"
//                     onClick={stopRecording}
//                   />
//                 )}
//                 <ToolbarButton
//                   icon={<FileAudio2 className="w-4 h-4" />}
//                   label="בחר קובץ"
//                   onClick={() => audioInputRef.current?.click()}
//                 />
//               </div>
//               <AudioPreview clip={audio} onRemove={removeAudio} />
//               <div className="mt-3">
//                 <textarea
//                   className="input-base input-rtl rounded-2xl min-h-[100px]"
//                   value={textHist.value}
//                   onChange={(e) =>
//                     textHist.setValue(e.target.value.slice(0, MAX_CHARS))
//                   }
//                   placeholder="כתוב תיאור קצר לאודיו…"
//                 />
//               </div>
//             </div>
//           )}

//           {/* Poll */}
//           {mode === "poll" && (
//             <div className="mt-3">
//               <PollEditor value={poll} onChange={setPoll} />
//             </div>
//           )}

//           {/* Preview markdown & video */}
//           {preview && (textHist.value.trim() || videoUrl) && (
//             <div className="mt-3 grid md:grid-cols-2 gap-3">
//               <MarkdownPreview text={textHist.value} />
//               <div className="rounded-2xl border dark:border-white/10 p-3">
//                 <div className="font-semibold text-sm flex items-center gap-2">
//                   <Video className="w-4 h-4" /> פריוויו וידאו
//                 </div>
//                 <div className="mt-2">
//                   <VideoEmbed url={videoUrl} />
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Quick templates */}
//           <div id="quick-templates" className="mt-3">
//             <QuickTemplates onInsert={insertTemplate} />
//           </div>

//           {/* Tools row */}
//           <div className="mt-3 grid lg:grid-cols-3 gap-3">
//             <EmojiPicker onPick={addToken} />
//             <HashtagSuggestions onPick={toggleHashtag} selected={hashtags} />
//             <MentionSuggestions onPick={addToken} />
//           </div>

//           {/* Audience & schedule */}
//           <div className="mt-3 grid lg:grid-cols-2 gap-3">
//             <AudienceSelector value={audience} onChange={setAudience} />
//             <SchedulePicker dt={scheduleISO} onChange={setScheduleISO} />
//           </div>

//           {/* Visibility + Location */}
//           <div className="mt-3 grid md:grid-cols-2 gap-3">
//             <div className="rounded-2xl border dark:border-white/10 p-3">
//               <div className="font-semibold text-sm flex items-center gap-2">
//                 {visibility === "visible" ? (
//                   <Eye className="w-4 h-4" />
//                 ) : (
//                   <EyeOff className="w-4 h-4" />
//                 )}{" "}
//                 ניראות
//               </div>
//               <div className="mt-2 flex flex-wrap gap-2 justify-end">
//                 <Chip
//                   selected={visibility === "visible"}
//                   onToggle={() => setVisibility("visible")}
//                 >
//                   נראה בפיד
//                 </Chip>
//                 <Chip
//                   selected={visibility === "hidden"}
//                   onToggle={() => setVisibility("hidden")}
//                 >
//                   שמור פרטית
//                 </Chip>
//               </div>
//               <div className="text-xs opacity-70 mt-2">
//                 * אם מוסתר — אפשר לשתף רק קישור ישיר/עם הרשאות מתאימות.
//               </div>
//             </div>

//             <div className="rounded-2xl border dark:border-white/10 p-3">
//               <div className="font-semibold text-sm flex items-center gap-2">
//                 <MapPin className="w-4 h-4" /> מיקום
//               </div>
//               <div className="mt-2 flex items-center justify-between gap-2">
//                 <div className="text-xs opacity-70 min-w-0 truncate">
//                   {location ? (
//                     <>
//                       <span>lat: {location.lat.toFixed(5)}</span> •{" "}
//                       <span>lon: {location.lon.toFixed(5)}</span>
//                     </>
//                   ) : (
//                     "לא נבחר מיקום"
//                   )}
//                 </div>
//                 <ToolbarButton
//                   icon={<MapPin className="w-4 h-4" />}
//                   label="בקש מיקום"
//                   onClick={askLocation}
//                 />
//               </div>
//               <div className="text-xs opacity-60 mt-1">
//                 * אופציונלי. משמש לציון מקום האירוע/הופעה/התוועדות.
//               </div>
//             </div>
//           </div>

//           {/* Selected hashtags */}
//           {hashtags.length > 0 && (
//             <div className="mt-3 rounded-2xl border dark:border-white/10 p-3">
//               <div className="font-semibold text-sm flex items-center gap-2">
//                 <Hash className="w-4 h-4" /> האשטגים נבחרים
//               </div>
//               <div className="mt-2 flex flex-wrap gap-2 justify-end">
//                 {hashtags.map((t) => (
//                   <Chip key={t} selected onToggle={() => toggleHashtag(t)}>
//                     {t}
//                   </Chip>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Submit row */}
//           <div className="mt-4 flex flex-wrap gap-2 justify-end overflow-x-auto no-scrollbar">
//             <button
//               type="button"
//               onClick={() => toast("נשמר כטיוטה (לוקאלי)", "success")}
//               className="rounded-xl border px-3 py-2 text-sm bg-white/70 dark:bg-neutral-950/60 hover:bg-white/90 dark:hover:bg-neutral-900/80"
//             >
//               שמור טיוטה
//             </button>

//             <button
//               type="button"
//               onClick={() => {
//                 textHist.setValue("");
//                 setImages((arr) => {
//                   arr.forEach((x) => URL.revokeObjectURL(x.url));
//                   return [];
//                 });
//                 if (audio?.url) URL.revokeObjectURL(audio.url);
//                 setAudio(null);
//                 setVideoUrl("");
//                 setPoll({
//                   question: "",
//                   options: [
//                     { id: cryptoRandomId(), text: "" },
//                     { id: cryptoRandomId(), text: "" },
//                   ],
//                   multi: false,
//                   durationHours: 24,
//                 });
//                 setScheduleISO(null);
//                 setHashtags([]);
//                 toast("נוקה", "info");
//               }}
//               className="rounded-xl border px-3 py-2 text-sm bg-white/70 dark:bg-neutral-950/60 hover:bg-white/90 dark:hover:bg-neutral-900/80"
//             >
//               נקה שדות
//             </button>

//             <button
//               type="button"
//               disabled={loading}
//               onClick={onSubmit}
//               className="btn bg-brand text-white border-0 px-4 py-2 rounded-xl text-sm hover:opacity-90 disabled:opacity-70 inline-flex items-center gap-2"
//               title="פרסם"
//             >
//               {loading ? (
//                 <Loader2 className="w-4 h-4 animate-spin" />
//               ) : (
//                 <Send className="w-4 h-4" />
//               )}
//               <span>פרסם</span>
//             </button>
//           </div>
//         </motion.div>
//       </div>
//     </section>
//   );
// }

"use client";

/**
 * MATY‑CLUB — /club/compose/page.tsx
 * Single‑file page (no external imports except framer‑motion & lucide‑react)
 * - API: POST /api/club/posts  (FormData when files, JSON when none)
 * - Clear quick‑nav so users see where to create a post
 * - Poll validation (min 2 non‑empty options)
 * - After‑create quick links: open / back to feed / copy URL
 * - RTL, responsive, accessible, Tailwind classes
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ChangeEvent,
  KeyboardEvent,
} from "react";
import { motion } from "framer-motion";
import {
  Image as ImageIcon,
  Video,
  Music4,
  Mic,
  MapPin,
  CalendarClock,
  Send,
  Smile,
  Hash,
  AtSign,
  Users2,
  Lock,
  ShieldCheck,
  Globe2,
  Sparkles,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  Loader2,
  Trash2,
  Plus,
  Minus,
  AlarmClock,
  ListChecks,
  FileAudio2,
  MessageSquareText,
  Stars,
  Home,
  LayoutList,
} from "lucide-react";

/* ============================================================================
   Constants
   ============================================================================ */
const MAX_CHARS = 3000;
const AUTOSAVE_KEY = "matyclub.compose.draft.v1";
const HISTORY_SIZE = 80;
const CREATE_POST_URL = "/api/club/posts";

/* ============================================================================
   Global keyframes & utils
   ============================================================================ */
const GlobalKeyframes = () => (
  <style
    dangerouslySetInnerHTML={{
      __html: `
      @keyframes glow { 0%,100%{filter:drop-shadow(0 0 0 rgba(109,74,255,0));} 50%{filter:drop-shadow(0 0 16px rgba(109,74,255,.35));} }
      @keyframes floaty { 0%{transform:translateY(0)} 50%{transform:translateY(-8px)} 100%{transform:translateY(0)} }
      @keyframes popIn { 0%{ opacity:0; transform:scale(.96) translateY(6px) } 100%{ opacity:1; transform:scale(1) translateY(0) } }
      .pop-in { animation: popIn .22s ease-out both }
    `,
    }}
  />
);

function GlobalUtilities() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.card { will-change: transform, box-shadow; }
.input-base{width:100%;border-radius:0.75rem;border:1px solid rgb(228 228 231);background:rgb(255 255 255 / .75);padding:0.5rem 0.75rem}
.dark .input-base{border-color:rgb(39 39 42);background:rgb(10 10 10 / .7)}
.input-rtl{direction:rtl;text-align:right}
.input-ltr{direction:ltr;text-align:left}
.section-padding{padding:1rem}
.container-section{max-width:980px;margin-inline:auto}
.btn{border-radius:0.75rem;border:1px solid rgb(228 228 231);padding:0.5rem 0.75rem;background:#6d4aff;color:white}
      `,
      }}
    />
  );
}

/* ============================================================================
   Types
   ============================================================================ */
type Audience = "public" | "community" | "private" | "matchmaker";
type Mode = "post" | "poll" | "audio";
type PostVisibility = "visible" | "hidden";

type UploadImage = { id: string; file: File; url: string };
type AudioClip = {
  id: string;
  file?: File;
  url?: string;
  durationMs?: number;
  waveform?: number[];
};

type PollOption = { id: string; text: string };
type PollData = {
  question: string;
  options: PollOption[];
  multi: boolean;
  durationHours: number;
};

/* ============================================================================
   Small data
   ============================================================================ */
const EMOJIS = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😍",
  "🤩",
  "🥳",
  "🙌",
  "👏",
  "🙏",
  "💪",
  "🔥",
  "✨",
  "🎉",
  "🎵",
  "🎶",
  "🎤",
  "🎧",
  "🎹",
  "🥁",
  "🎷",
  "🕺",
  "💃",
  "🪩",
  "💜",
  "💙",
  "💚",
  "💛",
  "🧡",
  "❤️",
  "🤍",
  "⭐",
  "🌟",
  "🌈",
  "☀️",
  "🌙",
  "⚡",
  "❄️",
  "🍰",
  "🍩",
  "🍿",
  "🍫",
  "🍎",
  "🍯",
  "☕",
  "🍵",
  "🎁",
  "📸",
  "🎬",
  "🧭",
  "🧠",
  "🎯",
  "🏆",
  "🧿",
  "🕊️",
  "✡️",
  "🕯️",
  "📖",
  "🎭",
  "🧑‍🎤",
];
const HASHTAG_SUGGESTIONS = [
  "#חופה",
  "#אירוע",
  "#חתונה",
  "#בר_מצווה",
  "#בת_מצווה",
  "#התוועדות",
  "#ניגונים",
  "#חב״ד",
  "#770",
  "#בית_חיינו",
  "#הרבי",
  "#ים_תיכוני",
  "#בלדות",
  "#סט_מקפיץ",
  "#לייב",
  "#פלייליסט",
  "#נגינה",
  "#שידוכים",
  "#קהילה",
  "#שבת",
  "#שמחה",
];
const MENTION_SUGGESTIONS = [
  "@admin",
  "@maty",
  "@moderator",
  "@shadchanit",
  "@merav",
  "@levi",
  "@moshe",
  "@sara",
  "@miri",
  "@david",
];

/* ============================================================================
   Markdown‑lite
   ============================================================================ */
function renderMarkdownLite(src: string): React.ReactNode {
  const parts = src.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|https?:\/\/\S+)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("_") && p.endsWith("_"))
      return <em key={i}>{p.slice(1, -1)}</em>;
    if (p.startsWith("`") && p.endsWith("`"))
      return (
        <code key={i} className="rounded bg-black/5 dark:bg-white/10 px-1">
          {p.slice(1, -1)}
        </code>
      );
    if (p.startsWith("http://") || p.startsWith("https://"))
      return (
        <a
          key={i}
          href={p}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {p}
        </a>
      );
    const lines = p.split("\n");
    return lines.map((l, j) => (
      <React.Fragment key={`${i}-${j}`}>
        {l}
        {j < lines.length - 1 ? <br /> : null}
      </React.Fragment>
    ));
  });
}

/* ============================================================================
   Small components
   ============================================================================ */
function ToolbarScroller({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white/90 dark:from-neutral-950/90 to-transparent z-10 rounded-r" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white/90 dark:from-neutral-950/90 to-transparent z-10 rounded-l" />
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-2 sm:px-0 snap-x snap-mandatory [scrollbar-gutter:stable]">
        {children}
      </div>
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      aria-label={label}
      className={[
        "inline-flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition select-none snap-start",
        active
          ? "bg-violet-600 text-white border-violet-700 hover:brightness-110"
          : "bg-white/70 dark:bg-neutral-950/60 border-neutral-200/70 dark:border-neutral-800/60 hover:bg-white/90 dark:hover:bg-neutral-900/80",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60",
      ].join(" ")}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate max-w-[9ch] sm:max-w-[12ch] md:max-w-none whitespace-nowrap">
        {label}
      </span>
    </motion.button>
  );
}

function StatPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex min-w-0 items-center gap-2 rounded-full px-3 py-1 border dark:border-white/10 bg-white/70 dark:bg-neutral-950/70">
      <span className="shrink-0">{icon}</span>
      <span className="text-xs truncate max-w-[20ch] md:max-w-none">
        {text}
      </span>
    </div>
  );
}

function Chip({
  children,
  selected,
  onToggle,
}: {
  children: React.ReactNode;
  selected?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "rounded-full px-3 py-1 text-xs border transition select-none",
        selected
          ? "bg-violet-600 text-white border-violet-700 hover:brightness-110"
          : "bg-white/70 dark:bg-neutral-950/60 border-neutral-200/70 dark:border-neutral-800/60 hover:bg-white/90 dark:hover:bg-neutral-900/80",
      ].join(" ")}
    >
      <span className="truncate max-w-[20ch] md:max-w-none whitespace-nowrap">
        {children}
      </span>
    </button>
  );
}

function ImagePreviewGrid({
  images,
  onRemove,
}: {
  images: UploadImage[];
  onRemove: (id: string) => void;
}) {
  if (!images.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
      {images.map((img) => (
        <div
          key={img.id}
          className="relative rounded-xl overflow-hidden border dark:border-white/10"
        >
          <img
            src={img.url}
            alt="preview"
            className="w-full aspect-[4/3] object-cover"
          />
          <button
            type="button"
            title="הסר"
            aria-label="הסר"
            onClick={() => onRemove(img.id)}
            className="absolute top-1 left-1 rounded-full bg-black/60 text-white p-1 hover:bg-black/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function AudioPreview({
  clip,
  onRemove,
}: {
  clip: AudioClip | null;
  onRemove: () => void;
}) {
  if (!clip) return null;
  return (
    <div className="mt-3 rounded-xl border dark:border-white/10 p-3 pop-in">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-sm">אודיו מצורף</div>
        <button
          className="rounded-full bg-black/50 text-white p-1 hover:bg-black/70"
          onClick={onRemove}
          title="הסר אודיו"
          aria-label="הסר אודיו"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-2">
        {clip.url ? (
          <audio controls src={clip.url} className="w-full">
            הדפדפן לא תומך בנגן האודיו.
          </audio>
        ) : (
          <div className="text-xs opacity-70">הקלטה תוצג כאן…</div>
        )}
      </div>
      <div className="mt-2 h-10 flex items-end gap-0.5">
        {(clip.waveform || makeWaveform(60)).map((h, i) => (
          <div
            key={i}
            className="w-1 bg-violet-500/50"
            style={{ height: `${Math.max(4, Math.min(36, h))}px` }}
          />
        ))}
      </div>
      <div className="text-xs opacity-70 mt-1">
        משך משוער: {clip.durationMs ? Math.round(clip.durationMs / 1000) : "?"}{" "}
        שנ׳
      </div>
    </div>
  );
}

function AudienceSelector({
  value,
  onChange,
}: {
  value: Audience;
  onChange: (v: Audience) => void;
}) {
  const opts: {
    key: Audience;
    label: string;
    icon: React.ReactNode;
    desc: string;
  }[] = [
    {
      key: "public",
      label: "ציבורי",
      icon: <Globe2 className="w-4 h-4" />,
      desc: "כולם יכולים לראות",
    },
    {
      key: "community",
      label: "קהילה",
      icon: <Users2 className="w-4 h-4" />,
      desc: "משתמשים מאומתים",
    },
    {
      key: "private",
      label: "פרטי",
      icon: <Lock className="w-4 h-4" />,
      desc: "רק אתה/צוות",
    },
    {
      key: "matchmaker",
      label: "שדכנית",
      icon: <ShieldCheck className="w-4 h-4" />,
      desc: "נראה רק לשדכנית",
    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2 items-stretch auto-rows-fr">
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={[
            "w-full h-full overflow-hidden rounded-xl border p-3 text-right transition",
            o.key === value
              ? "bg-violet-600/10 border-violet-300/50 dark:border-violet-500/30"
              : "bg-white/60 dark:bg-neutral-950/60 border-neutral-200/70 dark:border-neutral-800/60 hover:bg-white/90 dark:hover:bg-neutral-900/80",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <div className="font-semibold text-sm flex items-center gap-2 min-w-0">
                <span className="shrink-0">{o.icon}</span>
                <span className="truncate block">{o.label}</span>
              </div>
              <div className="text-[11px] opacity-70 truncate" title={o.desc}>
                {o.desc}
              </div>
            </div>
            {o.key === value ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <span className="shrink-0" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function PollEditor({
  value,
  onChange,
}: {
  value: PollData;
  onChange: (v: PollData) => void;
}) {
  const setField = <K extends keyof PollData>(k: K, v: PollData[K]) =>
    onChange({ ...value, [k]: v });
  const addOption = () => {
    if (value.options.length >= 6) return;
    onChange({
      ...value,
      options: [...value.options, { id: cryptoRandomId(), text: "" }],
    });
  };
  const rmOption = (id: string) =>
    onChange({ ...value, options: value.options.filter((o) => o.id !== id) });
  const changeText = (id: string, text: string) =>
    onChange({
      ...value,
      options: value.options.map((o) => (o.id === id ? { ...o, text } : o)),
    });
  return (
    <div className="rounded-2xl border dark:border-white/10 p-3">
      <div className="font-semibold text-sm flex items-center gap-2">
        <ListChecks className="w-4 h-4" /> סקר
      </div>
      <div className="mt-2">
        <label className="text-xs opacity-80">שאלה</label>
        <input
          value={value.question}
          onChange={(e) => setField("question", e.target.value)}
          placeholder="על מה תרצה לקבל הצבעה?"
          className="input-base mt-1"
        />
      </div>
      <div className="mt-2 space-y-2">
        {value.options.map((o, i) => (
          <div key={o.id} className="flex items-center gap-2 min-w-0">
            <input
              value={o.text}
              onChange={(e) => changeText(o.id, e.target.value)}
              placeholder={`אפשרות ${i + 1}`}
              className="input-base flex-1 min-w-0"
              maxLength={120}
            />
            <button
              type="button"
              onClick={() => rmOption(o.id)}
              className="rounded-lg border px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              title="הסר אפשרות"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        ))}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={addOption}
            className="rounded-lg border px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-900 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> הוסף אפשרות
          </button>
        </div>
      </div>
      <div className="mt-3 grid md:grid-cols-3 gap-2">
        <label className="text-right">
          <span className="text-xs opacity-80">משך (שעות)</span>
          <input
            type="number"
            min={1}
            max={240}
            value={value.durationHours}
            onChange={(e) =>
              setField(
                "durationHours",
                Math.max(1, Math.min(240, Number(e.target.value) || 1)),
              )
            }
            className="input-base mt-1"
          />
        </label>
        <label className="text-right flex items-center gap-2 md:justify-end">
          <input
            type="checkbox"
            checked={value.multi}
            onChange={(e) => setField("multi", e.target.checked)}
          />
          <span className="text-sm">אפשר לבחור כמה</span>
        </label>
        <div className="text-xs opacity-70 md:text-right">
          * עד 6 אפשרויות. ניתן להפעיל/לכבות ריבוי בחירות.
        </div>
      </div>
    </div>
  );
}

function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [limit, setLimit] = React.useState(48);
  const cols =
    "grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 gap-1.5 place-items-center";
  return (
    <div className="rounded-2xl border dark:border-white/10 p-3">
      <div className="font-semibold text-sm flex items-center gap-2">
        <Smile className="w-4 h-4" /> אמוג׳ים
      </div>
      <div className={`mt-2 ${cols} max-h-40 overflow-y-auto pr-1`}>
        {EMOJIS.slice(0, limit).map((e) => (
          <button
            key={e}
            onClick={() => onPick(e)}
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
            aria-label={`emoji ${e}`}
            title={e}
          >
            <span className="text-xl leading-none">{e}</span>
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        {limit < EMOJIS.length ? (
          <button
            onClick={() => setLimit(limit + 48)}
            className="rounded-xl border px-3 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            טען עוד
          </button>
        ) : (
          <span className="text-xs opacity-60">כל האימוג׳ים נטענו</span>
        )}
        <span className="text-[11px] opacity-60">גלול למטה לעוד</span>
      </div>
    </div>
  );
}

function HashtagSuggestions({
  onPick,
  selected,
}: {
  onPick: (tag: string) => void;
  selected: string[];
}) {
  return (
    <div className="rounded-2xl border dark:border-white/10 p-3">
      <div className="font-semibold text-sm flex items-center gap-2">
        <Hash className="w-4 h-4" /> האשטגים
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {HASHTAG_SUGGESTIONS.map((t) => (
          <Chip
            key={t}
            selected={selected.includes(t)}
            onToggle={() => onPick(t)}
          >
            {t}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function MentionSuggestions({ onPick }: { onPick: (mention: string) => void }) {
  return (
    <div className="rounded-2xl border dark:border-white/10 p-3">
      <div className="font-semibold text-sm flex items-center gap-2">
        <AtSign className="w-4 h-4" /> אזכורים
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {MENTION_SUGGESTIONS.map((m) => (
          <Chip key={m} onToggle={() => onPick(m)}>
            {m}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function MarkdownPreview({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <div className="rounded-2xl border dark:border-white/10 p-3 bg-white/80 dark:bg-neutral-950/80">
      <div className="font-semibold text-sm flex items-center gap-2">
        <Eye className="w-4 h-4" /> תצוגה מקדימה
      </div>
      <div className="prose dark:prose-invert rtl text-right max-w-none prose-p:my-2 prose-ul:my-1 prose-li:my-0 text-sm mt-2">
        {renderMarkdownLite(text)}
      </div>
    </div>
  );
}

function SquareStopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current">
      <rect x="6" y="6" width="12" height="12" rx="2"></rect>
    </svg>
  );
}

function VideoEmbed({ url }: { url: string }) {
  const p = parseVideo(url);
  if (!url.trim()) return <div className="text-xs opacity-70">אין וידאו</div>;
  if (p.type === "youtube" && p.id)
    return (
      <div className="aspect-video rounded-xl overflow-hidden border dark:border-white/10">
        <iframe
          src={`https://www.youtube.com/embed/${p.id}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube preview"
        />
      </div>
    );
  if (p.type === "vimeo" && p.id)
    return (
      <div className="aspect-video rounded-xl overflow-hidden border dark:border-white/10">
        <iframe
          src={`https://player.vimeo.com/video/${p.id}`}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Vimeo preview"
        />
      </div>
    );
  return <div className="text-xs opacity-70">לינק לא נתמך להצגה מקדימה</div>;
}

function QuickTemplates({
  onInsert,
}: {
  onInsert: (text: string, tags?: string[]) => void;
}) {
  const TEMPLATES = [
    {
      id: "farbrengen-770",
      title: "התוועדות 770 — שידור חי",
      text: `מזמינים אתכם להתוועדות חמה מבית חיינו 770!\n\nנשיר יחד ניגוני חב\"ד, נספר סיפורים מהרבי שליט\"א מלך המשיח, ונרים את האווירה בע\"ה!\n\nמוזמנים לכתוב בתגובות איזה ניגון תרצו שננגן 🎵`,
      tags: ["#התוועדות", "#770", "#בית_חיינו", "#הרבי", "#ניגונים"],
    },
    {
      id: "wedding-set",
      title: "סט מקפיץ לחתונה",
      text: "פותחים סט מקפיץ במיוחד לזוג הטרי! יש לכם שיר חובה? כתבו לנו בתגובות ✨",
      tags: ["#חתונה", "#סט_מקפיץ", "#לייב"],
    },
    {
      id: "shiduch-night",
      title: "ערב שידוכים מוזיקלי",
      text: "מפגש היכרות מוזיקלי בסגנון נקי ומכבד. שירים שקטים, ניגונים מרוממים, והזדמנות להכיר. 💜",
      tags: ["#שידוכים", "#קהילה", "#אווירה"],
    },
  ];
  return (
    <div
      className="rounded-2xl border dark:border-white/10 p-3"
      id="quick-templates"
    >
      <div className="font-semibold text-sm flex items-center gap-2">
        <Stars className="w-4 h-4" /> תבניות מהירות (770/חב"ד)
      </div>
      <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            className="card text-right p-3 hover:translate-y-[-1px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
            onClick={() => onInsert(tpl.text, tpl.tags)}
            title={tpl.title}
          >
            <div className="font-semibold text-sm truncate">{tpl.title}</div>
            <div className="text-xs opacity-80 line-clamp-3 mt-1">
              {tpl.text}
            </div>
            {tpl.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {tpl.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded-full border dark:border-white/10"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   Utilities
   ============================================================================ */
function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // @ts-ignore
    return crypto.randomUUID();
  }
  return "id_" + Math.random().toString(16).slice(2);
}
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function makeWaveform(n = 48): number[] {
  return Array.from({ length: n }, () => Math.floor(6 + Math.random() * 36));
}
function useHistoryState(initial: string) {
  const [value, setValue] = useState(initial);
  const history = useRef<string[]>([initial]);
  const idx = useRef(0);
  const push = useCallback((v: string) => {
    if (history.current[idx.current] === v) return;
    history.current = history.current.slice(0, idx.current + 1);
    history.current.push(v);
    if (history.current.length > HISTORY_SIZE) history.current.shift();
    else idx.current++;
    setValue(v);
  }, []);
  const undo = useCallback(() => {
    if (idx.current <= 0) return;
    idx.current--;
    setValue(history.current[idx.current]);
  }, []);
  const redo = useCallback(() => {
    if (idx.current >= history.current.length - 1) return;
    idx.current++;
    setValue(history.current[idx.current]);
  }, []);
  return { value, setValue: push, undo, redo };
}
function useAutosave<T>(key: string, state: T, deps: any[]) {
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, deps);
}
function loadAutosave<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function toast(text: string, type: "success" | "error" | "info" = "info") {
  if (typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent("mm:toast", { detail: { type, text } }),
    );
}
function parseVideo(url: string): {
  type: "youtube" | "vimeo" | "other";
  id?: string;
} {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const id = u.hostname.includes("youtu.be")
        ? u.pathname.slice(1)
        : u.searchParams.get("v") || undefined;
      return { type: "youtube", id };
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return { type: "vimeo", id };
    }
  } catch {}
  return { type: "other" };
}

/* ============================================================================
   SchedulePicker
   ============================================================================ */
type SchedulePickerProps = {
  dt: string | null;
  onChange: (iso: string | null) => void;
};
function SchedulePicker({ dt, onChange }: SchedulePickerProps) {
  const [date, time] = useMemo(() => {
    if (!dt) return ["", ""] as const;
    const d = new Date(dt);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return [`${y}-${m}-${day}`, `${hh}:${mm}`] as const;
  }, [dt]);
  const setDate = (v: string) => {
    if (!v && !time) return onChange(null);
    const now = new Date();
    const [hh, mm] = (time || "12:00").split(":").map(Number);
    const d = v ? new Date(v) : now;
    d.setHours(hh || 12, mm || 0, 0, 0);
    onChange(d.toISOString());
  };
  const setTime = (v: string) => {
    const [hh, mm] = (v || "12:00").split(":").map(Number);
    const base = date ? new Date(date) : new Date();
    base.setHours(hh || 12, mm || 0, 0, 0);
    onChange(base.toISOString());
  };
  return (
    <div className="rounded-2xl border dark:border-white/10 p-3">
      <div className="font-semibold text-sm flex items-center gap-2">
        <CalendarClock className="w-4 h-4" /> תזמון פרסום
      </div>
      <div className="grid md:grid-cols-2 gap-2 mt-2">
        <label className="text-right">
          <span className="text-xs opacity-80">תאריך</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-base mt-1"
          />
        </label>
        <label className="text-right">
          <span className="text-xs opacity-80">שעה</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="input-base mt-1"
          />
        </label>
      </div>
      <div className="text-xs opacity-70 mt-1">
        * אם לא תבחר/י — נפרסם מייד לאחר שליחה.
      </div>
    </div>
  );
}

/* ============================================================================
   Page (includes the composer)
   ============================================================================ */
export default function ComposePage() {
  // --- State ---
  const [mode, setMode] = useState<Mode>("post");
  const textHist = useHistoryState("");
  const [charsLeft, setCharsLeft] = useState(MAX_CHARS);
  const [images, setImages] = useState<UploadImage[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [audio, setAudio] = useState<AudioClip | null>(null);
  const [audience, setAudience] = useState<Audience>("community");
  const [visibility, setVisibility] = useState<PostVisibility>("visible");
  const [scheduleISO, setScheduleISO] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(true);
  const [recording, setRecording] = useState(false);
  const [poll, setPoll] = useState<PollData>({
    question: "",
    options: [
      { id: cryptoRandomId(), text: "" },
      { id: cryptoRandomId(), text: "" },
    ],
    multi: false,
    durationHours: 24,
  });
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [afterCreate, setAfterCreate] = useState<{
    url: string | null;
    id: string | null;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // --- Autosave load ---
  useEffect(() => {
    const data = loadAutosave<any>(AUTOSAVE_KEY, null as any);
    if (data) {
      try {
        if (typeof data.text === "string") textHist.setValue(data.text);
        if (Array.isArray(data.hashtags)) setHashtags(data.hashtags);
        if (typeof data.videoUrl === "string") setVideoUrl(data.videoUrl);
        if (typeof data.mode === "string") setMode(data.mode as Mode);
        if (typeof data.audience === "string")
          setAudience(data.audience as Audience);
        if (typeof data.visibility === "string")
          setVisibility(data.visibility as PostVisibility);
        if (data.scheduleISO) setScheduleISO(data.scheduleISO);
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Autosave persist ---
  useAutosave(
    AUTOSAVE_KEY,
    {
      text: textHist.value,
      hashtags,
      videoUrl,
      mode,
      audience,
      visibility,
      scheduleISO,
    },
    [
      textHist.value,
      hashtags,
      videoUrl,
      mode,
      audience,
      visibility,
      scheduleISO,
    ],
  );

  // --- Derived ---
  useEffect(() => {
    setCharsLeft(
      clamp(MAX_CHARS - (textHist.value?.length || 0), 0, MAX_CHARS),
    );
  }, [textHist.value]);
  const counterColor = useMemo(() => {
    const ratio = 1 - charsLeft / MAX_CHARS;
    if (ratio < 0.5) return "text-emerald-600";
    if (ratio < 0.8) return "text-amber-600";
    return "text-red-600";
  }, [charsLeft]);

  // --- Handlers ---
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) textHist.redo();
        else textHist.undo();
      }
    }
  };

  // Images
  const onPickImages = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newOnes: UploadImage[] = files
      .slice(0, 12 - images.length)
      .map((f) => ({
        id: cryptoRandomId(),
        file: f,
        url: URL.createObjectURL(f),
      }));
    setImages((arr) => [...arr, ...newOnes]);
    e.target.value = "";
  };
  const removeImage = (id: string) => {
    setImages((arr) => {
      const target = arr.find((x) => x.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return arr.filter((x) => x.id !== id);
    });
  };

  // Audio file
  const onPickAudio = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setAudio({
      id: cryptoRandomId(),
      file: f,
      url,
      durationMs: undefined,
      waveform: makeWaveform(60),
    });
    e.target.value = "";
  };
  const removeAudio = () => {
    if (audio?.url) URL.revokeObjectURL(audio.url);
    setAudio(null);
  };

  // Recording
  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast("הדפדפן לא תומך בהקלטה", "error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (ev) => chunksRef.current.push(ev.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudio({
          id: cryptoRandomId(),
          file: new File([blob], `recording_${Date.now()}.webm`, {
            type: "audio/webm",
          }),
          url,
          durationMs: undefined,
          waveform: makeWaveform(70),
        });
      };
      rec.start();
      setRecording(true);
    } catch {
      toast("שגיאה בהקלטה", "error");
    }
  };
  const stopRecording = () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
      rec.stream.getTracks().forEach((t) => t.stop());
    }
    recorderRef.current = null;
    setRecording(false);
  };

  // Location
  const askLocation = () => {
    if (!navigator.geolocation) {
      toast("הדפדפן לא תומך בגאולוקציה", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => toast("לא ניתן להשיג מיקום", "error"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // Tokens
  const addToken = (token: string) => {
    const sep = textHist.value && !/\s$/.test(textHist.value) ? " " : "";
    textHist.setValue(textHist.value + sep + token + " ");
  };
  const toggleHashtag = (tag: string) =>
    setHashtags((arr) =>
      arr.includes(tag) ? arr.filter((t) => t !== tag) : [...arr, tag],
    );

  // Templates
  const insertTemplate = (text: string, tags?: string[]) => {
    const sep = textHist.value ? "\n\n" : "";
    textHist.setValue((textHist.value || "") + sep + text);
    if (tags?.length) {
      const add = tags.filter((t) => !hashtags.includes(t));
      if (add.length) setHashtags((h) => [...h, ...add]);
    }
    toast("תבנית הוזרקה", "success");
  };

  // Submit (FormData when files, otherwise JSON)
  const onSubmit = async () => {
    const isPoll = mode === "poll";
    const hasText = !!textHist.value.trim();
    const hasMedia = images.length > 0 || !!videoUrl || !!audio;

    if (!hasText && !hasMedia && !isPoll) {
      toast("אין תוכן לשליחה", "error");
      return;
    }
    if (isPoll) {
      const cleanOptions = poll.options
        .map((o) => o.text.trim())
        .filter(Boolean);
      if (!poll.question.trim()) {
        toast("סקר חייב שאלה", "error");
        return;
      }
      if (cleanOptions.length < 2) {
        toast("סקר חייב לפחות 2 אפשרויות", "error");
        return;
      }
    }

    try {
      setLoading(true);
      const meta = {
        mode,
        text: textHist.value,
        hashtags,
        videoUrl: videoUrl || null,
        audience,
        visibility,
        scheduleISO,
        location,
        poll: isPoll
          ? {
              question: poll.question.trim(),
              options: poll.options.map((o) => o.text.trim()).filter(Boolean),
              multi: poll.multi,
              durationHours: poll.durationHours,
            }
          : null,
      };

      let res: Response;
      if (images.length > 0 || audio?.file) {
        const form = new FormData();
        form.append("meta", JSON.stringify(meta));
        images.forEach((img, i) =>
          form.append("images", img.file, img.file.name || `image_${i}.jpg`),
        );
        if (audio?.file)
          form.append("audio", audio.file, audio.file.name || "audio.webm");
        res = await fetch(CREATE_POST_URL, { method: "POST", body: form });
      } else {
        res = await fetch(CREATE_POST_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(meta),
        });
      }

      const raw = await res.text();
      let j: any = null;
      try {
        j = raw ? JSON.parse(raw) : null;
      } catch {}
      if (!res.ok || (j && j.ok === false))
        throw new Error(j?.error || raw || `HTTP ${res.status}`);

      // try to extract url/id
      const postUrl: string | null =
        j?.data?.url ||
        j?.url ||
        (j?.data?.id ? `/club/p/${j.data.id}` : null) ||
        (j?.id ? `/club/p/${j.id}` : null) ||
        (j?.data?.slug ? `/club/s/${j.data.slug}` : null) ||
        "/club";
      const postId: string | null = j?.data?.id || j?.id || null;
      setAfterCreate({ url: postUrl, id: postId });

      toast("הפוסט הוגש, מחכים לאישור/פרסום", "success");

      // reset inputs (keep afterCreate)
      textHist.setValue("");
      setImages((arr) => {
        arr.forEach((x) => URL.revokeObjectURL(x.url));
        return [];
      });
      if (audio?.url) URL.revokeObjectURL(audio.url);
      setAudio(null);
      setVideoUrl("");
      setPoll({
        question: "",
        options: [
          { id: cryptoRandomId(), text: "" },
          { id: cryptoRandomId(), text: "" },
        ],
        multi: false,
        durationHours: 24,
      });
      setScheduleISO(null);
      setHashtags([]);
    } catch (err: any) {
      toast(err?.message || "שגיאת רשת / ולידציה", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- UI helpers ---
  const modeLabel =
    mode === "post" ? "פוסט" : mode === "poll" ? "סקר" : "אודיו";

  return (
    <section className="section-padding overflow-x-hidden" dir="rtl">
      <GlobalKeyframes />
      <GlobalUtilities />

      {/* BG */}
      <div className="absolute -z-10 inset-0 pointer-events-none">
        <div
          aria-hidden
          className="absolute inset-x-0 -top-24 mx-auto h-[240px] w-[min(100%,900px)] rounded-[56px] blur-3xl bg-[radial-gradient(60%_60%_at_50%_50%,rgba(109,74,255,.26),rgba(109,74,255,0)_65%)]"
        />
      </div>

      <div className="container-section">
        {/* Quick NAV row */}
        <nav className="sticky top-0 z-30 mb-3 rounded-2xl border dark:border-white/10 bg-white/80 dark:bg-neutral-950/80 backdrop-blur p-2">
          <div className="flex flex-wrap gap-2 justify-end">
            <a
              href="/club"
              className="rounded-xl border px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <Home className="w-4 h-4" /> חזרה לפיד
            </a>
            <a
              href="/club/mine"
              className="rounded-xl border px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <LayoutList className="w-4 h-4" /> הפוסטים שלי
            </a>
            <span className="rounded-xl border px-3 py-2 text-sm inline-flex items-center gap-2 bg-violet-600 text-white border-violet-700">
              <Sparkles className="w-4 h-4" /> יצירת פוסט — כאן
            </span>
          </div>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="card p-4 sm:p-5 border rounded-2xl dark:border-white/10 bg-white/80 dark:bg-neutral-950/80"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-right min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 border dark:border-white/10 bg-white/70 dark:bg-neutral-950/70">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span className="text-xs opacity-80 truncate">
                  קומפוזר פוסטים
                </span>
              </div>
              <h2 className="mt-2 text-xl font-extrabold truncate">
                פרסם משהו חדש ({modeLabel})
              </h2>
              <div className="mt-1 flex flex-wrap gap-2 justify-end">
                <StatPill
                  icon={<AlarmClock className="w-3.5 h-3.5" />}
                  text={scheduleISO ? "מתוזמן" : "מיידי"}
                />
                <StatPill
                  icon={<Eye className="w-3.5 h-3.5" />}
                  text={visibility === "visible" ? "נראה" : "מוסתר"}
                />
              </div>
            </div>
            <div className="hidden md:flex gap-2">
              <ToolbarButton
                icon={<Undo2 className="w-4 h-4" />}
                label="Undo"
                onClick={textHist.undo}
              />
              <ToolbarButton
                icon={<Redo2 className="w-4 h-4" />}
                label="Redo"
                onClick={textHist.redo}
              />
            </div>
          </div>

          {/* Modes */}
          <div className="mt-3">
            <ToolbarScroller>
              <ToolbarButton
                icon={<MessageSquareText className="w-4 h-4" />}
                label="פוסט"
                active={mode === "post"}
                onClick={() => setMode("post")}
              />
              <ToolbarButton
                icon={<ListChecks className="w-4 h-4" />}
                label="סקר"
                active={mode === "poll"}
                onClick={() => setMode("poll")}
              />
              <ToolbarButton
                icon={<Music4 className="w-4 h-4" />}
                label="אודיו"
                active={mode === "audio"}
                onClick={() => setMode("audio")}
              />
              <ToolbarButton
                icon={<Stars className="w-4 h-4" />}
                label="תבניות 770"
                onClick={() =>
                  document
                    .getElementById("quick-templates")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
              />
            </ToolbarScroller>
          </div>

          {/* Text area (non‑audio) */}
          {mode !== "audio" && (
            <div className="mt-3">
              <textarea
                className="input-base input-rtl rounded-2xl min-h-[140px] resize-y"
                value={textHist.value}
                onChange={(e) =>
                  textHist.setValue(e.target.value.slice(0, MAX_CHARS))
                }
                onKeyDown={onKeyDown}
                placeholder="מה חדש? אפשר **bold**, _italic_, או שים לינק https://…"
              />
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className={`text-xs ${counterColor}`}>
                  נותרו {charsLeft} תווים
                </div>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer rounded-xl border px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-900">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs truncate">תמונות</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={onPickImages}
                      className="hidden"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer rounded-xl border px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-900">
                    <FileAudio2 className="w-4 h-4" />
                    <span className="text-xs truncate">אודיו</span>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={onPickAudio}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Video URL */}
              <div className="mt-2 grid md:grid-cols-[1fr_auto] gap-2">
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="לינק וידאו (YouTube/Vimeo) — אופציונלי"
                  className="input-base input-ltr"
                />
                <div className="flex items-center justify-end gap-2">
                  <ToolbarButton
                    icon={<Video className="w-4 h-4" />}
                    label="בדוק לינק"
                    onClick={() => {
                      const parsed = parseVideo(videoUrl);
                      if (parsed.type === "other")
                        toast("לא זוהה לינק YouTube/Vimeo", "error");
                      else
                        toast(
                          `זוהה ${parsed.type.toUpperCase()}` as any,
                          "success",
                        );
                    }}
                  />
                  <ToolbarButton
                    icon={
                      preview ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )
                    }
                    label={preview ? "הסתר פריוויו" : "הצג פריוויו"}
                    onClick={() => setPreview((v) => !v)}
                  />
                </div>
              </div>

              <ImagePreviewGrid images={images} onRemove={removeImage} />
            </div>
          )}

          {/* Audio mode */}
          {mode === "audio" && (
            <div className="mt-3 rounded-2xl border dark:border-white/10 p-3">
              <div className="flex flex-wrap gap-2 justify-end">
                {!recording ? (
                  <ToolbarButton
                    icon={<Mic className="w-4 h-4" />}
                    label="התחל הקלטה"
                    onClick={startRecording}
                  />
                ) : (
                  <ToolbarButton
                    icon={<SquareStopIcon />}
                    label="עצור הקלטה"
                    onClick={stopRecording}
                  />
                )}
                <ToolbarButton
                  icon={<FileAudio2 className="w-4 h-4" />}
                  label="בחר קובץ"
                  onClick={() => audioInputRef.current?.click()}
                />
              </div>
              <AudioPreview clip={audio} onRemove={removeAudio} />
              <div className="mt-3">
                <textarea
                  className="input-base input-rtl rounded-2xl min-h-[100px]"
                  value={textHist.value}
                  onChange={(e) =>
                    textHist.setValue(e.target.value.slice(0, MAX_CHARS))
                  }
                  placeholder="כתוב תיאור קצר לאודיו…"
                />
              </div>
            </div>
          )}

          {/* Poll */}
          {mode === "poll" && (
            <div className="mt-3">
              <PollEditor value={poll} onChange={setPoll} />
            </div>
          )}

          {/* Preview markdown & video */}
          {preview && (textHist.value.trim() || videoUrl) && (
            <div className="mt-3 grid md:grid-cols-2 gap-3">
              <MarkdownPreview text={textHist.value} />
              <div className="rounded-2xl border dark:border-white/10 p-3">
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Video className="w-4 h-4" /> פריוויו וידאו
                </div>
                <div className="mt-2">
                  <VideoEmbed url={videoUrl} />
                </div>
              </div>
            </div>
          )}

          {/* Quick templates */}
          <div className="mt-3">
            <QuickTemplates onInsert={insertTemplate} />
          </div>

          {/* Tools row */}
          <div className="mt-3 grid lg:grid-cols-3 gap-3">
            <EmojiPicker onPick={addToken} />
            <HashtagSuggestions onPick={toggleHashtag} selected={hashtags} />
            <MentionSuggestions onPick={addToken} />
          </div>

          {/* Audience & schedule */}
          <div className="mt-3 grid lg:grid-cols-2 gap-3">
            <AudienceSelector value={audience} onChange={setAudience} />
            <SchedulePicker dt={scheduleISO} onChange={setScheduleISO} />
          </div>

          {/* Visibility + Location */}
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <div className="rounded-2xl border dark:border-white/10 p-3">
              <div className="font-semibold text-sm flex items-center gap-2">
                {visibility === "visible" ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}{" "}
                ניראות
              </div>
              <div className="mt-2 flex flex-wrap gap-2 justify-end">
                <Chip
                  selected={visibility === "visible"}
                  onToggle={() => setVisibility("visible")}
                >
                  נראה בפיד
                </Chip>
                <Chip
                  selected={visibility === "hidden"}
                  onToggle={() => setVisibility("hidden")}
                >
                  שמור פרטית
                </Chip>
              </div>
              <div className="text-xs opacity-70 mt-2">
                * אם מוסתר — אפשר לשתף רק קישור ישיר/עם הרשאות מתאימות.
              </div>
            </div>

            <div className="rounded-2xl border dark:border-white/10 p-3">
              <div className="font-semibold text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" /> מיקום
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-xs opacity-70 min-w-0 truncate">
                  {location ? (
                    <>
                      <span>lat: {location.lat.toFixed(5)}</span> •{" "}
                      <span>lon: {location.lon.toFixed(5)}</span>
                    </>
                  ) : (
                    "לא נבחר מיקום"
                  )}
                </div>
                <ToolbarButton
                  icon={<MapPin className="w-4 h-4" />}
                  label="בקש מיקום"
                  onClick={askLocation}
                />
              </div>
              <div className="text-xs opacity-60 mt-1">
                * אופציונלי. משמש לציון מקום האירוע/הופעה/התוועדות.
              </div>
            </div>
          </div>

          {/* Selected hashtags */}
          {hashtags.length > 0 && (
            <div className="mt-3 rounded-2xl border dark:border-white/10 p-3">
              <div className="font-semibold text-sm flex items-center gap-2">
                <Hash className="w-4 h-4" /> האשטגים נבחרים
              </div>
              <div className="mt-2 flex flex-wrap gap-2 justify-end">
                {hashtags.map((t) => (
                  <Chip key={t} selected onToggle={() => toggleHashtag(t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* After create quick links */}
          {afterCreate && (
            <div className="mt-3 rounded-2xl border dark:border-white/10 p-3 bg-white/70 dark:bg-neutral-950/70">
              <div className="font-semibold text-sm mb-2">
                הפוסט נוצר בהצלחה 🎉
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                {afterCreate.url && (
                  <a
                    href={afterCreate.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  >
                    פתח פוסט
                  </a>
                )}
                <a
                  href="/club"
                  className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  חזרה לפיד
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const base =
                      typeof window !== "undefined"
                        ? window.location.origin
                        : "";
                    const full = afterCreate.url?.startsWith("http")
                      ? afterCreate.url
                      : `${base}${afterCreate.url || ""}`;
                    if (full) navigator.clipboard?.writeText(full);
                    toast("קישור הועתק", "success");
                  }}
                  className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  העתק קישור
                </button>
              </div>
            </div>
          )}

          {/* Submit row */}
          <div className="mt-4 flex flex-wrap gap-2 justify-end overflow-x-auto no-scrollbar">
            <a
              href="/club"
              className="rounded-xl border px-3 py-2 text-sm bg-white/70 dark:bg-neutral-950/60 hover:bg-white/90 dark:hover:bg-neutral-900/80 inline-flex items-center gap-2"
            >
              <Home className="w-4 h-4" /> חזרה לפיד
            </a>
            <a
              href="/club/mine"
              className="rounded-xl border px-3 py-2 text-sm bg-white/70 dark:bg-neutral-950/60 hover:bg-white/90 dark:hover:bg-neutral-900/80 inline-flex items-center gap-2"
            >
              <LayoutList className="w-4 h-4" /> הפוסטים שלי
            </a>
            <button
              type="button"
              onClick={() => toast("נשמר כטיוטה (לוקאלי)", "success")}
              className="rounded-xl border px-3 py-2 text-sm bg-white/70 dark:bg-neutral-950/60 hover:bg-white/90 dark:hover:bg-neutral-900/80"
            >
              שמור טיוטה
            </button>
            <button
              type="button"
              onClick={() => {
                textHist.setValue("");
                setImages((arr) => {
                  arr.forEach((x) => URL.revokeObjectURL(x.url));
                  return [];
                });
                if (audio?.url) URL.revokeObjectURL(audio.url);
                setAudio(null);
                setVideoUrl("");
                setPoll({
                  question: "",
                  options: [
                    { id: cryptoRandomId(), text: "" },
                    { id: cryptoRandomId(), text: "" },
                  ],
                  multi: false,
                  durationHours: 24,
                });
                setScheduleISO(null);
                setHashtags([]);
                toast("נוקה", "info");
              }}
              className="rounded-xl border px-3 py-2 text-sm bg-white/70 dark:bg-neutral-950/60 hover:bg-white/90 dark:hover:bg-neutral-900/80"
            >
              נקה שדות
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onSubmit}
              className="btn border-0 px-4 py-2 text-sm hover:opacity-90 disabled:opacity-70 inline-flex items-center gap-2"
              title="פרסם"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>פרסם</span>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
