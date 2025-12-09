// src/components/decor/FloatingNotesGlobal.tsx
"use client";

import { useEffect, useRef, useState } from "react";

/** תווים קבועים */
const NOTES = ["♪", "♫", "♬", "♩", "♭"];

type CategoryKey = "club" | "chabad" | "mizrahi" | "soft" | "fun";

/**
 * תווים פורחים גלובליים ריאקטיביים למוזיקה:
 * - hue/saturation לפי mm:audio:bands
 * - מהירות לפי mm:audio:level
 * - פולס עדין על mm:audio:beat
 * - מכבד prefers-reduced-motion
 */
export default function FloatingNotesGlobal({
  density = 12,
  topOffset = 0,
  zIndex = 1,
  opacity = 0.28,
}: {
  density?: number;
  topOffset?: number;
  zIndex?: number;
  opacity?: number;
}) {
  const [enabled, setEnabled] = useState(false);
  const [cat, setCat] = useState<CategoryKey>("soft");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // כיבוי באנימציה מופחתת
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // מיפוי קטגוריה → hue בסיסי
  const categoryHue = (c: CategoryKey) => {
    switch (c) {
      case "club":
        return 265; // ויולט (תואם ברנד)
      case "chabad":
        return 265;
      case "mizrahi":
        return 28;
      case "soft":
        return 205;
      case "fun":
      default:
        return 315;
    }
  };

  // האזנה לקטגוריה חיצונית
  useEffect(() => {
    const onCat = (e: Event) => {
      const d = (e as CustomEvent).detail;
      const v = d?.category as CategoryKey | undefined;
      if (v && ["club", "chabad", "mizrahi", "soft", "fun"].includes(v)) {
        setCat(v);
      }
    };
    window.addEventListener("mm:setCategory", onCat as EventListener);
    return () =>
      window.removeEventListener("mm:setCategory", onCat as EventListener);
  }, []);

  // 🎚️ Hue/Sat ריאקטיבי לפי ספקטרום (Bass/Treble)
  const hueRef = useRef<number>(categoryHue(cat));
  const satRef = useRef<number>(60);
  useEffect(() => {
    hueRef.current = categoryHue(cat);
    if (wrapRef.current) {
      wrapRef.current.style.setProperty(
        "--mm-notes-hue",
        String(hueRef.current)
      );
    }
  }, [cat]);

  useEffect(() => {
    const onBands = (e: Event) => {
      if (!wrapRef.current) return;
      const d =
        (e as CustomEvent<{ bass?: number; mid?: number; treble?: number }>)
          .detail || {};
      const b = Math.max(0, Math.min(1, d.bass ?? 0));
      const t = Math.max(0, Math.min(1, d.treble ?? 0));
      const mix = b / (b + t + 1e-4); // יחס בייס↔טרבל
      const targetHue = 260 - 220 * mix; // 260→40
      hueRef.current = hueRef.current * 0.9 + targetHue * 0.1;

      const targetSat = 55 + Math.max(b, t) * 35; // 55–90%
      satRef.current = satRef.current * 0.9 + targetSat * 0.1;

      wrapRef.current.style.setProperty("--mm-notes-hue", `${hueRef.current}`);
      wrapRef.current.style.setProperty("--mm-notes-sat", `${satRef.current}%`);
    };
    window.addEventListener("mm:audio:bands", onBands as EventListener);
    return () =>
      window.removeEventListener("mm:audio:bands", onBands as EventListener);
  }, []);

  // ⚡ מהירות + פולס לפי level/beat
  const levelRef = useRef(0);
  const boostRef = useRef(0); // דעיכה אחרי beat
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const onLevel = (e: Event) => {
      const v = (e as CustomEvent<{ level?: number }>).detail?.level ?? 0;
      levelRef.current = Math.max(0, Math.min(1, v));
    };
    const onBeat = () => {
      boostRef.current = 1;
    };

    window.addEventListener("mm:audio:level", onLevel as EventListener);
    window.addEventListener("mm:audio:beat", onBeat as EventListener);

    const tick = () => {
      const el = wrapRef.current;
      if (el) {
        const speed = 1 + levelRef.current * 0.6; // 1–1.6
        el.style.setProperty("--mm-notes-speed", String(speed));

        boostRef.current = Math.max(0, boostRef.current * 0.88);
        const scale = 1 + boostRef.current * 0.25;
        const jumpPx = boostRef.current * 10;
        el.style.setProperty("--mm-notes-pulse-scale", String(scale));
        el.style.setProperty("--mm-notes-pulse-jump", `${jumpPx}px`);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mm:audio:level", onLevel as EventListener);
      window.removeEventListener("mm:audio:beat", onBeat as EventListener);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // אין hooks אחרי זה
  if (!enabled) return null;

  // מערך תווים דטרמיניסטי (ללא random כדי למנוע mismatch)
  const items = Array.from({ length: density }).map((_, i) => {
    const delay = (i * 0.6) % 6;
    const dur = 8 + ((i * 7) % 5); // 8–12s
    const size =
      i % 3 === 0 ? "text-xl" : i % 3 === 1 ? "text-base" : "text-sm";
    const left = `${5 + ((i * 97) % 90)}%`; // 5%–95%
    const o = opacity + (i % 4) * 0.08;
    const xAmpl = 8 + (i % 5) * 3;
    return {
      id: i,
      note: NOTES[i % NOTES.length],
      delay,
      dur,
      size,
      left,
      o,
      xAmpl,
    };
  });

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="fixed inset-x-0 pointer-events-none select-none"
      style={{
        top: topOffset,
        bottom: 0,
        zIndex,
        // CSS Vars התחלתיים
        ["--mm-notes-hue" as any]: String(categoryHue(cat)),
        ["--mm-notes-sat" as any]: "60%",
        ["--mm-notes-speed" as any]: "1",
        ["--mm-notes-pulse-scale" as any]: "1",
        ["--mm-notes-pulse-jump" as any]: "0px",
      }}
    >
      <div className="absolute inset-0 overflow-visible">
        {items.map(({ id, note, delay, dur, size, left, o, xAmpl }) => (
          <span
            key={id}
            className={["absolute will-change-transform", size].join(" ")}
            style={{
              left,
              bottom: "-8%",
              opacity: o,
              animationName: "mmFloat",
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              animationDelay: `${delay}s`,
              animationDuration: `calc(${dur}s / var(--mm-notes-speed, 1))`,
              ["--mm-x-ampl" as any]: `${xAmpl}px`,
            }}
          >
            <span
              className="inline-block will-change-transform"
              style={{
                transform:
                  "translateZ(0) translateY(calc(var(--mm-notes-pulse-jump, 0px) * -1)) scale(var(--mm-notes-pulse-scale, 1))",
                color:
                  "hsl(var(--mm-notes-hue,260) var(--mm-notes-sat,60%) 60% / 0.85)",
                filter:
                  "drop-shadow(0 0 0.6px hsl(var(--mm-notes-hue,260) var(--mm-notes-sat,60%) 60% / 0.55))",
              }}
            >
              {note}
            </span>
          </span>
        ))}
      </div>

      <style jsx>{`
        @keyframes mmFloat {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          50% {
            transform: translateY(-40vh) translateX(var(--mm-x-ampl, 10px))
              rotate(9deg);
          }
          100% {
            transform: translateY(-80vh)
              translateX(calc(var(--mm-x-ampl, 10px) * -1)) rotate(-9deg);
          }
        }
      `}</style>
    </div>
  );
}
