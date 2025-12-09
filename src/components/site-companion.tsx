// // src/components/site-companion.tsx
// 'use client';

// import React, {
//   createContext, useContext, useEffect, useMemo, useReducer, useRef, useState,
// } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// /* =============================================
//    Types & constants
// ============================================= */
// type Genre = 'chabad' | 'mizrahi' | 'soft' | 'fun';
// type Strategy = 'genre' | 'gallery' | 'upload' | 'profile';

// const AVATAR_BY_GENRE: Record<Genre, string> = {
//   chabad:  '/assets/images/avatar-chabad.png',
//   mizrahi: '/assets/images/avatar-mizrahi.png',
//   soft:    '/assets/images/avatar-soft.png',
//   fun:     '/assets/images/avatar-fun.png',
// };

// // לשימוש באסטרטגיית "gallery"
// const GALLERY_MAP: Record<string, string> = {
//   'avatar-chabad':  '/assets/images/avatar-chabad.png',
//   'avatar-mizrahi': '/assets/images/avatar-mizrahi.png',
//   'avatar-soft':    '/assets/images/avatar-soft.png',
//   'avatar-fun':     '/assets/images/avatar-fun.png',
// };

// type State = {
//   pos: { x: number; y: number };
//   minimized: boolean;
//   muted: boolean;
//   dragging: boolean;
//   genre: Genre;
//   msg: string | null;
//   follow: boolean;
// };

// type Action =
//   | { type: 'POS'; x: number; y: number }
//   | { type: 'MINIMIZED'; v: boolean }
//   | { type: 'MUTED'; v: boolean }
//   | { type: 'DRAG'; v: boolean }
//   | { type: 'GENRE'; genre: Genre }
//   | { type: 'SAY'; msg: string | null }
//   | { type: 'FOLLOW'; v: boolean };

// const Ctx = createContext<{
//   state: State;
//   dispatch: React.Dispatch<Action>;
//   say: (m?: string) => void;
// } | null>(null);

// /* =============================================
//    LS helpers
// ============================================= */
// function loadLS<T>(k: string, fallback: T): T {
//   if (typeof window === 'undefined') return fallback;
//   try {
//     const v = localStorage.getItem(k);
//     return v ? (JSON.parse(v) as T) : fallback;
//   } catch {
//     return fallback;
//   }
// }
// function saveLS<T>(k: string, v: T) {
//   if (typeof window === 'undefined') return;
//   try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
// }
// function loadRaw(k: string): string | null {
//   if (typeof window === 'undefined') return null;
//   try { return localStorage.getItem(k); } catch { return null; }
// }
// function isGenre(g: any): g is Genre {
//   return g === 'chabad' || g === 'mizrahi' || g === 'soft' || g === 'fun';
// }
// function clampPos(x: number, y: number) {
//   const pad = 8;
//   const maxX = Math.max(pad, (window.innerWidth || 0) - 88);
//   const maxY = Math.max(pad, (window.innerHeight || 0) - 140);
//   return { x: Math.min(Math.max(x, pad), maxX), y: Math.min(Math.max(y, pad), maxY) };
// }

// /* =============================================
//    Speech (TTS)
// ============================================= */
// function speak(text: string, lang = 'he-IL') {
//   try {
//     if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
//     const u = new SpeechSynthesisUtterance(text);
//     u.lang = lang;
//     u.rate = 1.0;
//     u.pitch = 1.0;
//     u.volume = 1.0;
//     window.speechSynthesis.cancel();
//     window.speechSynthesis.speak(u);
//   } catch {}
// }

// /* =============================================
//    Reducer
// ============================================= */
// function reducer(s: State, a: Action): State {
//   switch (a.type) {
//     case 'POS': {
//       const p = clampPos(a.x, a.y);
//       saveLS('companion:pos', p);
//       return { ...s, pos: p };
//     }
//     case 'MINIMIZED':
//       saveLS('companion:min', a.v);
//       return { ...s, minimized: a.v };
//     case 'MUTED':
//       saveLS('companion:muted', a.v);
//       return { ...s, muted: a.v };
//     case 'DRAG':
//       return { ...s, dragging: a.v };
//     case 'GENRE': {
//       // שימור גם ל-use אחרי sign-out
//       saveLS('companion:genre', a.genre);
//       try { localStorage.setItem('preferredStyle', a.genre); } catch {}
//       return { ...s, genre: a.genre };
//     }
//     case 'SAY':
//       return { ...s, msg: a.msg };
//     case 'FOLLOW':
//       saveLS('companion:follow', a.v);
//       return { ...s, follow: a.v };
//     default:
//       return s;
//   }
// }

