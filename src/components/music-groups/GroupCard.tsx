// src/components/music-groups/GroupCard.tsx
"use client";

import * as React from "react";

export default function GroupCard({
  g,
  onJoin,
  onOpen,
  showStatus,
}: {
  g: any;
  onJoin?: (g: any) => void;
  onOpen?: (id: string) => void;
  showStatus?: boolean;
}) {
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold truncate" title={g?.title}>
          {g?.title}
        </div>
        {showStatus && (
          <span className="rounded-full border px-2 py-0.5 text-xs">
            {g?.status || "active"}
          </span>
        )}
      </div>
      {g?.desc && <div className="mt-1 text-sm opacity-80">{g.desc}</div>}
      <div className="mt-2 flex flex-wrap gap-1 text-[11px] opacity-70">
        {(g?.daws || []).map((d: string) => (
          <span key={d} className="rounded border px-1.5 py-0.5">
            {d}
          </span>
        ))}
        {(g?.purposes || []).map((p: string) => (
          <span key={p} className="rounded border px-1.5 py-0.5">
            {p}
          </span>
        ))}
        {(g?.skills || []).map((s: string) => (
          <span key={s} className="rounded border px-1.5 py-0.5">
            {s}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {onJoin && (
          <button className="mm-btn mm-pressable" onClick={() => onJoin(g)}>
            הצטרף
          </button>
        )}
        {onOpen && (
          <button
            className="mm-btn mm-pressable"
            onClick={() => onOpen(String(g._id))}
          >
            פתח
          </button>
        )}
      </div>
    </div>
  );
}
