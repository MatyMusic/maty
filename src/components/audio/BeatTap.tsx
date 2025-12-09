"use client";

import { useEffect } from "react";

/**
 * מצמיד ל-<audio> (ברירת מחדל: #pro-player-audio) ומחשב בזמן אמת:
 *  - mm:audio:level  { level }
 *  - mm:audio:beat   (אירוע קצב)
 *  - mm:audio:bands  { bass, mid, treble, centroid }
 *
 * הערה: לא מחברים ל-AudioContext.destination כדי למנוע כפילות אודיו/אקו.
 */
export default function BeatTap({
  selector = "#pro-player-audio",
  fftSize = 2048, // כוח הפרדה ספקטרלי
  smoothing = 0.85, // החלקה ספקטרלית
}: {
  selector?: string;
  fftSize?: number;
  smoothing?: number;
}) {
  useEffect(() => {
    let disposed = false;
    let raf = 0;

    let ac: AudioContext | null = null;
    let source: MediaElementAudioSourceNode | null = null;
    let analyserTime: AnalyserNode | null = null;
    let analyserFreq: AnalyserNode | null = null;

    const td: Uint8Array[] = []; // נאכלס אחרי יצירה
    const fd: Uint8Array[] = [];

    // דינמי: לפעמים האלמנט נטען אחרי המונט. נמתין לו נקי ובטוח.
    const findAudioEl = (): HTMLAudioElement | null =>
      document.querySelector<HTMLAudioElement>(selector);

    const setupAudioGraph = (audio: HTMLAudioElement) => {
      // Safari תמיכה
      const Ctx = (window.AudioContext ||
        (window as any).webkitAudioContext) as typeof AudioContext;
      ac = new Ctx();

      source = ac.createMediaElementSource(audio);

      analyserTime = ac.createAnalyser();
      analyserFreq = ac.createAnalyser();

      analyserTime.fftSize = 2048;
      analyserTime.smoothingTimeConstant = 0.7;

      analyserFreq.fftSize = fftSize;
      analyserFreq.smoothingTimeConstant = smoothing;

      // חיבור לקריאה בלבד (ללא destination!)
      source.connect(analyserTime);
      source.connect(analyserFreq);

      const timeData = new Uint8Array(analyserTime.frequencyBinCount);
      const freqData = new Uint8Array(analyserFreq.frequencyBinCount);
      td[0] = timeData;
      fd[0] = freqData;

      // Beat detection (EMA + סף אדפטיבי)
      let ema = 0;
      let thr = 0.08;
      let cooldown = 0;
      const COOLDOWN_FRAMES = 8;
      const nyquist = ac.sampleRate / 2;

      const bandEnergy = (lowHz: number, highHz: number) => {
        const arr = fd[0];
        const len = arr.length;
        if (!len) return 0;

        const lowIdx = Math.max(0, Math.floor((lowHz / nyquist) * len));
        const highIdx = Math.min(len - 1, Math.ceil((highHz / nyquist) * len));
        if (highIdx <= lowIdx) return 0;

        let sum = 0;
        for (let i = lowIdx; i <= highIdx; i++) sum += arr[i];
        const avg = sum / (highIdx - lowIdx + 1);

        // נרמול + גמא עדינה לרגישות
        return Math.min(1, Math.pow(avg / 255, 0.85));
      };

      const tick = () => {
        if (disposed || !analyserTime || !analyserFreq) return;

        // ===== זמן (RMS) =====
        analyserTime.getByteTimeDomainData(td[0]);
        let sum = 0;
        for (let i = 0; i < td[0].length; i++) {
          const v = (td[0][i] - 128) / 128; // -1..1
          sum += v * v;
        }
        const rms = Math.sqrt(sum / td[0].length);
        const level = Math.min(1, rms * 2.5);

        ema = ema * 0.9 + level * 0.1;
        thr = thr * 0.995 + ema * 1.35 * 0.005;

        window.dispatchEvent(
          new CustomEvent("mm:audio:level", { detail: { level } })
        );

        if (cooldown === 0 && level > Math.max(0.06, thr + 0.02)) {
          window.dispatchEvent(new CustomEvent("mm:audio:beat"));
          cooldown = COOLDOWN_FRAMES;
        }
        if (cooldown > 0) cooldown--;

        // ===== ספקטרום (Bands) =====
        analyserFreq.getByteFrequencyData(fd[0]);

        const bass = bandEnergy(20, 160);
        const mid = bandEnergy(160, 2000);
        const treble = bandEnergy(2000, 8000);

        // ספקטרל צנטרואיד מקורב (0..1 יחסית ל-Nyquist)
        let sumMag = 0,
          sumFreqMag = 0;
        for (let i = 0; i < fd[0].length; i++) {
          const mag = fd[0][i] / 255;
          const freq = (i / fd[0].length) * nyquist;
          sumMag += mag;
          sumFreqMag += freq * mag;
        }
        const centroid = sumMag > 0 ? sumFreqMag / sumMag / nyquist : 0;

        window.dispatchEvent(
          new CustomEvent("mm:audio:bands", {
            detail: { bass, mid, treble, centroid },
          })
        );

        raf = requestAnimationFrame(tick);
      };

      // רז'יום — גם על play וגם על אינטראקציה ראשונה
      const resume = () => {
        if (ac && ac.state === "suspended") {
          ac.resume().catch(() => {});
        }
      };
      const onPlay = () => resume();

      audio.addEventListener("play", onPlay, { passive: true });
      const onFirstClick = () => {
        resume();
        window.removeEventListener("click", onFirstClick);
        window.removeEventListener("keydown", onFirstKey);
      };
      const onFirstKey = () => {
        resume();
        window.removeEventListener("click", onFirstClick);
        window.removeEventListener("keydown", onFirstKey);
      };
      window.addEventListener("click", onFirstClick, { passive: true });
      window.addEventListener("keydown", onFirstKey);

      raf = requestAnimationFrame(tick);

      // cleanup מקומי
      return () => {
        audio.removeEventListener("play", onPlay);
        window.removeEventListener("click", onFirstClick);
        window.removeEventListener("keydown", onFirstKey);
      };
    };

    // נסה מיד, ואם אין — חכה עם MutationObserver
    let teardownLocal: (() => void) | null = null;

    const tryInit = (): boolean => {
      const el = findAudioEl();
      if (!el) return false;
      teardownLocal = setupAudioGraph(el);
      return true;
    };

    if (!tryInit()) {
      const mo = new MutationObserver(() => {
        if (tryInit()) mo.disconnect();
      });
      mo.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      // ביטול אם מפרקים לפני שמצאנו
      const stopIfDisposed = () => {
        if (disposed) mo.disconnect();
      };
      requestAnimationFrame(stopIfDisposed);
    }

    // cleanup כולל
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      try {
        teardownLocal && teardownLocal();
        source && source.disconnect();
        analyserTime && analyserTime.disconnect();
        analyserFreq && analyserFreq.disconnect();
        // לא סוגרים את ה-AudioContext אם יתכן שימוש עתידי באתר;
        // אם רוצים לשחרר לגמרי:
        ac && ac.close();
      } catch {}
    };
  }, [selector, fftSize, smoothing]);

  return null;
}
