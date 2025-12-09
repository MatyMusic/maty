// src/components/music/TrackClient.tsx
"use client";

import Link from "next/link";

type TrackDoc = {
  _id: string;
  title?: string;
  publicId: string;
  url: string;
  thumbUrl?: string;
  duration?: number;
  tags?: string[];
  format?: string;
  createdAt?: string;
};

type Props = {
  track: TrackDoc;
  related?: TrackDoc[];
  cat: string | null;
};

function formatDuration(sec?: number) {
  if (!sec || !Number.isFinite(sec)) return "";
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function catLabel(cat: string | null) {
  if (!cat) return "כללי";
  if (cat === "chabad") return "חב״ד";
  if (cat === "mizrahi") return "מזרחי";
  if (cat === "soft") return "שקט";
  if (cat === "fun") return "מקפיץ";
  return cat;
}

export default function TrackClient({ track, related = [], cat }: Props) {
  const title = track.title || track.publicId;
  const hasThumb = !!track.thumbUrl;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col gap-6 px-4 py-6">
      {/* כותרת */}
      <header className="flex flex-col gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-50">{title}</h1>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-700/30 px-3 py-1 text-xs font-semibold text-emerald-200">
            קטגוריה: {catLabel(cat)}
          </span>
        </div>
        <p className="text-sm text-slate-300">
          האזנה לשיר מתוך ספריית{" "}
          <span className="font-semibold text-emerald-300">MATY MUSIC</span>.
        </p>
      </header>

      {/* נגן ראשי */}
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex w-full items-center justify-center md:w-48">
            <div className="relative h-40 w-40 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
              {hasThumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={track.thumbUrl}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                  אין עטיפה
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
              {track.duration && (
                <p className="text-xs text-slate-400">
                  אורך: {formatDuration(track.duration)}
                </p>
              )}
              {track.tags && track.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-slate-300">
                  {track.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-slate-800 px-2 py-0.5"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <audio
                src={track.url}
                controls
                className="mt-1 w-full"
                preload="none"
                onError={() => {
                  console.warn("שגיאה בניגון השיר", track.url);
                }}
              />
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="rounded-full bg-slate-800 px-2 py-0.5">
                  פורמט: {track.format || "לא ידוע"}
                </span>
                {track.createdAt && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5">
                    נוסף:{" "}
                    {new Date(track.createdAt).toLocaleDateString("he-IL")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* שירים קשורים */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">שירים קשורים</h2>
        {!related.length ? (
          <p className="text-sm text-slate-400">אין שירים קשורים כרגע.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {related.map((t) => (
              <li
                key={t._id}
                className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3"
              >
                <div className="h-14 w-14 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                  {t.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.thumbUrl}
                      alt={t.title || t.publicId}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                      ללא עטיפה
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-50">
                    {t.title || t.publicId}
                  </div>
                  {t.duration && (
                    <div className="text-[11px] text-slate-400">
                      {formatDuration(t.duration)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Link
                    href={`/track/${encodeURIComponent(t.publicId)}`}
                    className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    נגן
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-4 text-center text-xs text-slate-500">
        חזרה ל־{" "}
        <Link href="/music" className="text-emerald-300 hover:underline">
          עמוד המוזיקה
        </Link>
      </div>
    </main>
  );
}