// /* =============================================
//    Provider
// ============================================= */
// export function CompanionProvider({ children }: { children: React.ReactNode }) {
//   const init: State = useMemo(() => {
//     const pos = loadLS('companion:pos', { x: 24, y: 24 });
//     const minimized = loadLS('companion:min', false);
//     const muted = loadLS('companion:muted', false);

//     // סדר עדיפויות: companion:genre → preferredStyle → 'soft'
//     let genreFromLS: any = loadRaw('companion:genre');
//     try { if (genreFromLS) genreFromLS = JSON.parse(genreFromLS); } catch {}
//     const pref = loadRaw('preferredStyle');

//     const fallbackGenre: Genre =
//       isGenre(genreFromLS) ? genreFromLS :
//       isGenre(pref)        ? (pref as Genre) :
//       'soft';

//     const follow = loadLS('companion:follow', true);
//     return { pos, minimized, muted, dragging: false, genre: fallbackGenre, msg: null, follow };
//   }, []);

//   const [state, dispatch] = useReducer(reducer, init);

//   // דיבור קצר (בועה + TTS)
//   const say = (m?: string) => {
//     if (state.muted) return;
//     const pool = ['צריך עזרה?', 'לחיצה כפולה ואני מדבר', 'אפשר לגרור אותי'];
//     const text = m || pool[Math.floor(Math.random() * pool.length)];
//     dispatch({ type: 'SAY', msg: text });
//     speak(text, 'he-IL');
//     (say as any)._t && clearTimeout((say as any)._t);
//     (say as any)._t = setTimeout(() => dispatch({ type: 'SAY', msg: null }), 3000);
//   };

//   // Preload לאווטארים
//   useEffect(() => {
//     Object.values(AVATAR_BY_GENRE).forEach(src => { const img = new Image(); img.src = src; });
//   }, []);

//   // ברכת "שלום" קצרה בעת טעינה (אם לא במיוט)
//   useEffect(() => {
//     const t = setTimeout(() => { if (!state.muted) say('היי! אני איתך 🙂'); }, 1200);
//     return () => clearTimeout(t);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // מאזינים גלובליים (נרשמים פעם אחת בלבד)
//   useEffect(() => {
//     (window as any).SiteCompanion = {
//       say,
//       setGenre: (g: Genre) => {
//         if (!isGenre(g)) {
//           console.warn('[Companion] setGenre: invalid genre', g);
//           return;
//         }
//         dispatch({ type: 'GENRE', genre: g });
//       },
//       resetPos: () => dispatch({ type: 'POS', x: 24, y: 24 }),
//       setFollow: (v: boolean) => dispatch({ type: 'FOLLOW', v }),
//     };

//     const fixNow = () => {
//       const p = clampPos(window.innerWidth ? state.pos.x : 24, window.innerHeight ? state.pos.y : 24);
//       dispatch({ type: 'POS', x: p.x, y: p.y });
//     };
//     fixNow();

//     const onResize = () => fixNow();
//     const onSetCategory = (e: Event) => {
//       const d = (e as CustomEvent).detail;
//       if (d?.category && isGenre(d.category)) {
//         dispatch({ type: 'GENRE', genre: d.category as Genre });
//         if (!state.muted) {
//           const msg = `עברתי ל־${d.category}`;
//           dispatch({ type: 'SAY', msg });
//           speak(msg, 'he-IL');
//           setTimeout(() => dispatch({ type: 'SAY', msg: null }), 1800);
//         }
//       }
//     };

//     window.addEventListener('resize', onResize);
//     window.addEventListener('orientationchange', onResize);
//     window.addEventListener('mm:setCategory', onSetCategory as EventListener);

//     return () => {
//       window.removeEventListener('resize', onResize);
//       window.removeEventListener('orientationchange', onResize);
//       window.removeEventListener('mm:setCategory', onSetCategory as EventListener);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []); // רישום מאזינים פעם אחת

//   /* ===== Follow-the-mouse עם ת׳רוטל ===== */
//   const mouseRef = useRef<{ x: number; y: number }>({ x: state.pos.x, y: state.pos.y });
//   const rafRef = useRef<number | null>(null);
//   const lastDispatchRef = useRef<number>(0);

//   useEffect(() => {
//     const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
//     window.addEventListener('mousemove', onMove);

