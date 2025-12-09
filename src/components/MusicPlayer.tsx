// // src/components/MusicPlayer.tsx
// 'use client'

// import { useEffect, useRef, useState } from 'react'

// type CategoryKey = 'chabad' | 'mizrahi' | 'soft' | 'fun'
// type Track = { title: string; artist: string; src: string }
// type Library = Record<CategoryKey, Track[]>

// const LIB: Library = {
//   chabad: [
//     { title: 'ניגון חב״ד — דמו', artist: 'MATY MUSIC', src: '/demo.mp3' },
//   ],
//   mizrahi: [
//     { title: 'ים־תיכוני — דמו', artist: 'MATY MUSIC', src: '/demo.mp3' },
//   ],
//   soft: [
//     { title: 'בלדה שקטה — דמו', artist: 'MATY MUSIC', src: '/demo.mp3' },
//   ],
//   fun: [
//     { title: 'סט מקפיץ — דמו', artist: 'MATY MUSIC', src: '/demo.mp3' },
//   ],
// }

// const LABEL: Record<CategoryKey, string> = {
//   chabad: 'חסידי',
//   mizrahi: 'מזרחי',
//   soft: 'שקט',
//   fun: 'מקפיץ',
// }

// export default function MusicPlayer() {
//   const audioRef = useRef<HTMLAudioElement | null>(null)
//   const [mounted, setMounted] = useState(false)

//   // מצב בסיסי
//   const [category, setCategory] = useState<CategoryKey>('fun')
//   const [index, setIndex] = useState(0)
//   const [playing, setPlaying] = useState(false)
//   const track = (LIB[category] ?? [])[index]

//   // אחרי mount – טוענים קטגוריה אחרונה, מאזינים לאירוע מה-Hero
//   useEffect(() => {
//     setMounted(true)

//     try {
//       const saved = localStorage.getItem('mm:category') as CategoryKey | null
//       if (saved && LIB[saved]) setCategory(saved)
//     } catch {}

//     const onCat = (e: Event) => {
//       try {
//         const detail = (e as CustomEvent).detail as { category: CategoryKey }
//         if (detail?.category && LIB[detail.category]) {
//           setCategory(detail.category)
//           localStorage.setItem('mm:category', detail.category)
//         }
//       } catch {}
//     }
//     window.addEventListener('mm:setCategory' as any, onCat)
//     return () => window.removeEventListener('mm:setCategory' as any, onCat)
//   }, [])

//   // כשקטגוריה משתנה – קופצים לרצועה הראשונה
//   useEffect(() => {
//     setIndex(0)
//   }, [category])

//   // Play/Pause
//   const toggle = () => {
//     const a = audioRef.current
//     if (!a) return
//     if (a.paused) { a.play(); setPlaying(true) } else { a.pause(); setPlaying(false) }
//   }

//   // כששיר הסתיים – הבא
//   const onEnded = () => {
//     const list = LIB[category] ?? []
//     const next = (index + 1) % (list.length || 1)
//     setIndex(next)
//     // ננגן אוטומטית אם כבר היינו ב-Play
//     if (playing) {
//       setTimeout(() => audioRef.current?.play().catch(() => {}), 50)
//     }
//   }

//   return (
//     <div className="grid md:grid-cols-[1fr_auto] gap-4 items-center">
//       {/* מידע על הרצועה — עוטפים בסופרס כדי לא להתרסק ב-Hydration */}
//       <div>
//         <div className="text-sm opacity-70" suppressHydrationWarning>
//           קטגוריה: <b>{mounted ? LABEL[category] : ''}</b>
//         </div>
//         <div className="text-lg font-semibold" suppressHydrationWarning>
//           {mounted ? (track?.title ?? '—') : '—'}
//         </div>
//         <div className="text-sm opacity-80" suppressHydrationWarning>
//           {mounted ? (track?.artist ?? '') : ''}
//         </div>
//       </div>

//       {/* בקרי נגן */}
//       <div className="flex items-center gap-3">
//         <audio
//           ref={audioRef}
//           src={track?.src}
//           preload="none"
//           onEnded={onEnded}
//           onPlay={() => setPlaying(true)}
//           onPause={() => setPlaying(false)}
//         />
//         <button className="btn" onClick={toggle}>{playing ? 'Pause' : 'Play'}</button>

//         {/* בחירת רצועה בתוך הקטגוריה (אופציונלי) */}
//         <select
//           className="rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5"
//           value={index}
//           onChange={(e) => setIndex(Number(e.target.value))}
//         >
//           {(LIB[category] ?? []).map((t, i) => (
//             <option key={i} value={i}>{t.title}</option>
//           ))}
//         </select>
//       </div>
//     </div>
//   )
// }

"use client";
import { usePlayer, type TrackLike } from "@/context/player";
import { Play } from "lucide-react";

export default function MusicPlayer({
  track,
  queue,
}: {
  track: TrackLike;
  queue?: TrackLike[];
}) {
  const p = usePlayer();
  const start = () => p.play(track, queue);
  return (
    <button
      onClick={start}
      className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
      title="נגן"
    >
      <Play size={18} /> נגן
    </button>
  );
}
