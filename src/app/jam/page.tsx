// src/app/jam/page.tsx
"use client";

import GroupCard from "@/components/music-groups/GroupCard";
import GroupFilters from "@/components/music-groups/GroupFilters";
import {
  ChevronDown,
  ChevronUp,
  Headphones,
  Music2,
  Play,
  Share2,
  Square,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

/* ============================= Types ============================= */

type JamVisibility = "public" | "private" | "unlisted";

export type JamGroupClient = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  city?: string;
  country?: string;

  genres?: string[];
  daws?: string[];
  purposes?: string[];
  skillsWanted?: string[];

  ownerId: string;
  adminIds?: string[];

  memberCount?: number;
  isOpen?: boolean;
  visibility?: JamVisibility;

  tags?: string[];

  createdAt: string;
  updatedAt: string;

  lat?: number;
  lng?: number;
  [key: string]: any;
};

type FiltersState = {
  q: string;
  city: string;
  daws: string[];
  purposes: string[];
  skills: string[];
  radiusKm: number;
  lng?: number;
  lat?: number;
};

/* ========================= Quick presets ========================= */

const QUICK_DAWS = ["Ableton Live", "Cubase", "Logic Pro", "FL Studio"];
const QUICK_PURPOSES = [
  "ג׳אם פתוח",
  "חזרות להופעה",
  "הפקה וכתיבה",
  "למידה/סדנאות",
];
const QUICK_SKILLS = ["מתחיל", "ביניים", "מתקדם", "פרו"];

/* ====================== Leaflet Helpers (client) ====================== */

function ensureLeafletCss() {
  if (typeof document === "undefined") return;
  const id = "leaflet-css-cdn";
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
  link.crossOrigin = "";
  document.head.appendChild(link);
}

async function makeDefaultIcon(L: any) {
  const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
  const iconRetinaUrl =
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
  const shadowUrl =
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

  const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
    popupAnchor: [1, -34],
  });
  L.Marker.prototype.options.icon = DefaultIcon;
  return DefaultIcon;
}

/* =========================== Utils =========================== */

