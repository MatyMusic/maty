// src/app/fit/partners/page.tsx
"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// ===== react-leaflet (ללא SSR) =====
const RL = {
  MapContainer: dynamic(
    () => import("react-leaflet").then((m) => m.MapContainer),
    { ssr: false },
  ),
  TileLayer: dynamic(() => import("react-leaflet").then((m) => m.TileLayer), {
    ssr: false,
  }),
  Marker: dynamic(() => import("react-leaflet").then((m) => m.Marker), {
    ssr: false,
  }),
  Popup: dynamic(() => import("react-leaflet").then((m) => m.Popup), {
    ssr: false,
  }),
  Circle: dynamic(() => import("react-leaflet").then((m) => m.Circle), {
    ssr: false,
  }),
};

let leafletReady = false;

// ===== Types =====
type Partner = {
  _id?: string;
  userId: string;
  displayName: string | null;
  sports: string[];
  level: "beginner" | "intermediate" | "advanced" | null;
  gym: string | null;
  available: boolean;
  avatarUrl: string | null;
  distKm: number | null;
  city?: string | null;

  // חדש: נקודות GPS לפרטנר (אם ה-API שלך מחזיר)
  lat?: number | null;
  lng?: number | null;

  // אופציונלי: עדכון אחרון לצורך sort=updated
  updatedAt?: string | null;
};

const SPORTS = [
  "running",
  "walking",
  "gym",
  "yoga",
  "pilates",
  "hiit",
  "cycling",
  "crossfit",
  "swimming",
  "football",
  "basketball",
] as const;
type SportKey = (typeof SPORTS)[number];

const SPORT_LABEL: Record<SportKey, string> = {
  running: "ריצה",
  walking: "הליכה",
  gym: "חדר כושר",
  yoga: "יוגה",
  pilates: "פילאטיס",
  hiit: "HIIT",
  cycling: "רכיבה",
  crossfit: "קרוספיט",
  swimming: "שחייה",
  football: "כדורגל",
  basketball: "כדורסל",
};

const LEVELS = ["beginner", "intermediate", "advanced"] as const;
type LevelKey = (typeof LEVELS)[number];
const LEVEL_LABEL: Record<LevelKey, string> = {
  beginner: "מתחיל/ה",
  intermediate: "בינוני/ת",
  advanced: "מתקדם/ת",
};

const LS_KEY = "fit:lastCoords";
const DEBOUNCE_MS = 350;

function useDebounced<T>(value: T, delay = DEBOUNCE_MS) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

type ViewMode = "cards" | "map" | "split";
type SortBy = "distance" | "updated";

// ====== Leaflet icon patch (ברירת-מחדל, עובד ב-Next) ======
function ensureLeafletIconPatched() {
  if (typeof window === "undefined") return;
  try {
    const L = (window as any).L;
    if (!L || leafletReady) return;
    const iconRetinaUrl =
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
    const iconUrl =
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
    const shadowUrl =
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";
    L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
    leafletReady = true;
  } catch {
    // no-op
  }
}

