// src/components/date/MusicVibesCard.tsx
"use client";
import * as React from "react";

type Track = { title: string; artists: string[]; cover?: string; url?: string };

export default function MusicVibesCard() {
  const [tracks, setTracks] = React.useState<Track[] | null>(null);

  React.useEffect(() => {
    fetch("/api/music/top?limit=3", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) setTracks(j.tracks);
      })
      .catch(() => {});
  }, []);

  if (!tracks || tracks.length === 0) return null;

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/80 dark:bg-neutral-900/70">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">🎵 וייב מוזיקלי</div>
        <a href="/me/saved" className="text-xs text-violet-600 underline">
          עוד
        </a>
      </div>
      <ul className="grid gap-2">
        {tracks.map((t, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-200 overflow-hidden">
              {t.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.cover}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{t.title}</div>
              <div className="text-xs text-neutral-500 truncate">
                {t.artists?.join(", ")}
              </div>
            </div>
            <div className="ml-auto">
              {t.url ? (
                <a
                  className="text-xs text-violet-600 underline"
                  href={t.url}
                  target="_blank"
                >
                  נגן
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
