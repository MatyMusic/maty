"use client";

import * as React from "react";

export default function MiniPlayerWidget() {
  // TODO: לחבר ל־global player / context אם יש לך
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <section className="rounded-2xl border border-neutral-700/60 bg-neutral-900/80 p-3 shadow-lg shadow-black/40">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-100">
          נגן מהיר – MATY MUSIC
        </h2>
      </header>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 shadow-md shadow-emerald-700/60" />
        <div className="flex-1">
          <div className="text-xs font-medium text-neutral-100 line-clamp-1">
            השיר הנוכחי / פלייליסט CLUB
          </div>
          <div className="text-[11px] text-neutral-400">
            לחץ לנגן מתוך האתר הראשי
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
            <div className="h-full w-1/3 rounded-full bg-emerald-400" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsPlaying((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-xl text-black shadow-lg shadow-emerald-800/80 hover:bg-emerald-400"
        >
          {isPlaying ? "⏸" : "▶️"}
        </button>
      </div>
    </section>
  );
}