// ====== Component ======
export default function FitPartnersPage() {
  const [items, setItems] = React.useState<Partner[]>([]);
  const [status, setStatus] = React.useState<
    "idle" | "locating" | "loading" | "loaded" | "error"
  >("idle");
  const [err, setErr] = React.useState<string>("");

  // סינון ותצוגה
  const [q, setQ] = React.useState("");
  const [selectedSports, setSelectedSports] = React.useState<string[]>([]);
  const [level, setLevel] = React.useState<string>("");
  const [available, setAvailable] = React.useState(true);
  const [km, setKm] = React.useState(15);
  const [limit, setLimit] = React.useState(40);
  const [sortBy, setSortBy] = React.useState<SortBy>("distance");
  const [view, setView] = React.useState<ViewMode>("split");

  // מיקום
  const [coords, setCoords] = React.useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manualLat, setManualLat] = React.useState<string>("");
  const [manualLng, setManualLng] = React.useState<string>("");

  // דיבאונס לטקסט
  const qDebounced = useDebounced(q);

  // Patch ל-Leaflet icon ברגע שהדפדפן נטען
  React.useEffect(() => {
    ensureLeafletIconPatched();
  }, []);

  // state -> URL
  React.useEffect(() => {
    const usp = new URLSearchParams();
    if (q.trim()) usp.set("q", q.trim());
    if (selectedSports.length === 1) usp.set("sport", selectedSports[0]);
    if (selectedSports.length > 1)
      usp.set("sports_any", selectedSports.join(","));
    if (level) usp.set("level", level);
    if (!available) usp.set("available", "0");
    usp.set("km", String(km));
    usp.set("limit", String(limit));
    usp.set("sort", sortBy);
    usp.set("view", view);
    const url = `${window.location.pathname}?${usp.toString()}`;
    window.history.replaceState(null, "", url);
  }, [q, selectedSports, level, available, km, limit, sortBy, view]);

  // טעינה ראשונית מה-URL + מיקום
  React.useEffect(() => {
    const usp = new URLSearchParams(window.location.search);
    const q0 = usp.get("q") ?? "";
    const lv0 = usp.get("level") ?? "";
    const av0 = usp.get("available") !== "0";
    const km0 = Number(usp.get("km") || "15");
    const lim0 = Number(usp.get("limit") || "40");
    const s0 = usp.get("sort") as SortBy | null;
    const v0 = usp.get("view") as ViewMode | null;
    const sport0 = usp.get("sport");
    const sportsAny0 = usp.get("sports_any");

    if (q0) setQ(q0);
    if (lv0) setLevel(lv0);
    setAvailable(av0);
    if (Number.isFinite(km0)) setKm(Math.max(2, Math.min(50, km0)));
    if (Number.isFinite(lim0)) setLimit(Math.max(10, Math.min(80, lim0)));
    if (s0 === "updated" || s0 === "distance") setSortBy(s0);
    if (v0 === "cards" || v0 === "map" || v0 === "split") setView(v0);

    if (sportsAny0) {
      setSelectedSports(
        sportsAny0
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );
    } else if (sport0) {
      setSelectedSports([sport0]);
    }

    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const { lat, lng } = JSON.parse(saved);
        if (typeof lat === "number" && typeof lng === "number") {
          setCoords({ lat, lng });
        }
      }
    } catch {}

    if (!coords) locate(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch
  async function fetchAround(lat: number, lng: number, signal?: AbortSignal) {
    setStatus("loading");
    setErr("");
    const u = new URL("/api/fit/partners", window.location.origin);
    u.searchParams.set("lat", String(lat));
    u.searchParams.set("lng", String(lng));
    u.searchParams.set("km", String(km));
    u.searchParams.set("limit", String(limit));
    if (available) u.searchParams.set("available", "1");
    if (qDebounced.trim()) u.searchParams.set("q", qDebounced.trim());
    if (selectedSports.length === 1) {
      u.searchParams.set("sport", selectedSports[0]);
    } else if (selectedSports.length > 1) {
      u.searchParams.set("sports_any", selectedSports.join(","));
    }
    if (level) u.searchParams.set("level", level);
    if (sortBy) u.searchParams.set("sort", sortBy);

    const res = await fetch(u.toString(), { cache: "no-store", signal });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j?.ok) throw new Error(j?.error || "failed");

    let list: Partner[] = Array.isArray(j.items) ? j.items : [];

    // מיון לקוח (ליתר ביטחון)
    if (sortBy === "distance") {
      list = [...list].sort((a, b) => (a.distKm ?? 1e9) - (b.distKm ?? 1e9));
    } else if (sortBy === "updated") {
      list = [...list].sort(
        (a, b) =>
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime(),
      );
    }

    setItems(list);
    setStatus("loaded");
  }

  // Geolocation
  function locate(silent = false) {
    if (!silent) setStatus("locating");
    setErr("");
    if (!("geolocation" in navigator)) {
      if (!silent) {
        setErr("הדפדפן לא תומך במיקום. אפשר להזין ידנית.");
        setStatus("error");
        setManualOpen(true);
      }
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const c = { lat: latitude, lng: longitude };
        setCoords(c);
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(c));
        } catch {}
      },
      (e) => {
        if (!silent) {
          setErr(e?.message || "כשל בקבלת מיקום. אפשר להזין ידנית.");
          setStatus("error");
          setManualOpen(true);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }

  // טריגר fetch
  React.useEffect(() => {
    if (!coords) return;
    const ac = new AbortController();
    fetchAround(coords.lat, coords.lng, ac.signal).catch((e) => {
      if (ac.signal.aborted) return;
      setErr(String(e?.message || e));
      setStatus("error");
    });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    coords,
    qDebounced,
    selectedSports.join(","),
    level,
    available,
    km,
    limit,
    sortBy,
  ]);

  // UI actions
  function toggleSport(s: string) {
    setSelectedSports((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }
  function resetAll() {
    setQ("");
    setSelectedSports([]);
    setLevel("");
    setAvailable(true);
    setKm(15);
    setLimit(40);
    setSortBy("distance");
  }
  function useManualLocation() {
    const lat = Number(manualLat);
    const lng = Number(manualLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setErr("בדוק/י שקואורדינטות חוקיות.");
      setStatus("error");
      return;
    }
    const c = { lat, lng };
    setCoords(c);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(c));
    } catch {}
    setManualOpen(false);
  }

  const count = items.length;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8" dir="rtl">
      {/* Hero קטן */}
      <header className="mb-5">
        <div className="rounded-3xl border bg-gradient-to-br from-amber-50 to-pink-50 dark:from-amber-500/10 dark:to-pink-500/10 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                מי סביבי — שותפי אימון לידך
              </h1>
              <p className="text-sm opacity-80">
                סננו לפי אזור/מכון, סוג אימון, רמה וזמינות. תצוגה לפי מרחק או
                לפי עדכונים.
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="inline-flex items-center rounded-xl border px-3 py-1.5 text-sm bg-black text-white dark:bg-white dark:text-black">
                {status === "loading" ? "טוען…" : `${count} תוצאות`}
              </span>
              <button
                onClick={() => locate()}
                className="inline-flex items-center rounded-xl border px-3 py-1.5 text-sm hover:bg-amber-50 dark:hover:bg-white/10"
              >
                אתר מיקום
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* סרגל סינון דביק */}
      <section className="sticky top-0 z-10 backdrop-blur bg-white/70 dark:bg-black/40 border rounded-2xl p-4 mb-6">
        <div className="grid gap-2 md:grid-cols-12">
          {/* אזור/מכון */}
          <div className="md:col-span-3">
            <label className="text-xs opacity-70">אזור / חדר כושר</label>
            <input
              className="mt-1 w-full h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="לדוגמה: נתניה / GoActive / פארק הירקון"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="חיפוש טקסט חופשי"
            />
          </div>

          {/* סוגי אימון */}
          <div className="md:col-span-5">
            <label className="text-xs opacity-70">סוגי אימון</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {SPORTS.map((s) => {
                const active = selectedSports.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSport(s)}
                    className={[
                      "h-9 px-3 rounded-full border text-sm transition",
                      active
                        ? "bg-amber-600 border-amber-600 text-white"
                        : "bg-white/90 dark:bg-neutral-900 hover:bg-black/5 dark:hover:bg-white/10",
                    ].join(" ")}
                    aria-pressed={active}
                    title={SPORT_LABEL[s as SportKey]}
                  >
                    {SPORT_LABEL[s as SportKey]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* רמה */}
          <div className="md:col-span-2">
            <label className="text-xs opacity-70">רמה</label>
            <select
              className="mt-1 w-full h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900 focus:outline-none"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              aria-label="סינון לפי רמה"
            >
              <option value="">הכול</option>
              {LEVELS.map((lv) => (
                <option key={lv} value={lv}>
                  {LEVEL_LABEL[lv]}
                </option>
              ))}
            </select>
          </div>

          {/* מרחק */}
          <div className="md:col-span-1">
            <label className="text-xs opacity-70">מרחק (ק״מ): {km}</label>
            <input
              type="range"
              min={2}
              max={50}
              step={1}
              value={km}
              onChange={(e) => setKm(Number(e.target.value))}
              className="mt-2 w-full"
              aria-label="טווח מרחק"
            />
          </div>

          {/* כמות */}
          <div className="md:col-span-1">
            <label className="text-xs opacity-70">כמות</label>
            <select
              className="mt-1 w-full h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900 focus:outline-none"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              aria-label="מספר פריטים לתצוגה"
            >
              {[20, 40, 60, 80].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* מיון + מצב תצוגה */}
          <div className="md:col-span-12 flex flex-wrap items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <span className="text-xs opacity-70">מיון:</span>
              <select
                className="h-9 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900 focus:outline-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
              >
                <option value="distance">מרחק</option>
                <option value="updated">עדכונים</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                className={[
                  "h-9 px-3 rounded-xl border text-sm",
                  view === "cards"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-black/5 dark:hover:bg-white/10",
                ].join(" ")}
                onClick={() => setView("cards")}
                aria-pressed={view === "cards"}
              >
                כרטיסים
              </button>
              <button
                className={[
                  "h-9 px-3 rounded-xl border text-sm",
                  view === "map"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-black/5 dark:hover:bg-white/10",
                ].join(" ")}
                onClick={() => setView("map")}
                aria-pressed={view === "map"}
              >
                מפה
              </button>
              <button
                className={[
                  "h-9 px-3 rounded-xl border text-sm",
                  view === "split"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-black/5 dark:hover:bg-white/10",
                ].join(" ")}
                onClick={() => setView("split")}
                aria-pressed={view === "split"}
              >
                מפוצל
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() =>
                  coords ? fetchAround(coords.lat, coords.lng) : locate()
                }
                className="h-9 px-3 rounded-xl border text-sm bg-amber-600 text-white hover:bg-amber-700"
              >
                החל סינון
              </button>
              <button
                onClick={resetAll}
                className="h-9 px-3 rounded-xl border text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                איפוס
              </button>
              <button
                onClick={() => setManualOpen((v) => !v)}
                className="h-9 px-3 rounded-xl border text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                מיקום ידני
              </button>
            </div>
          </div>
        </div>

        {status === "locating" && (
          <p className="text-sm opacity-80 mt-2">מאחזר מיקום…</p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600 mt-2">{err}</p>
        )}

        {/* קואורדינטות ידניות */}
        {manualOpen && (
          <div className="mt-3 rounded-xl border p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white/60 dark:bg-white/5">
            <div>
              <label className="text-xs opacity-70">Latitude</label>
              <input
                className="mt-1 w-full h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900 focus:outline-none input-ltr"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="31.78"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="text-xs opacity-70">Longitude</label>
              <input
                className="mt-1 w-full h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900 focus:outline-none input-ltr"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="35.22"
                inputMode="decimal"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={useManualLocation}
                className="h-10 px-3 rounded-xl border text-sm bg-amber-600 text-white hover:bg-amber-700"
              >
                השתמש
              </button>
              <button
                onClick={() => setManualOpen(false)}
                className="h-10 px-3 rounded-xl border text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                סגור
              </button>
            </div>
          </div>
        )}
      </section>

      {/* תצוגה: מפה/כרטיסים/מפוצל */}
      {view === "map" && (
        <div className="rounded-2xl border overflow-hidden">
          <MapView items={items} coords={coords} km={km} />
        </div>
      )}

      {view === "cards" && <CardsList items={items} status={status} />}

      {view === "split" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border overflow-hidden h-[420px] lg:h-[600px]">
            <MapView items={items} coords={coords} km={km} />
          </div>
          <div>
            <CardsList items={items} status={status} />
          </div>
        </div>
      )}

      {!items.length && status === "loaded" && (
        <p className="opacity-70 mt-4">
          לא נמצאו שותפי אימון בהתאם למסננים. נסו להרחיב את המרחק או להסיר
          פילטרים.
        </p>
      )}
    </main>
  );
}

