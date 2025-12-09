"use client";

import { useEffect, useRef, useState } from "react";

export type Bands = {
  bass: number;
  mid: number;
  treble: number;
  centroid: number;
};

/**
 * מאזין ל-mm:audio:bands ומחזיר ערכים מוחלקים (decay) בטווח [0..1].
 */
export function useAudioBands(decay: number = 0.88) {
  const [bands, setBands] = useState<Bands>({
    bass: 0,
    mid: 0,
    treble: 0,
    centroid: 0,
  });
  const ref = useRef(bands);

  useEffect(() => {
    ref.current = bands;
  }, [bands]);

  useEffect(() => {
    let mounted = true;
    const onBands = (e: Event) => {
      const d = (e as CustomEvent<Bands>).detail || {
        bass: 0,
        mid: 0,
        treble: 0,
        centroid: 0,
      };
      const prev = ref.current;
      const next: Bands = {
        bass: Math.max(d.bass, prev.bass * decay),
        mid: Math.max(d.mid, prev.mid * decay),
        treble: Math.max(d.treble, prev.treble * decay),
        centroid: Math.max(d.centroid, prev.centroid * decay),
      };
      if (mounted) setBands(next);
    };
    window.addEventListener("mm:audio:bands", onBands as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener("mm:audio:bands", onBands as EventListener);
    };
  }, [decay]);

  return bands;
}
