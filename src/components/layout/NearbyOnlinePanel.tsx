
// src /components/layout/NearbyOnlinePanel.tsx

"use client";

import * as React from "react";

type PresenceUser = {
  id: string;
  name: string;
  city?: string;
  country?: string;
  avatarUrl?: string;
  status?: "music" | "club" | "date" | "idle";
  distanceKm?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function NearbyOnlinePanel({ open, onClose }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [users, setUsers] = React.useState<PresenceUser[]>([]);

  React.useEffect(() => {
    if (!open) return;

    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // נסה למשוך מהשרת – תחליף לכתובת ה-API שלך אם צריך
        const r = await fetch("/api/presence/around?radiusKm=20", {
          cache: "no-store",
        });
        let rows: any[] | null = null;

        if (r.ok) {
          const j = await r.json().catch(() => null);
          rows = j?.items || j?.users || j?.rows || null;
        }

        // FALLBACK DEMO – אם אין עדיין API בצד שרת
        if (!rows || !rows.length) {
          rows = [
            {
              id: "demo-1",
              name: "יוסי",
              city: "לוד",
              country: "IL",
              status: "music",
              distanceKm: 2.4,
            },
            {
              id: "demo-2",
              name: "שרה",
              city: "מודיעין",
              country: "IL",
              status: "club",
              distanceKm: 12.7,
            },
          ];
        }

        if (!alive) return;

        const mapped: PresenceUser[] = rows.map((u: any, i: number) => ({
          id: String(u.id || u._id || i),
          name: String(u.name || u.nickname || u.email || "אורח"),
          city: u.city,
          country: u.country,
          avatarUrl: u.avatarUrl || u.image,
          status: u.status || "idle",
          distanceKm:
            typeof u.distanceKm === "number" ? u.distanceKm : undefined,
        }));

        setUsers(mapped);
      } catch (err: any) {
        console.error(err);
        if (!alive) return;
        setError("לא הצלחתי לטעון מי מסביבך כרגע.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();

    return () => {
      alive = false;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-end bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mt-16 mr-3 mb-4 w-full max-w-sm rounded-3xl bg-neutral-950/95 text-white border border-neutral-700 shadow-2xl flex flex-col"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/10">
          <div className="text-sm font-semibold">מי מסביבי עכשיו</div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/15 text-xs"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>

        <div className="px-4 pt-2 pb-3 text-[11px] opacity-80">
          רואים כאן משתמשים מחוברים (Music / Club / Date) לפי מיקום משוער.
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
          {loading && (
            <div className="text-xs opacity-80 px-1">טוען נתונים…</div>
          )}
          {error && <div className="text-xs text-amber-300 px-1">{error}</div>}
          {!loading && !users.length && !error && (
            <div className="text-xs opacity-80 px-1">
              כרגע אין משתמשים מחוברים לידך.
            </div>
          )}

          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold">
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt={u.name}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  u.name.slice(0, 2)
                )}
              </div>
              <div className="flex-1 text-right">
                <div className="text-xs font-semibold">{u.name}</div>
                <div className="text-[11px] opacity-75">
                  {u.city && u.country
                    ? `${u.city}, ${u.country}`
                    : u.city || "מיקום לא ידוע"}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 text-[10px]">
                {u.distanceKm && (
                  <span className="opacity-80">
                    ~{u.distanceKm.toFixed(1)} ק״מ
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-[1px]">
                  <span
                    className={
                      u.status === "music"
                        ? "h-1.5 w-1.5 rounded-full bg-emerald-400"
                        : u.status === "club"
                          ? "h-1.5 w-1.5 rounded-full bg-sky-400"
                          : u.status === "date"
                            ? "h-1.5 w-1.5 rounded-full bg-pink-400"
                            : "h-1.5 w-1.5 rounded-full bg-zinc-400"
                    }
                  />
                  <span>
                    {u.status === "music"
                      ? "ב-Music"
                      : u.status === "club"
                        ? "ב-Club"
                        : u.status === "date"
                          ? "ב-Date"
                          : "אונליין"}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