//     const tick = () => {
//       if (!state.dragging && !state.minimized && state.follow) {
//         const cur = state.pos;
//         const target = clampPos(mouseRef.current.x - 28, mouseRef.current.y - 28);
//         const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
//         const nx = lerp(cur.x, target.x, 0.12);
//         const ny = lerp(cur.y, target.y, 0.12);

//         const now = performance.now();
//         const changed = Math.abs(nx - cur.x) > 0.6 || Math.abs(ny - cur.y) > 0.6;
//         if (changed && now - lastDispatchRef.current > 80) {
//           lastDispatchRef.current = now;
//           dispatch({ type: 'POS', x: nx, y: ny });
//         }
//       }
//       rafRef.current = requestAnimationFrame(tick);
//     };
//     rafRef.current = requestAnimationFrame(tick);

//     return () => {
//       window.removeEventListener('mousemove', onMove);
//       if (rafRef.current) cancelAnimationFrame(rafRef.current);
//     };
//   }, [state.dragging, state.minimized, state.follow, state.pos]);

//   const value = useMemo(() => ({ state, dispatch, say }), [state]);
//   return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
// }

// /* =============================================
//    Hook
// ============================================= */
// export function useCompanion() {
//   return useContext(Ctx);
// }

// /* =============================================
//    Main component
// ============================================= */
// export function SiteCompanion() {
//   const [mounted, setMounted] = useState(false);
//   const ctx = useCompanion();

//   // מצב לאווטאר מותאם (מגיע מדף הפרופיל) — נטען מ־window/LS ונסנכרן דרך אירוע
//   const [avatarStrategy, setAvatarStrategy] = useState<Strategy>('genre');
//   const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
//   const [avatarId, setAvatarId] = useState<string | null>(null);

//   useEffect(() => {
//     setMounted(true);
//     if (typeof window === 'undefined') return;

//     // 1) טעינה ראשונית: קודם מ-window, אם אין — מ-localStorage
//     const w = window as any;
//     const s = (w.__MM_AVATAR_STRATEGY__ as Strategy | undefined) ?? localStorage.getItem('companion:avatar:strategy') ?? 'genre';
//     const u = (w.__MM_AVATAR_URL__ as string | null | undefined) ?? localStorage.getItem('companion:avatar:url');
//     const id = (w.__MM_AVATAR_ID__ as string | null | undefined) ?? localStorage.getItem('companion:avatar:id');

//     setAvatarStrategy((s as Strategy) || 'genre');
//     setAvatarUrl(u ?? null);
//     setAvatarId(id ?? null);

//     // 2) האזנה לשינויים מהפרופיל + כתיבה ל-LS כדי שיישמר אחרי ריענון/התנתקות
//     const onAvatar = (e: Event) => {
//       const d = (e as CustomEvent).detail || {};
//       if (d.strategy) { setAvatarStrategy(d.strategy as Strategy); try { localStorage.setItem('companion:avatar:strategy', String(d.strategy)); } catch {} }
//       if ('url' in d)   { setAvatarUrl(d.url ?? null);            try { d.url ? localStorage.setItem('companion:avatar:url', String(d.url)) : localStorage.removeItem('companion:avatar:url'); } catch {} }
//       if ('id' in d)    { setAvatarId(d.id ?? null);              try { d.id  ? localStorage.setItem('companion:avatar:id', String(d.id))   : localStorage.removeItem('companion:avatar:id'); } catch {} }
//     };
//     window.addEventListener('mm:avatarChanged', onAvatar as EventListener);
//     return () => window.removeEventListener('mm:avatarChanged', onAvatar as EventListener);
//   }, []);

//   if (!mounted || !ctx) return null;

//   const { state, dispatch, say } = ctx;

//   // בחירת תמונת האווטאר בפועל
//   let img = AVATAR_BY_GENRE[state.genre]; // ברירת מחדל: לפי ז’אנר
//   if (avatarStrategy === 'upload' && avatarUrl) {
//     img = avatarUrl;
//   } else if (avatarStrategy === 'profile' && avatarUrl) {
//     img = avatarUrl;
//   } else if (avatarStrategy === 'gallery' && avatarId && GALLERY_MAP[avatarId]) {
//     img = GALLERY_MAP[avatarId];
//   }

