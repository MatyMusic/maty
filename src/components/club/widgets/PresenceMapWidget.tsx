"use client";

import * as React from "react";

type PresenceUser = {
  id: string;
  name: string;
  city?: string;
  distanceKm?: number;
  avatarUrl?: string;
  genre?: string;
  isOnline: boolean;
};

type ApiResp = {
  ok: boolean;
  items?: PresenceUser[];
  error?: string;
};

function formatDistance(v?: number) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "";
  if (v < 1) return `${(v * 1000).toFixed(0)} מ׳`;
  if (v < 10) return `${v.toFixed(1)} ק״מ`;
  return `${Math.round(v)} ק״מ`;
}

export default function PresenceMapWidget() {
  const [items, setItems] = React.useState<PresenceUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/club/presence/list", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data: ApiResp = await res.json();
        if (!data.ok) throw new Error(data.error || "שגיאה בטעינת נוכחות");
        if (!cancelled) {
          setItems(data.items || []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "שגיאה לא צפויה");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 30_000); // רענון כל חצי דקה
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const onlineCount = items.filter((u) => u.isOnline).length;

  return (
    <section className="rounded-2xl border border-neutral-700/60 bg-neutral-900/70 p-3 shadow-xl shadow-black/40 backdrop-blur-md">
      <header className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100">
            מי איתך עכשיו ב־CLUB
          </h2>
          <p className="text-xs text-neutral-400">
            {onlineCount > 0
              ? `${onlineCount} מחוברים כרגע`
              : "אין מספיק מידע כרגע"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </span>
      </header>

      {/* "מפה" ויזואלית — פס עם נקודות לפי מרחק משוער */}
      <div className="relative mb-3 mt-1 h-20 rounded-xl bg-gradient-to-l from-sky-900/60 via-neutral-900 to-violet-900/60 px-2 py-1 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)] pointer-events-none" />

        <div className="relative flex h-full items-center justify-between gap-1">
          {items.slice(0, 10).map((u) => (
            <div
              key={u.id}
              className="group flex h-full flex-col items-center justify-end"
            >
              <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-black/50 text-[11px] font-semibold text-white shadow-md shadow-black/60">
                {u.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.avatarUrl}
                    alt={u.name}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  (u.name?.[0] || "?").toUpperCase()
                )}
              </div>
              <div className="h-5 w-0.5 rounded-full bg-emerald-400/70 group-hover:bg-emerald-300" />
            </div>
          ))}

          {items.length === 0 && (
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
              עדיין אין נתוני מיקום להצגה
            </div>
          )}
        </div>
      </div>

      {/* רשימה קצרה של הקרובים אליך */}
      <div className="space-y-1.5">
        {loading && (
          <p className="text-xs text-neutral-400">טוען נתוני מיקומים…</p>
        )}
        {error && <p className="text-xs text-red-400">שגיאה: {error}</p>}
        {!loading &&
          !error &&
          items
            .slice()
            .sort(
              (a, b) =>
                (a.distanceKm ?? Number.POSITIVE_INFINITY) -
                (b.distanceKm ?? Number.POSITIVE_INFINITY),
            )
            .slice(0, 4)
            .map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg bg-neutral-900/60 px-2 py-1.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="relative h-7 w-7">
                    {u.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-700 text-[11px] font-semibold text-white">
                        {u.name?.[0] || "?"}
                      </div>
                    )}
                    {u.isOnline && (
                      <span className="absolute -bottom-0.5 -left-0.5 h-2 w-2 rounded-full border border-black bg-emerald-400" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-neutral-100">
                      {u.name}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {u.city || "מיקום לא ידוע"}
                      {u.distanceKm != null &&
                        ` • ${formatDistance(u.distanceKm)} ממך`}
                    </span>
                  </div>
                </div>
                {u.genre && (
                  <span className="rounded-full bg-neutral-800/70 px-2 py-0.5 text-[11px] text-neutral-300">
                    {u.genre}
                  </span>
                )}
              </div>
            ))}
      </div>
    </section>
  );
}