function shareToWhatsApp(text: string) {
  if (typeof window === "undefined") return;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

function useDisclosure(initial = false) {
  const [open, setOpen] = React.useState(initial);
  const onOpen = React.useCallback(() => setOpen(true), []);
  const onClose = React.useCallback(() => setOpen(false), []);
  return { open, onOpen, onClose, setOpen };
}

/* =========================== Dialog – Create Group =========================== */

function CreateGroupDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (created?: JamGroupClient | null) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [city, setCity] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [daws, setDaws] = React.useState<string[]>([]);
  const [purposes, setPurposes] = React.useState<string[]>([]);
  const [skills, setSkills] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/jam/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          city,
          description: desc,
          daws,
          purposes,
          skillsWanted: skills,
          visibility: "public" as JamVisibility,
          isOpen: true,
        }),
      });
      const j = await r.json().catch(() => null);
      if (!j?.ok) throw new Error(j?.message || j?.error || "שמירה נכשלה");
      setOk(true);
      onCreated(j.item as JamGroupClient | null);
    } catch (e: any) {
      setError(e?.message || "קרתה תקלה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={[
        "fixed inset-0 z-[300] transition",
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none",
      ].join(" ")}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        dir="rtl"
        className="absolute inset-x-3 sm:inset-x-auto sm:right-6 top-[8vh] w-[min(720px,92vw)] rounded-2xl border border-emerald-500/40 bg-slate-950 shadow-[0_18px_90px_rgba(16,185,129,.45)] p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="text-lg font-bold text-emerald-100 flex items-center gap-2">
            <Music2 className="w-5 h-5 text-emerald-400" />+ פתיחת קבוצת JAM
            חדשה
          </div>
          <div className="ml-auto" />
          <button
            onClick={onClose}
            className="rounded-full px-3 h-9 border border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {ok ? (
          <div className="text-sm p-3 rounded-xl border border-emerald-400/40 bg-emerald-900/20 text-emerald-100">
            הקבוצה נוצרה בהצלחה 🎉 – תוכל לשתף אותה מהמסך הראשי ולהזמין את
            החבר&apos;ה.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm text-slate-200">
                שם הקבוצה
                <input
                  className="mt-1 w-full h-10 rounded-xl border border-slate-700 px-3 bg-slate-900/80 text-slate-50"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="לדוגמה: JAM חתונות חב״ד / JAM מזרחי לוד"
                />
              </label>
              <label className="text-sm text-slate-200">
                עיר
                <input
                  className="mt-1 w-full h-10 rounded-xl border border-slate-700 px-3 bg-slate-900/80 text-slate-50"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="ת״א / לוד / ירושלים…"
                />
              </label>
            </div>

            <label className="text-sm block mt-3 text-slate-200">
              תיאור
              <textarea
                className="mt-1 w-full min-h-[96px] rounded-xl border border-slate-700 px-3 py-2 bg-slate-900/80 text-slate-50"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="קצת על האווירה, סגנון, זמנים, ציוד, מי אתם מחפשים…"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <fieldset className="text-sm text-slate-200">
                <div className="font-semibold mb-1 text-slate-100">DAW</div>
                <div className="flex flex-wrap gap-1">
                  {QUICK_DAWS.map((d) => {
                    const active = daws.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          setDaws((v) =>
                            active ? v.filter((x) => x !== d) : [...v, d],
                          )
                        }
                        className={[
                          "px-2.5 py-1 rounded-full border text-xs",
                          active
                            ? "bg-emerald-500 text-black border-emerald-400"
                            : "bg-slate-900 border-slate-700 text-slate-100",
                        ].join(" ")}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <fieldset className="text-sm text-slate-200">
                <div className="font-semibold mb-1 text-slate-100">מטרות</div>
                <div className="flex flex-wrap gap-1">
                  {QUICK_PURPOSES.map((p) => {
                    const active = purposes.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setPurposes((v) =>
                            active ? v.filter((x) => x !== p) : [...v, p],
                          )
                        }
                        className={[
                          "px-2.5 py-1 rounded-full border text-xs",
                          active
                            ? "bg-emerald-500 text-black border-emerald-400"
                            : "bg-slate-900 border-slate-700 text-slate-100",
                        ].join(" ")}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <fieldset className="text-sm text-slate-200">
                <div className="font-semibold mb-1 text-slate-100">רמה</div>
                <div className="flex flex-wrap gap-1">
                  {QUICK_SKILLS.map((s) => {
                    const active = skills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setSkills((v) =>
                            active ? v.filter((x) => x !== s) : [...v, s],
                          )
                        }
                        className={[
                          "px-2.5 py-1 rounded-full border text-xs",
                          active
                            ? "bg-emerald-500 text-black border-emerald-400"
                            : "bg-slate-900 border-slate-700 text-slate-100",
                        ].join(" ")}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            {error && <div className="text-sm mt-3 text-red-400">{error}</div>}

            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500">
                הקבוצה מחוברת לחשבון שלך במערכת (אותו משתמש כמו MATY-DATE /
                CLUB).
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 h-10 rounded-full border border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  בטל
                </button>
                <button
                  onClick={submit}
                  disabled={busy || !title.trim()}
                  className="px-5 h-10 rounded-full bg-emerald-500 text-black font-semibold shadow-lg disabled:opacity-60"
                >
                  {busy ? "שומר…" : "צור קבוצה"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================ Map Block ============================ */

function useLeaflet() {
  const [L, setL] = React.useState<any | null>(null);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      ensureLeafletCss();
      const mod = await import("leaflet");
      if (!mounted) return;
      await makeDefaultIcon(mod);
      setL(mod);
    })();
    return () => {
      mounted = false;
    };
  }, []);
  return L;
}

type MapPin = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  city?: string;
};

function boundsFromPoints(L: any, pts: Array<[number, number]>) {
  if (!L || !pts.length) return null;
  return L.latLngBounds(pts.map(([lat, lng]) => L.latLng(lat, lng)));
}

function MapView({
  items,
  userPos,
  radiusKm,
  onOpenGroup,
}: {
  items: MapPin[];
  userPos?: { lat: number; lng: number } | null;
  radiusKm: number;
  onOpenGroup: (id: string) => void;
}) {
  const L = useLeaflet();
  const mapDiv = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<any | null>(null);
  const markersLayer = React.useRef<any | null>(null);
  const userLayer = React.useRef<any | null>(null);

  React.useEffect(() => {
    if (!L || !mapDiv.current || mapRef.current) return;
    const m = L.map(mapDiv.current, {
      center: [31.778, 35.235],
      zoom: 8,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(m);

    markersLayer.current = L.layerGroup().addTo(m);
    userLayer.current = L.layerGroup().addTo(m);
    mapRef.current = m;
  }, [L]);

  React.useEffect(() => {
    if (!L || !mapRef.current || !userLayer.current) return;
    const UL = userLayer.current as any;
    UL.clearLayers();
    if (userPos?.lat && userPos?.lng) {
      const marker = L.marker([userPos.lat, userPos.lng], {
        title: "את/ה כאן",
      });
      marker.addTo(UL);
      if (radiusKm > 0) {
        const circle = L.circle([userPos.lat, userPos.lng], {
          radius: radiusKm * 1000,
          color: "#22c55e",
          weight: 2,
          fillColor: "#22c55e",
          fillOpacity: 0.08,
        });
        circle.addTo(UL);
      }
    }
  }, [L, userPos?.lat, userPos?.lng, radiusKm]);

  React.useEffect(() => {
    if (!L || !mapRef.current || !markersLayer.current) return;
    const GL = markersLayer.current as any;
    GL.clearLayers();

    items.forEach((g) => {
      if (typeof g.lat !== "number" || typeof g.lng !== "number") return;
      const mk = L.marker([g.lat, g.lng], { title: g.title });
      const html = `
        <div dir="rtl" class="text-right">
          <div class="font-semibold">${g.title}</div>
          ${g.city ? `<div class="text-xs opacity-70">${g.city}</div>` : ""}
          <div class="mt-2">
            <button data-jam-id="${g.id}" class="mm-jam-open btn">פרטי קבוצה</button>
          </div>
        </div>
      `;
      mk.bindPopup(html);
      mk.addTo(GL);
      mk.on("popupopen", () => {
        const el = document.querySelector(
          '.mm-jam-open[data-jam-id="' + g.id + '"]',
        ) as HTMLButtonElement | null;

        if (el) {
          el.onclick = () => onOpenGroup(g.id);
        }
      });
    });

    const pts: Array<[number, number]> = [];
    items.forEach((g) => {
      if (typeof g.lat === "number" && typeof g.lng === "number") {
        pts.push([g.lat, g.lng]);
      }
    });
    if (userPos?.lat && userPos?.lng) pts.push([userPos.lat, userPos.lng]);

    if (pts.length) {
      const b = boundsFromPoints(L, pts);
      if (b) {
        mapRef.current.fitBounds(b, { padding: [32, 32], maxZoom: 15 });
      }
    }
  }, [L, items, userPos?.lat, userPos?.lng, onOpenGroup]);

  return (
    <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/90">
      <div className="p-3 flex items-center justify-between border-b border-slate-800">
        <div className="font-semibold text-slate-100 flex items-center gap-2">
          <Headphones className="w-4 h-4 text-emerald-400" />
          מפה חיה של קבוצות JAM
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>רדיוס: {radiusKm} ק״מ</span>
        </div>
      </div>
      <div
        ref={mapDiv}
        className="h-[320px] sm:h-[380px] w-full bg-slate-900"
      />
      <div className="p-3 text-[11px] text-slate-500 text-right">
        מפה: © OpenStreetMap • Leaflet
      </div>
    </div>
  );
}

/* ============================ Beat Lab – צד ימין ============================ */

type BeatRow = "kick" | "snare" | "hat";

const STEPS = 16;

function useBeatLab() {
  const [bpm, setBpm] = React.useState(100);
  const [eqLow, setEqLow] = React.useState(0);
  const [eqMid, setEqMid] = React.useState(0);
  const [eqHigh, setEqHigh] = React.useState(0);

  const [pattern, setPattern] = React.useState<Record<BeatRow, boolean[]>>({
    kick: Array(STEPS).fill(false),
    snare: Array(STEPS).fill(false),
    hat: Array(STEPS).fill(false),
  });

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);

  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const intervalRef = React.useRef<number | null>(null);

  function toggleCell(row: BeatRow, idx: number) {
    setPattern((p) => {
      const nextRow = [...p[row]];
      nextRow[idx] = !nextRow[idx];
      return { ...p, [row]: nextRow };
    });
  }

  function playClick(freq: number, gain: number, lengthMs: number) {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      const now = ctx.currentTime;
      const gainLinear = Math.pow(10, gain / 20); // dB-ish

      osc.frequency.value = freq;
      osc.type = "square";
      gainNode.gain.setValueAtTime(gainLinear, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + lengthMs / 1000);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + lengthMs / 1000);
    } catch {
      // מתעלמים משגיאות סאונד
    }
  }

  function tick(step: number) {
    setCurrentStep(step);

    const rowKick = pattern.kick[step];
    const rowSnare = pattern.snare[step];
    const rowHat = pattern.hat[step];

    // התאמת EQ – רק כוונון כללי לעוצמה
    const lowGain = -6 + eqLow * 3;
    const midGain = -3 + eqMid * 2;
    const highGain = -10 + eqHigh * 4;

    if (rowKick) {
      playClick(80, lowGain, 80);
    }
    if (rowSnare) {
      playClick(180, midGain, 60);
    }
    if (rowHat) {
      playClick(6000, highGain, 40);
    }
  }

  function start() {
    try {
      if (typeof window === "undefined") return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
    } catch {
      // אין אודיו – לא נחרבן את הדף
    }

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    const stepMs = 60_000 / bpm / 4; // 16th notes
    let step = 0;
    tick(step);

    intervalRef.current = window.setInterval(() => {
      step = (step + 1) % STEPS;
      tick(step);
    }, stepMs) as any;

    setIsPlaying(true);
  }

  function stop() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(0);
  }

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return {
    bpm,
    setBpm,
    eqLow,
    setEqLow,
    eqMid,
    setEqMid,
    eqHigh,
    setEqHigh,
    pattern,
    toggleCell,
    isPlaying,
    start,
    stop,
    currentStep,
  };
}