/* ================= SUBS ================= */
function CardsList({ items, status }: { items: Partner[]; status: string }) {
  if (status === "loading") {
    return (
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="h-[140px] rounded-2xl border bg-white/60 dark:bg-white/5 animate-pulse"
          />
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p, idx) => (
        <li key={p._id ?? `${p.userId}-${idx}`}>
          {/* קישור לפרופיל (אם יש לך דף /fit/partners/[id]) */}
          <a
            id={p._id ?? p.userId}
            href={`/fit/partners/${p.userId}`}
            className="block"
          >
            <PartnerCardSmart partner={p} />
          </a>
        </li>
      ))}
    </ul>
  );
}

function MapView({
  items,
  coords,
  km,
}: {
  items: Partner[];
  coords: { lat: number; lng: number } | null;
  km: number;
}) {
  const [leafletError, setLeafletError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      ensureLeafletIconPatched();
    } catch (e: any) {
      setLeafletError(String(e?.message || e));
    }
  }, []);

  if (leafletError) {
    return (
      <div className="p-6 text-sm">
        שגיאת Leaflet: {leafletError}
        <br />
        ודא שהתקנת: <code className="px-1">react-leaflet</code>,{" "}
        <code className="px-1">leaflet</code>
      </div>
    );
  }

  const center: [number, number] = coords
    ? [coords.lat, coords.lng]
    : [31.778, 35.235];

  return (
    <div className="h-[380px] lg:h-full">
      <RL.MapContainer
        center={center}
        zoom={coords ? zoomByKm(km) : 9}
        scrollWheelZoom
        className="h-full w-full"
      >
        <RL.TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* מיקום משתמש */}
        {coords && (
          <>
            <RL.Marker position={[coords.lat, coords.lng]}>
              <RL.Popup>
                <div className="rtl text-right">
                  <div className="font-semibold">את/ה כאן</div>
                  <div className="text-xs opacity-70">
                    רדיוס חיפוש: {km} ק״מ
                  </div>
                </div>
              </RL.Popup>
            </RL.Marker>
            <RL.Circle
              center={[coords.lat, coords.lng]}
              radius={km * 1000}
              pathOptions={{ color: "#f59e0b", opacity: 0.45 }}
            />
          </>
        )}

        {/* שותפים */}
        {items.map((p, i) => {
          const hint = geoHintFromCard(p);
          if (!hint) return null;
          return (
            <RL.Marker
              key={p._id ?? `${p.userId}-${i}`}
              position={[hint.lat, hint.lng]}
            >
              <RL.Popup>
                <div className="rtl text-right min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.avatarUrl || "/assets/images/avatar-soft.png"}
                      alt={p.displayName ?? "Partner"}
                      className="h-9 w-9 rounded-full object-cover border"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "/assets/images/avatar-soft.png";
                      }}
                    />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        {p.displayName ?? "שותף/ה לאימון"}
                      </div>
                      <div className="text-xs opacity-70">
                        {p.city ?? p.gym ?? "לידך"}
                        {typeof p.distKm === "number"
                          ? ` • ${p.distKm.toFixed(1)} ק״מ`
                          : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs opacity-80 mb-2">
                    {(p.sports || [])
                      .slice(0, 3)
                      .map(
                        (k) => SPORT_LABEL[(k as SportKey) || "running"] || k,
                      )
                      .join(" • ") || "כללי"}
                    {p.level
                      ? ` • ${LEVEL_LABEL[(p.level as LevelKey) || "beginner"]}`
                      : ""}
                  </div>
                  <a
                    href={`/fit/partners/${p.userId}`}
                    className="inline-flex items-center rounded-xl border px-3 py-1.5 text-xs hover:bg-amber-50 dark:hover:bg-white/10"
                  >
                    פרטים
                  </a>
                </div>
              </RL.Popup>
            </RL.Marker>
          );
        })}
      </RL.MapContainer>
    </div>
  );
}

