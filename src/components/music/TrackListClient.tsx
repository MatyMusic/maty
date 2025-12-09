// src/components/music/TrackListClient.tsx
"use client";

import { useMemo, useState } from "react";
import MiniPlayer, { type MiniTrack } from "@/components/MiniPlayer";

export default function TrackListClient({
  initialTracks = [],
}: {
  initialTracks?: MiniTrack[];
}) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const rx = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;
    return (initialTracks || []).filter((t) =>
      rx ? rx.test(t.title) || rx.test(t.artist) : true
    );
  }, [q, initialTracks]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          dir="rtl"
          placeholder="חיפוש שיר…"
          className="input flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="text-sm opacity-70 self-center">{list.length} שירים</span>
      </div>

      {!list.length ? (
        <div className="card p-6 text-center opacity-80">אין תוצאות כרגע.</div>
      ) : (
        <ul className="grid gap-3">
          {list.map((t) => (
            <li key={t.id} className="card p-3">
              <MiniPlayer track={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