function BeatLabPanel() {
  const [open, setOpen] = React.useState(true);
  const {
    bpm,
    setBpm,
    eqLow,
    setEqLow,
    eqMid,
    setEqMid,
    eqHigh,
    setEqHigh,
    pattern,
    toggleCell,
    isPlaying,
    start,
    stop,
    currentStep,
  } = useBeatLab();

  const rows: BeatRow[] = ["kick", "snare", "hat"];
  const rowLabels: Record<BeatRow, string> = {
    kick: "קיק",
    snare: "סנייר",
    hat: "הייט",
  };

  function handleShareBeat() {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const txt =
      "בנינו ביט חדש ב-MATY-JAM, בואו לשמוע ולהצטרף לג׳אם:\n" + base + "/jam";
    shareToWhatsApp(txt);
  }

  return (
    <aside className="rounded-2xl border border-slate-800 bg-slate-950/95 p-4 flex flex-col gap-3 h-full">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-sm font-semibold text-slate-100"
      >
        <span className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-emerald-400" />
          MATY-JAM • Beat Lab & EQ
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {open && (
        <>
          {/* EQ */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="text-xs font-semibold text-slate-200 mb-2">
              אקוולייזר מהיר (לא הורס לך את האתר – רק shaping לביט פה)
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-[11px] text-slate-300">
              <div>
                <div>LOW</div>
                <input
                  type="range"
                  min={-4}
                  max={4}
                  step={1}
                  value={eqLow}
                  onChange={(e) => setEqLow(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div>MID</div>
                <input
                  type="range"
                  min={-4}
                  max={4}
                  step={1}
                  value={eqMid}
                  onChange={(e) => setEqMid(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div>HIGH</div>
                <input
                  type="range"
                  min={-4}
                  max={4}
                  step={1}
                  value={eqHigh}
                  onChange={(e) => setEqHigh(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* BPM + Transport */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>BPM</span>
              <input
                type="number"
                min={70}
                max={150}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value || 100))}
                className="w-16 h-8 rounded-md border border-slate-700 bg-slate-950 px-2 text-slate-100 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={isPlaying ? stop : start}
                className={`flex items-center gap-1 px-3 h-8 rounded-full text-xs font-semibold ${
                  isPlaying
                    ? "bg-rose-500 text-black"
                    : "bg-emerald-500 text-black"
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-3 h-3" /> עצור
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" /> נגן ביט
                  </>
                )}
              </button>
              <button
                onClick={handleShareBeat}
                className="flex items-center gap-1 px-3 h-8 rounded-full border border-slate-700 text-xs text-slate-100 hover:bg-slate-900"
              >
                <Share2 className="w-3 h-3" />
                שתף בווטסאפ
              </button>
            </div>
          </div>

          {/* GRID */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="text-xs font-semibold text-slate-200 mb-2">
              סטפס (16) – בניית ביט מהירה
            </div>
            <div className="space-y-1">
              {rows.map((row) => (
                <div
                  key={row}
                  className="flex items-center gap-2 text-[11px] text-slate-300"
                >
                  <div className="w-10 text-right">{rowLabels[row]}</div>
                  <div className="flex gap-[3px] flex-1">
                    {pattern[row].map((on, idx) => {
                      const isCurrent = idx === currentStep && isPlaying;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleCell(row, idx)}
                          className={[
                            "flex-1 h-6 rounded-sm border text-[9px]",
                            on
                              ? "bg-emerald-500 border-emerald-400 text-black"
                              : "bg-slate-800 border-slate-700 text-slate-500",
                            isCurrent ? "ring-2 ring-emerald-400" : "",
                          ].join(" ")}
                        >
                          {((idx % 4) + 1).toString()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            זה לא מחליף את ה־DAW שלך – זה סקיצה מהירה כדי להרגיש את הגרוב, לפני
            שאתה עולה ל־Ableton / Cubase / PA5X.
          </div>
        </>
      )}
    </aside>
  );
}

/* ============================ Main Page ============================ */

export default function MatyJamHomePage() {
  const [items, setItems] = React.useState<JamGroupClient[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [cursor, setCursor] = React.useState<string | null>(null);

  const [filters, setFilters] = React.useState<FiltersState>({
    q: "",
    city: "",
    daws: [],
    purposes: [],
    skills: [],
    radiusKm: 0,
    lng: undefined,
    lat: undefined,
  });

  const { open, onOpen, onClose } = useDisclosure(false);

  const qs = React.useMemo(() => {
    const u = new URLSearchParams();
    if (filters.q) u.set("q", filters.q);
    if (filters.city) u.set("city", filters.city);
    if (cursor) u.set("cursor", cursor);
    u.set("limit", "24");
    return u.toString();
  }, [filters.q, filters.city, cursor]);

  async function load(reset = false) {
    setLoading(true);
    if (reset) setCursor(null);
    const res = await fetch(`/api/jam/groups?${qs}`, { cache: "no-store" });
    const j = await res.json().catch(() => null);
    setLoading(false);
    if (!j?.ok) return;
    const newItems = (j.items || []) as JamGroupClient[];
    setItems(reset ? newItems : [...items, ...newItems]);
    setCursor(j.nextCursor || null);
  }

  React.useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  function onLocate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setFilters((v) => ({
        ...v,
        lng: pos.coords.longitude,
        lat: pos.coords.latitude,
        radiusKm: v.radiusKm || 10,
      }));
    });
  }

  async function onJoin(g: JamGroupClient) {
    const r = await fetch(`/api/jam/groups/${g._id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join" }),
    });
    const j = await r.json().catch(() => null);
    if (j?.ok) {
      load(true);
    }
  }

  function onOpenGroup(id: string) {
    window.location.href = `/jam/${id}`;
  }

  const mapPins: MapPin[] = React.useMemo(() => {
    return (items || [])
      .filter(
        (g) =>
          typeof g.lat === "number" &&
          Number.isFinite(g.lat) &&
          typeof g.lng === "number" &&
          Number.isFinite(g.lng),
      )
      .map((g) => ({
        id: g._id,
        title: g.title || "קבוצה",
        lat: g.lat as number,
        lng: g.lng as number,
        city: g.city,
      }));
  }, [items]);

  function handleShareJamHome() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const txt =
      "יאללה ג׳אם! מצאתי את MATY-JAM – חיבור מוזיקאים, ביטים וג׳אמים לייב:\n" +
      origin +
      "/jam";
    shareToWhatsApp(txt);
  }

  function openJamAI() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("mm:assistant:open", {
        detail: { area: "jam", mode: "beat" },
      }),
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-950 to-black text-slate-50"
    >
      <div className="container mx-auto px-3 py-6 space-y-6">
        {/* TOP: HERO + AI/Shares */}
        <section className="grid gap-4 lg:grid-cols-[2.2fr,1.4fr] items-stretch">
          <div className="rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,.32),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(59,130,246,.28),transparent_60%)] bg-slate-950/90 p-5 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_10%_0%,#22c55e33,transparent_55%),radial-gradient(circle_at_90%_100%,#e879f933,transparent_60%)]" />
            <div className="relative space-y-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex flex-wrap items-center gap-2">
                <span>MATY-JAM</span>
                <span className="text-sm rounded-full border border-emerald-400/70 bg-emerald-500/15 px-3 py-1 text-emerald-100">
                  מחובר ל־MATY-DATE & CLUB
                </span>
              </h1>
              <p className="text-sm text-slate-200 max-w-xl">
                זה המרכז של כל הג׳אמים במערכת MATY: חב״ד, מזרחי, DJ, רוק, חזרות
                להופעות, לימוד ועבודה על ביטים. אותו משתמש לכל MATY-MUSIC /
                MATY-DATE / MATY-CLUB.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={onOpen}
                  className="px-5 h-11 rounded-xl bg-emerald-500 text-black font-semibold shadow-lg hover:bg-emerald-400"
                >
                  + פתיחת קבוצת JAM
                </button>
                <Link
                  href="#browse"
                  className="px-5 h-11 rounded-xl border border-slate-700 text-sm text-slate-100 hover:bg-slate-900"
                >
                  דפדוף בכל הקבוצות
                </Link>
                <button
                  onClick={handleShareJamHome}
                  className="px-5 h-11 rounded-xl border border-emerald-500/70 text-sm text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  שיתוף לווטסאפ
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 pt-4 text-xs text-slate-200">
                <div className="rounded-2xl bg-slate-950/80 border border-slate-800 px-3 py-2">
                  <div className="font-semibold text-emerald-200">
                    JAM = קבוצות לפי ז׳אנר
                  </div>
                  <div className="text-slate-400 mt-1">
                    כל קבוצה מחוברת למשתמשים של MATY – אפשר לראות מי מנגן איפה
                    ומתי.
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-950/80 border border-slate-800 px-3 py-2">
                  <div className="font-semibold text-sky-200">מצלמות & RTC</div>
                  <div className="text-slate-400 mt-1">
                    משתמש ב־RTC שכבר קיים לך ב־CLUB – פותחים חדר לייב עם אותה
                    תשתית.
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-950/80 border border-slate-800 px-3 py-2">
                  <div className="font-semibold text-fuchsia-200">
                    MATY-AI JAM COACH
                  </div>
                  <div className="text-slate-400 mt-1">
                    סוכן AI שמכיר את הג׳אנרים, נותן סט־ליסטים ורעיונות לצוות לכל
                    ג׳אם.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIDE PANELS: LIVE + AI */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 flex flex-col justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  JAM LIVE • מצלמות
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  פתיחת חדר וידאו 1 על 1 או חדר ג׳אם לייב. משתמש ב־/api/rtc/*
                  בדיוק כמו ב־CLUB – כדי שלא תצטרך עוד מערכת.
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/club?area=jam&tab=live";
                  }}
                  className="px-4 h-9 rounded-xl bg-slate-100 text-slate-900 text-xs font-semibold hover:bg-white"
                >
                  🔴 התחל JAM LIVE
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/club?area=jam&tab=rtc";
                  }}
                  className="px-4 h-9 rounded-xl border border-slate-600 text-xs text-slate-100 hover:bg-slate-900"
                >
                  חדר וידאו 1 על 1
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 flex flex-col justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-indigo-400" />
                  MATY-AI • JAM COACH
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  תגיד ל־AI מה אתה רוצה: ג׳אם חב״ד / מזרחי / דאנס, מי מנגן, איזה
                  ציוד יש – והוא יחזיר לך סט־ליסט, חלוקת תפקידים ורעיונות
                  לשדרוג.
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openJamAI}
                  className="px-4 h-9 rounded-xl bg-indigo-500 text-xs font-semibold text-white hover:bg-indigo-400"
                >
                  🤖 פתח JAM-AI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/music";
                  }}
                  className="px-4 h-9 rounded-xl border border-slate-600 text-xs text-slate-100 hover:bg-slate-900"
                >
                  לראות שירים / פלייליסטים
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FILTERS */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-sm font-semibold text-slate-100">
              סינון קבוצות JAM
            </div>
            <div className="text-xs text-slate-400">
              {loading
                ? "טוען קבוצות…"
                : `נמצאו ${items.length || 0} קבוצות מתאימות`}
            </div>
          </div>
          <GroupFilters
            value={filters}
            onChange={setFilters}
            onLocate={onLocate}
          />
        </section>

        {/* MAIN GRID: MAP + LIST + BEAT LAB */}
        <section className="grid gap-4 xl:grid-cols-[1.5fr,2.2fr,1.6fr] lg:grid-cols-[1.4fr,2.2fr] items-start">
          <MapView
            items={mapPins}
            userPos={
              typeof filters.lat === "number" && typeof filters.lng === "number"
                ? { lat: filters.lat, lng: filters.lng }
                : null
            }
            radiusKm={filters.radiusKm}
            onOpenGroup={onOpenGroup}
          />

          <section
            id="browse"
            className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-100">
                קבוצות JAM זמינות
              </div>
              <div className="text-xs text-slate-400">
                {cursor ? "ניתן לטעון עוד בהמשך" : "הצגה עדכנית"}
              </div>
            </div>

            {loading && items.length === 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-4 border border-slate-800 bg-slate-900/80 animate-pulse"
                  >
                    <div className="h-4 w-2/3 rounded bg-slate-700/60" />
                    <div className="h-3 w-1/3 rounded bg-slate-700/60 mt-2" />
                    <div className="h-16 rounded bg-slate-700/40 mt-4" />
                  </div>
                ))}
              </div>
            ) : items.length ? (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {items.map((g) => (
                    <GroupCard
                      key={g._id}
                      g={g}
                      onJoin={onJoin}
                      onOpen={onOpenGroup}
                    />
                  ))}
                </div>

                <div className="mt-4 flex justify-center">
                  {cursor ? (
                    <button
                      onClick={() => load(false)}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl border border-slate-700 text-sm text-slate-100 hover:bg-slate-900 disabled:opacity-60"
                    >
                      {loading ? "טוען..." : "טען עוד קבוצות"}
                    </button>
                  ) : (
                    <div className="text-sm text-slate-400">
                      {loading ? "טוען..." : "זה מה שיש לעכשיו"}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-center">
                <div className="text-base font-semibold text-slate-100">
                  לא נמצאו קבוצות JAM תואמות
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  שחק עם הפילטרים או פשוט פתח קבוצת JAM משלך.
                </div>
                <div className="mt-3">
                  <button
                    onClick={onOpen}
                    className="px-5 h-11 rounded-xl bg-emerald-500 text-black font-semibold shadow-lg"
                  >
                    + פתיחת קבוצת JAM
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Beat Lab – בדסקטופ בצד ימין */}
          <div className="hidden xl:block">
            <BeatLabPanel />
          </div>
        </section>

        {/* Beat Lab למובייל / מסכים קטנים */}
        <section className="xl:hidden">
          <BeatLabPanel />
        </section>

        {/* HOW IT WORKS */}
        <section className="grid md:grid-cols-3 gap-3 pb-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
            <div className="text-lg text-slate-100">1. מוצאים את החבר׳ה</div>
            <div className="text-sm text-slate-400 mt-1">
              פילטרים לפי DAW, ז׳אנר, רמה ומיקום – אתה רואה מי פנוי לג׳אם, מי
              עושה חזרות, ומי מחפש עוד נגן.
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
            <div className="text-lg text-slate-100">
              2. מצלמות, JAM-AI וביטים
            </div>
            <div className="text-sm text-slate-400 mt-1">
              פותחים חדר לייב, מריצים AI לסט־ליסט, משחקים עם Beat Lab כדי לתפוס
              את הוייב – ואז קובעים מה עושים באמת.
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
            <div className="text-lg text-slate-100">3. ג׳אם בשטח</div>
            <div className="text-sm text-slate-400 mt-1">
              מתיאמים מקום וזמן, פותחים קבוצת ווטסאפ/טלגרם מהקבוצה, ונפגשים
              לנגן. MATY-JAM זה רק הבסיס שמחבר את כל זה.
            </div>
          </div>
        </section>

        <CreateGroupDialog
          open={open}
          onClose={onClose}
          onCreated={() => {
            onClose();
            load(true);
          }}
        />
      </div>
    </main>
  );
}
