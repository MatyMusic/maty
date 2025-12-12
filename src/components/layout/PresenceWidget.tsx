// src/components/layout/PresenceWidget.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** ← הרחבתי סוג קיים, נשאר backward-compatible */
type Nearby = {
  id: string;
  name?: string; // שם להצגה (אם אין nickname)
  nickname?: string; // כינוי בטוח (מועדף)
  city?: string;
  dist?: number; // בק״מ (כמו שהיה אצלך)
  here?: boolean; // בדף/חדר הנוכחי (אופציונלי)
  avatarUrl?: string; // חדש: אווטאר
};

type Features = {
  presence?: {
    enabled: boolean;
    requiredTier?: "free" | "plus" | "pro" | "vip";
  };
};

export default function PresenceWidget() {
  // --- State ---
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [nearby, setNearby] = useState<Nearby[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Helpers ---
  const humanDist = (km?: number) => {
    if (km == null || isNaN(km)) return null;
    const m = km * 1000;
    if (m < 1000) return `${Math.round(m)} מ׳`;
    return `${km < 3 ? km.toFixed(1) : Math.round(km)} ק״מ`;
  };

  const publicName = (u: Nearby) => {
    const base = (u.nickname || u.name || "").trim();
    if (base) return base.split(" ")[0];
    const suffix = (u.id || "XXXX").slice(-4).toUpperCase();
    return `אורח #${suffix}`;
  };

  // --- 1) דגל פיצ׳ר ---
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/features", { cache: "no-store" });
        const j: { ok: boolean; presence?: Features["presence"] } = await r
          .json()
          .catch(() => ({ ok: false }));
        if (alive) setEnabled(!!j?.presence?.enabled);
      } catch {
        if (alive) setEnabled(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // --- 2) מיקום (שומר בבקשה אחת לסשן כדי לא להציק) ---
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined" || !navigator.geolocation) return;

    const cached = sessionStorage.getItem("mm:geo");
    if (cached) {
      try {
        const { lat, lon } = JSON.parse(cached) || {};
        if (typeof lat === "number" && typeof lon === "number") {
          setCoords({ lat, lon });
          return;
        }
      } catch {}
    }

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const val = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCoords(val);
        try {
          sessionStorage.setItem("mm:geo", JSON.stringify(val));
        } catch {}
      },
      () => {
        if (!cancelled) setCoords(null);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 5000 },
    );
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // --- 3) קריאות רשת ---
  const ping = useCallback(
    async (signal?: AbortSignal) => {
      if (!enabled) return;
      try {
        await fetch("/api/online", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ coords }),
          signal,
        });
      } catch {}
    },
    [enabled, coords],
  );

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (!enabled) return;
      try {
        const url = new URL(
          "/api/online",
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost",
        );
        if (coords) {
          url.searchParams.set("lat", String(coords.lat));
          url.searchParams.set("lng", String(coords.lon));
        }
        const r = await fetch(url.toString(), { cache: "no-store", signal });
        if (!r.ok) return;
        const data = await r.json().catch(() => ({}));
        setCount(Number(data?.count || 0));
        const list = Array.isArray(data?.nearby)
          ? data.nearby.slice(0, 12)
          : [];
        setNearby(list);
      } catch {}
    },
    [enabled, coords],
  );

  // --- 4) אינטרוול נקי עם AbortController ---
  useEffect(() => {
    if (!enabled) return;
    const ac = new AbortController();
    ping(ac.signal);
    refresh(ac.signal);

    timer.current = setInterval(() => {
      const tick = new AbortController();
      ping(tick.signal);
      refresh(tick.signal);
      setTimeout(() => tick.abort(), 5000);
    }, 30_000);

    return () => {
      ac.abort();
      if (timer.current) clearInterval(timer.current);
    };
  }, [enabled, ping, refresh]);

  // --- UI ---
  if (!enabled) return null;

  const chip =
    "inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/15 " +
    "bg-white/90 dark:bg-neutral-900/80 backdrop-blur px-3 py-1.5 text-sm " +
    "hover:bg-white/100 dark:hover:bg-neutral-900/95 transition";

  return (
    <div className="relative">
      {/* כפתור סטטוס + מפתחות */}
      <button
        type="button"
        className={chip}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-1">
          <span className="relative inline-block w-2 h-2 rounded-full bg-emerald-500">
            <span
              className="absolute -inset-1.5 rounded-full animate-ping bg-emerald-400/50"
              aria-hidden
            />
          </span>
          יש כרגע <b className="px-1 tabular-nums">{count}</b> באתר · מי סביבי
        </span>
      </button>

      {/* רשימת קרובים – עם אווטאר/כינוי/מרחק */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-80 max-h-[60vh] overflow-y-auto rounded-2xl shadow-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 backdrop-blur p-3 z-[3000]"
          role="dialog"
          aria-label="מי סביבי"
          dir="rtl"
        >
          <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-2">
            משתמשים קרובים · מתעדכן כל חצי דקה
          </div>

          {nearby.length === 0 ? (
            <div className="text-sm opacity-70">
              לא נמצאו משתמשים קרובים עדיין.
            </div>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {nearby.map((u) => {
                const nm = publicName(u);
                const dist = humanDist(u.dist);
                return (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-2"
                    title={[
                      nm,
                      u.city ? ` · ${u.city}` : "",
                      dist ? ` · ${dist}` : "",
                    ].join("")}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* אווטאר */}
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover border border-black/10 dark:border-white/10"
                          onError={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none";
                          }}
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 inline-block"
                        />
                      )}
                      {/* שם/כינוי + עיר */}
                      <div className="truncate">
                        <span className="font-medium">{nm}</span>
                        {u.city ? (
                          <span className="opacity-60"> · {u.city}</span>
                        ) : null}
                        {u.here && (
                          <span className="ml-2 text-[10px] px-1.5 rounded-full border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10">
                            כאן
                          </span>
                        )}
                      </div>
                    </div>
                    {/* מרחק */}
                    {dist && (
                      <span className="text-xs tabular-nums opacity-70">
                        {dist}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