//   return (
//     <div className="pointer-events-none fixed inset-0 z-[3000]">
//       <motion.div
//         className="pointer-events-auto fixed left-0 top-0"
//         animate={{ x: state.pos.x, y: state.pos.y }}
//         transition={{ type: 'spring', stiffness: 220, damping: 22 }}
//         initial={false}
//         drag
//         dragMomentum={false}
//         onDragStart={() => dispatch({ type: 'DRAG', v: true })}
//         onDragEnd={(_e, info) => {
//           const { x, y } = clampPos(info.point.x, info.point.y);
//           dispatch({ type: 'DRAG', v: false });
//           dispatch({ type: 'POS', x, y });
//         }}
//         style={{ touchAction: 'none' }}
//       >
//         <div className="flex items-end gap-2">
//           <AnimatePresence>
//             {state.msg && !state.minimized ? (
//               <motion.div
//                 initial={{ opacity: 0, y: 6 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: 6 }}
//                 transition={{ type: 'spring', stiffness: 280, damping: 22 }}
//                 className="max-w-[240px] text-right text-[13px] leading-5 bg-white/90 dark:bg-neutral-900/90 border border-black/10 dark:border-white/10 rounded-2xl px-3 py-2 shadow"
//               >
//                 {state.msg}
//               </motion.div>
//             ) : null}
//           </AnimatePresence>

//           <motion.button
//             type="button"
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.97 }}
//             onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); say(); }}
//             title="גרור אותי או לחץ פעמיים כדי שאדבר"
//             className="rounded-full p-1 bg-gradient-to-br from-rose-400 to-red-500 shadow-xl border border-white/40"
//           >
//             <img
//               key={`${state.genre}-${avatarStrategy}-${avatarId}-${avatarUrl ?? ''}`} // מכריח רנדר מחדש
//               src={img}
//               alt="avatar"
//               className="h-12 w-12 object-cover rounded-full"
//               onError={(e) => {
//                 // נפילה חזרה לאווטאר לפי ז'אנר
//                 (e.currentTarget as HTMLImageElement).src = AVATAR_BY_GENRE[state.genre] || AVATAR_BY_GENRE.soft;
//               }}
//               draggable={false}
//             />
//           </motion.button>

//           <div className="flex flex-col gap-1">
//             <button
//               onClick={() => dispatch({ type: 'MINIMIZED', v: !state.minimized })}
//               className="px-2 py-0.5 text-[11px] rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/60"
//               aria-pressed={state.minimized}
//               title={state.minimized ? 'הגדל' : 'מזער'}
//             >
//               {state.minimized ? '⬜' : '🗕'}
//             </button>

//             <button
//               onClick={() => dispatch({ type: 'MUTED', v: !state.muted })}
//               className="px-2 py-0.5 text-[11px] rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/60"
//               aria-pressed={state.muted}
//               title={state.muted ? 'הפעל' : 'השתק'}
//             >
//               {state.muted ? '🔇' : '🔊'}
//             </button>

//             <button
//               onClick={() => dispatch({ type: 'FOLLOW', v: !state.follow })}
//               className="px-2 py-0.5 text-[11px] rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/60"
//               aria-pressed={state.follow}
//               title={state.follow ? 'כבה מעקב' : 'הפעל מעקב'}
//             >
//               {state.follow ? '🧲' : '🧲×'}
//             </button>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// }



//==========================



// src/components/site-companion.tsx
// 'use client';
// import React, { useEffect, useState } from 'react';

// export const CompanionProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

// export default function SiteCompanion() {
//   const [hide, setHide] = useState(true);
//   useEffect(() => {
//     if (typeof window === 'undefined') return;
//     const m = window.matchMedia?.('(max-width: 767.98px), (pointer: coarse)');
//     const apply = () => setHide(!!m?.matches);
//     apply();
//     m?.addEventListener?.('change', apply);
//     return () => m?.removeEventListener?.('change', apply);
//   }, []);

//   if (hide) return null;

//   return (
//     <div
//       className="fixed z-[99998] pointer-events-none"
//       style={{
//         top: 'calc(env(safe-area-inset-top,0px) + 10px)',
//         left: 'calc(env(safe-area-inset-left,0px) + 10px)', // אם תרצה בימין: החלף ל right
//       }}
//     >
//       <a
//         href="/contact"
//         className="pointer-events-auto text-xs font-semibold px-3 py-2 rounded-full shadow border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 hover:opacity-95"
//         aria-label="צור קשר"
//         title="צור קשר"
//       >
//         צריך עזרה?
//       </a>
//     </div>
//   );
// }
// src/components/site-companion.tsx
'use client';
import React from 'react';

/** מעביר ילדים כרגיל, בלי שום מצב/הוקים/ side-effects */
export function CompanionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** לא מצייר כלום – מכובה לגמרי */
export function SiteCompanion() {
  return null;
}

export default SiteCompanion;
