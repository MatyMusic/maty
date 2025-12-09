// "use client";

// import { useEffect, useRef, useState } from "react";

// /**
//  * מאזין לאירועי mm:audio:level ו־mm:audio:beat
//  * מחזיר { level, beatTick }:
//  *  - level ∈ [0,1] עוצמה משוקללת עם decay
//  *  - beatTick עולה ב־1 בכל beat (אפשר להשתמש כדי לזהות שינוי)
//  */
// export function useAudioPulse(decay: number = 0.92) {
//   const [level, setLevel] = useState(0);
//   const [beatTick, setBeatTick] = useState(0);
//   const lvlRef = useRef(0);

//   useEffect(() => {
//     let mounted = true;

//     const onLevel = (e: Event) => {
//       const detail = (e as CustomEvent<{ level?: number }>).detail;
//       const raw = typeof detail?.level === "number" ? detail.level : 0;
//       const v = Math.max(0, Math.min(1, raw));

//       // decay — שימור ערך קודם כדי שלא ייפול מייד
//       lvlRef.current = Math.max(v, lvlRef.current * decay);

//       if (mounted) setLevel(lvlRef.current);
//     };

//     const onBeat = () => {
//       if (mounted) setBeatTick((x) => x + 1);
//     };

//     window.addEventListener("mm:audio:level", onLevel as EventListener);
//     window.addEventListener("mm:audio:beat", onBeat as EventListener);

//     return () => {
//       mounted = false;
//       window.removeEventListener("mm:audio:level", onLevel as EventListener);
//       window.removeEventListener("mm:audio:beat", onBeat as EventListener);
//     };
//   }, [decay]);

//   return { level, beatTick };
// }

// src/hooks/useAudioPulse.ts
"use client";

import { useEffect, useRef, useState } from "react";

type PulseState = {
  /** ערך עוצמה נוכחי (0–1) */
  level: number;
  /** מונה ביטים (עולה בכל "בום" חדש) */
  beatTick: number;
};

/**
 * useAudioPulse
 *
 * הוק קטן שמספק:
 * - level: עוצמה (0–1) שמזיזה את האווטארים
 * - beatTick: מונה ביטים (לפי קצב פנימי)
 *
 * כרגע זה "סימולציה" נקייה בלי ניתוח אודיו אמיתי,
 * אבל בנוי כך שאפשר בעתיד לחבר אליו אירועים אמיתיים מהנגן.
 */
export function useAudioPulse(sensitivity: number = 1): PulseState {
  const [state, setState] = useState<PulseState>({ level: 0, beatTick: 0 });

  const levelRef = useRef(0);
  const beatTickRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // אפשרות לקבלת נתוני אודיו אמיתיים מאירוע גלובלי (לא חובה)
  useEffect(() => {
    const onExternalPulse = (ev: Event) => {
      const anyEv = ev as CustomEvent<{ level?: number; beat?: boolean }>;
      const lvl =
        typeof anyEv.detail?.level === "number"
          ? anyEv.detail.level
          : undefined;

      // אם נשלח level אמיתי – נשתמש בו
      if (typeof lvl === "number") {
        const clamped = Math.max(0, Math.min(1, lvl * sensitivity));
        levelRef.current = clamped;
        setState((prev) => ({
          level: clamped,
          beatTick: prev.beatTick,
        }));
      }

      // אם נשלח beat=true – נעלה ביט
      if (anyEv.detail?.beat) {
        beatTickRef.current += 1;
        setState((prev) => ({
          level: Math.max(prev.level, 0.9),
          beatTick: beatTickRef.current,
        }));
      }
    };

    window.addEventListener("mm:audio-pulse", onExternalPulse as any);

    return () => {
      window.removeEventListener("mm:audio-pulse", onExternalPulse as any);
    };
  }, [sensitivity]);

  // לולאת אנימציה בסיסית ל"פולס" גם בלי אודיו
  useEffect(() => {
    const BEAT_INTERVAL = 0.7; // שניות בין ביטים
    let beatAccumulator = 0;

    const loop = (time: number) => {
      if (lastTimeRef.current == null) {
        lastTimeRef.current = time;
      }
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // דעיכה טבעית של העוצמה
      let level = levelRef.current * 0.9;

      beatAccumulator += dt;
      if (beatAccumulator >= BEAT_INTERVAL) {
        beatAccumulator -= BEAT_INTERVAL;
        // "בום" קטן
        beatTickRef.current += 1;
        level = 1 * sensitivity;
      }

      // רעש קל, שיהיה חי גם בלי ביט
      const wiggle = (Math.sin(time * 0.004) + 1) * 0.04 * sensitivity;
      level = Math.max(0, Math.min(1, level + wiggle));

      levelRef.current = level;

      setState({
        level,
        beatTick: beatTickRef.current,
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      lastTimeRef.current = null;
    };
  }, [sensitivity]);

  return state;
}
