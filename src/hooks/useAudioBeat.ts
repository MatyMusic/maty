// src/hooks/useAudioBeat.ts
"use client";

import { useEffect, useRef, useState } from "react";

type Opts = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** 256/512/1024/2048... גדול יותר = רזולוציה גבוהה יותר */
  fftSize?: number;
  /** 0..1 – כמה להחליק (גבוה = חלק יותר) */
  smoothing?: number;
  /** מגבר קל לרגישות */
  boost?: number;
  /** כמה בינים נמוכים לקחת לביט (Beat מרגישים בבאסים) */
  lowBins?: number;
};

export function useAudioBeat({
  audioRef,
  fftSize = 1024,
  smoothing = 0.85,
  boost = 1.1,
  lowBins = 32,
}: Opts) {
  const [level, setLevel] = useState(0); // 0..1
  const [connected, setConnected] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<MediaElementAudioSourceNode | null>(null);
  const anRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const arrRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let mounted = true;

    const ensure = async () => {
      if (!mounted) return;
      if (!ctxRef.current) {
        try {
          ctxRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        } catch {
          return;
        }
      }
      const ctx = ctxRef.current!;
      if (ctx.state === "suspended") {
        // חייב מחוות משתמש בחלק מהדפדפנים
        try {
          await ctx.resume();
        } catch {}
      }
      if (!srcRef.current) {
        srcRef.current = ctx.createMediaElementSource(audio);
      }
      if (!anRef.current) {
        const an = ctx.createAnalyser();
        an.fftSize = fftSize;
        an.smoothingTimeConstant = 0.6; // החלקת ספקטרום פנימית
        srcRef.current!.connect(an);
        an.connect(ctx.destination);
        anRef.current = an;
        arrRef.current = new Uint8Array(an.frequencyBinCount);
      }
      setConnected(true);
      loop();
    };

    const onPlay = () => ensure();
    const onEnded = () => setLevel(0);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("playing", onPlay);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", () => {}); // לא סוגר—שומר חיבור חי

    // אם כבר מנגן בזמן מונט
    if (!audio.paused) ensure();

    function loop() {
      if (!mounted || !anRef.current || !arrRef.current) return;
      const an = anRef.current;
      const data = arrRef.current;
      an.getByteFrequencyData(data);

      // אנרגיית באס: סכום הבינים הנמוכים
      const n = Math.min(lowBins, data.length);
      let sum = 0;
      for (let i = 0; i < n; i++) sum += data[i];
      let v = (sum / (n * 255)) * boost; // 0..~1
      if (v > 1) v = 1;

      // החלקת EMA
      setLevel((prev) => {
        const nv = prev * smoothing + v * (1 - smoothing);
        // שידור לאופציות אחרות (למי שרוצה להאזין גלובלית)
        window.dispatchEvent(
          new CustomEvent("mm:beat", { detail: { level: nv } })
        );
        return nv;
      });

      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // משאירים את ה-AudioContext חי לפעם הבאה (שיפור UX),
      // אבל אם תרצה לשחרר לגמרי:
      // anRef.current?.disconnect(); srcRef.current?.disconnect();
    };
  }, [audioRef, fftSize, smoothing, boost, lowBins]);

  return { level, connected };
}

export default useAudioBeat;
