// src/components/club/RealtimeUsersBadge.tsx
"use client";
import React from "react";

export default function RealtimeUsersBadge({
  pollMs = 20000,
}: {
  pollMs?: number;
}) {
  const [n, setN] = React.useState<number>(0);
  const [hist, setHist] = React.useState<number[]>([]);

  async function tick() {
    try {
      const r = await fetch("/api/club/presence", { cache: "no-store" });
      const j = await r.json();
      if (!j?.ok) return;
      const count = Array.isArray(j.online) ? j.online.length : 0;
      setN(count);
      setHist((h) => [...h.slice(-24), count]);
    } catch {}
  }

  React.useEffect(() => {
    tick();
    const id = setInterval(tick, pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  // מיני-ספארקליין
  const values = hist.length ? hist : [0];
  const w = Math.max(60, values.length * 6);
  const h = 20;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * (w - 2) + 1;
    const y = h - (v / max) * (h - 2) - 1;
    return [x, y] as const;
  });
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0] + "," + p[1]).join(" ");

  return (
    <div className="flex items-center gap-2 rounded-full border px-2 py-1 text-xs bg-white/70 dark:bg-neutral-900/70">
      <span className="inline-block size-2 rounded-full bg-emerald-500" />
      <span>
        מחוברים: <b className="tabular-nums">{n}</b>
      </span>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        className="opacity-70"
        aria-hidden
      >
        <path d={path} stroke="currentColor" fill="none" />
      </svg>
    </div>
  );
}

/* שימוש לדוגמה (ב-Header):
  import RealtimeUsersBadge from "@/components/club/RealtimeUsersBadge";
  ...
  <RealtimeUsersBadge pollMs={15000} />
*/