// ===== Helpers =====
function zoomByKm(km: number) {
  if (km <= 3) return 13;
  if (km <= 6) return 12;
  if (km <= 12) return 11;
  if (km <= 20) return 10;
  if (km <= 35) return 9;
  return 8;
}

function geoHintFromCard(p: Partner): { lat: number; lng: number } | null {
  if (typeof p.lat === "number" && typeof p.lng === "number") {
    return { lat: p.lat, lng: p.lng };
  }
  // אין נ״צ — אל תציג מרקר
  return null;
}

/* ====== כרטיס חכם: מרשים + פעולות ====== */
function PartnerCardSmart({ partner }: { partner: Partner }) {
  const p = partner;
  const isOnline = Boolean(p.available);
  const sportsText = p.sports?.length
    ? p.sports
        .map((s) => SPORT_LABEL[(s as SportKey) || "running"] || s)
        .join(" • ")
    : "ספורט: לא צוין";
  const levelText = p.level
    ? LEVEL_LABEL[(p.level as LevelKey) || "beginner"]
    : null;

  return (
    <article className="rounded-2xl border bg-white/70 dark:bg-neutral-900/50 backdrop-blur p-4 hover:shadow-md transition">
      <div className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.avatarUrl || "/assets/images/avatar-soft.png"}
          alt={p.displayName || p.userId}
          className="w-16 h-16 rounded-2xl object-cover border"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/assets/images/avatar-soft.png";
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">
              {p.displayName || p.userId}
            </h3>
            <span
              className={[
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                isOnline
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-neutral-100 dark:bg-neutral-800",
              ].join(" ")}
              title={isOnline ? "זמין/ה" : "לא זמין/ה כרגע"}
            >
              <span
                className={[
                  "inline-block h-1.5 w-1.5 rounded-full",
                  isOnline ? "bg-emerald-500" : "bg-neutral-400",
                ].join(" ")}
              />
              {isOnline ? "זמין/ה" : "לא זמין/ה"}
            </span>
          </div>

          <div className="text-xs opacity-80 mt-1 truncate">
            {sportsText} {levelText ? ` • רמה: ${levelText}` : ""}
          </div>
          <div className="text-xs opacity-80 mt-1">
            {p.city || p.gym ? `אזור: ${p.city ?? p.gym}` : "אזור: —"}
            {p.distKm != null ? ` • ${p.distKm.toFixed(1)} ק״מ ממך` : ""}
          </div>

          {/* פעולות */}
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`/fit/partners/${p.userId}`}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black"
              onClick={(e) => e.stopPropagation()}
            >
              פרופיל
            </a>
            <a
              href={`/fit/chat?to=${encodeURIComponent(p.userId)}`}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-amber-50 dark:hover:bg-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              הודעה
            </a>
            <a
              href={`/fit/schedule?with=${encodeURIComponent(p.userId)}`}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-amber-50 dark:hover:bg-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              קבע אימון
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
