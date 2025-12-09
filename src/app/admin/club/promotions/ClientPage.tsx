// app/admin/club/promotions/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Upload,
  CalendarClock,
  Users2,
  SplitSquareVertical,
  Layers,
  Coins,
  Rocket,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/** **********************************************************************
 * ⛳️ SETTINGS
 *********************************************************************** */
// אם אין לך עדיין API אמיתי — הפעל DEMO_MODE = true כדי לשמור ב-localStorage
const DEMO_MODE = true;

/** נתיב ה-API — שנה אם צריך בצד שרת */
const API_BASE = "/api/admin/promotions";

/** מבנה פרסומת */
type Creative = {
  id: string;
  title: string;
  imageUrl?: string;
  audioUrl?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

type Promotion = {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "archived";
  type:
    | "banner"
    | "audio_preroll"
    | "sponsored_track"
    | "playlist_takeover"
    | "interstitial";
  priority: "normal" | "high";
  /** Targeting */
  audience: {
    seekingMatch?: boolean; // רווקים/רווקות שמחפשים זוגיות
    marriedOnly?: boolean; // נשואים בלבד
    categories?: string[]; // chabad/hassidic/jewish/breslov/carlebach/shabbat/dance...
    moods?: string[]; // דביקות/שמחה/מרומם/רגוע...
    tempos?: Array<"slow" | "mid" | "fast">;
    bpmMin?: number | null;
    bpmMax?: number | null;
    locales?: string[]; // he-IL, en-US,...
  };
  /** Scheduling */
  schedule: {
    startAt?: string | null; // ISO
    endAt?: string | null; // ISO
    timezone?: string; // Asia/Jerusalem
    capping?: {
      maxImpressions?: number | null;
      dailyCap?: number | null;
      perUserCap?: number | null;
    };
    pacing?: "even" | "asap";
  };
  /** Budgeting */
  budget?: {
    model: "CPM" | "CPC" | "Fixed";
    bid?: number | null; // CPM/CPC bid
    totalBudget?: number | null; // ל-Fixed
  };
  /** A/B */
  creatives: Creative[];
  /** Analytics (לקריאה בלבד) */
  stats?: {
    impressions: number;
    clicks: number;
    ctr: number;
    spends: number;
  };
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

/** ערכי ברירת מחדל */
const CATEGORY_OPTIONS = [
  "chabad",
  "hassidic",
  "jewish",
  "breslov",
  "carlebach",
  "shabbat",
  "dance",
];
const MOOD_OPTIONS = ["דביקות", "שמחה", "מרומם", "רגוע"];
const TEMPO_OPTIONS: Array<"slow" | "mid" | "fast"> = ["slow", "mid", "fast"];
const TIMEZONE_DEFAULT = "Asia/Jerusalem";

/** **********************************************************************
 * 🧰 Utilities
 *********************************************************************** */
const cx = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

async function safeFetchJSON(
  input: RequestInfo,
  init?: RequestInit,
): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  try {
    const res = await fetch(input, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers || {}) },
      cache: "no-store",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status} ${txt}`.trim() };
    }
    const json = await res.json().catch(() => null);
    return { ok: true, data: json };
  } catch (e: any) {
    return { ok: false, error: e?.message || "fetch_error" };
  }
}

/** DEMO store — כשאין API */
const demoKey = "__mm_demo_promotions__";
function demoLoad(): Promotion[] {
  try {
    const raw = localStorage.getItem(demoKey);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function demoSave(items: Promotion[]) {
  localStorage.setItem(demoKey, JSON.stringify(items));
}

/** קריאות API — יפלו לדמו אם DEMO_MODE = true */
async function apiList(): Promise<Promotion[]> {
  if (DEMO_MODE && typeof window !== "undefined") {
    return demoLoad();
  }
  const r = await safeFetchJSON(API_BASE);
  if (!r.ok) throw new Error(r.error);
  return r.data?.items || [];
}
async function apiCreate(p: Promotion): Promise<Promotion> {
  if (DEMO_MODE && typeof window !== "undefined") {
    const items = demoLoad();
    items.unshift(p);
    demoSave(items);
    return p;
  }
  const r = await safeFetchJSON(API_BASE, {
    method: "POST",
    body: JSON.stringify(p),
  });
  if (!r.ok) throw new Error(r.error);
  return r.data;
}
async function apiUpdate(
  id: string,
  patch: Partial<Promotion>,
): Promise<Promotion> {
  if (DEMO_MODE && typeof window !== "undefined") {
    const items = demoLoad();
    const idx = items.findIndex((x) => x.id === id);
    if (idx >= 0) {
      items[idx] = {
        ...items[idx],
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      demoSave(items);
      return items[idx];
    }
    throw new Error("not_found");
  }
  const r = await safeFetchJSON(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error(r.error);
  return r.data;
}
async function apiDeleteMany(ids: string[]): Promise<void> {
  if (DEMO_MODE && typeof window !== "undefined") {
    const items = demoLoad().filter((x) => !ids.includes(x.id));
    demoSave(items);
    return;
  }
  const r = await safeFetchJSON(`${API_BASE}/bulk-delete`, {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
  if (!r.ok) throw new Error(r.error);
}

/** פורמט אחוז */
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

/** **********************************************************************
 * 🎛️ Filters / Query
 *********************************************************************** */
type Query = {
  q: string;
  status: "" | Promotion["status"];
  type: "" | Promotion["type"];
  sort: "recent" | "impressions" | "ctr";
};

function useQuery() {
  const [q, setQ] = useState<Query>({
    q: "",
    status: "",
    type: "",
    sort: "recent",
  });
  return { q, setQ };
}

/** **********************************************************************
 * 🧩 Chips MultiSelect + Small Inputs
 *********************************************************************** */
function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "rounded-full border px-3 py-1 text-xs transition",
        active
          ? "bg-fuchsia-600 border-fuchsia-600 text-white"
          : "bg-white dark:bg-zinc-900",
      )}
    >
      {children}
    </button>
  );
}

function MultiChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const set = new Set(value);
  return (
    <div>
      <div className="mb-1 text-xs opacity-70">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <Chip
            key={opt}
            active={set.has(opt)}
            onClick={() => {
              const next = new Set(value);
              if (next.has(opt)) next.delete(opt);
              else next.add(opt);
              onChange([...next]);
            }}
          >
            {opt}
          </Chip>
        ))}
      </div>
    </div>
  );
}

/** **********************************************************************
 * 🧱 New / Edit Promotion Drawer
 *********************************************************************** */
function PromotionEditor({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Promotion | null;
  onSave: (p: Promotion) => void;
}) {
  const isEdit = !!initial;
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<Promotion["type"]>(
    initial?.type || "banner",
  );
  const [status, setStatus] = useState<Promotion["status"]>(
    initial?.status || "draft",
  );
  const [priority, setPriority] = useState<Promotion["priority"]>(
    initial?.priority || "normal",
  );

  const [audCategories, setAudCategories] = useState<string[]>(
    initial?.audience?.categories || [],
  );
  const [audMoods, setAudMoods] = useState<string[]>(
    initial?.audience?.moods || [],
  );
  const [audTempos, setAudTempos] = useState<Array<"slow" | "mid" | "fast">>(
    initial?.audience?.tempos || [],
  );
  const [audBpmMin, setAudBpmMin] = useState<number | "">(
    initial?.audience?.bpmMin ?? "",
  );
  const [audBpmMax, setAudBpmMax] = useState<number | "">(
    initial?.audience?.bpmMax ?? "",
  );
  const [audSeeking, setAudSeeking] = useState<boolean>(
    !!initial?.audience?.seekingMatch,
  );
  const [audMarriedOnly, setAudMarriedOnly] = useState<boolean>(
    !!initial?.audience?.marriedOnly,
  );
  const [audLocales, setAudLocales] = useState<string[]>(
    initial?.audience?.locales || ["he-IL"],
  );

  const [startAt, setStartAt] = useState(initial?.schedule?.startAt || "");
  const [endAt, setEndAt] = useState(initial?.schedule?.endAt || "");
  const [timezone, setTimezone] = useState(
    initial?.schedule?.timezone || TIMEZONE_DEFAULT,
  );
  const [capMax, setCapMax] = useState<number | "">(
    initial?.schedule?.capping?.maxImpressions ?? "",
  );
  const [capDaily, setCapDaily] = useState<number | "">(
    initial?.schedule?.capping?.dailyCap ?? "",
  );
  const [capPerUser, setCapPerUser] = useState<number | "">(
    initial?.schedule?.capping?.perUserCap ?? "",
  );
  const [pacing, setPacing] = useState<"even" | "asap">(
    initial?.schedule?.pacing || "even",
  );

  const [budgetModel, setBudgetModel] = useState<"CPM" | "CPC" | "Fixed">(
    initial?.budget?.model || "CPM",
  );
  const [bid, setBid] = useState<number | "">(initial?.budget?.bid ?? "");
  const [totalBudget, setTotalBudget] = useState<number | "">(
    initial?.budget?.totalBudget ?? "",
  );

  const [creatives, setCreatives] = useState<Creative[]>(
    initial?.creatives?.length
      ? initial.creatives
      : [
          {
            id: uid("cr"),
            title: "קריאייטיב A",
            imageUrl: "",
            body: "",
            ctaLabel: "שמעו עכשיו",
            ctaUrl: "",
          },
        ],
  );

  useEffect(() => {
    if (!open) return;
    // reset progress indicator
    setBusy(false);
  }, [open]);

  const addCreative = () =>
    setCreatives((prev) => [
      ...prev,
      {
        id: uid("cr"),
        title: `קריאייטיב ${String.fromCharCode(65 + prev.length)}`,
      },
    ]);

  const removeCreative = (id: string) =>
    setCreatives((prev) => prev.filter((x) => x.id !== id));

  const onSubmit = async () => {
    if (!name.trim()) {
      toast.error("שם פרסומת חובה");
      return;
    }
    if (!creatives.length) {
      toast.error("נדרש לפחות קריאייטיב אחד");
      return;
    }
    setBusy(true);

    const nowIso = new Date().toISOString();
    const payload: Promotion = {
      id: isEdit ? initial!.id : uid("promo"),
      name: name.trim(),
      status,
      type,
      priority,
      audience: {
        seekingMatch: audSeeking || undefined,
        marriedOnly: audMarriedOnly || undefined,
        categories: audCategories,
        moods: audMoods,
        tempos: audTempos,
        bpmMin: audBpmMin === "" ? null : Number(audBpmMin),
        bpmMax: audBpmMax === "" ? null : Number(audBpmMax),
        locales: audLocales,
      },
      schedule: {
        startAt: startAt || null,
        endAt: endAt || null,
        timezone,
        capping: {
          maxImpressions: capMax === "" ? null : Number(capMax),
          dailyCap: capDaily === "" ? null : Number(capDaily),
          perUserCap: capPerUser === "" ? null : Number(capPerUser),
        },
        pacing,
      },
      budget: {
        model: budgetModel,
        bid: bid === "" ? null : Number(bid),
        totalBudget: totalBudget === "" ? null : Number(totalBudget),
      },
      creatives: creatives.map((c) => ({ ...c })),
      stats: initial?.stats || { impressions: 0, clicks: 0, ctr: 0, spends: 0 },
      createdAt: isEdit ? initial!.createdAt : nowIso,
      updatedAt: nowIso,
    };

    try {
      const saved = isEdit
        ? await apiUpdate(payload.id, payload)
        : await apiCreate(payload);
      toast.success(isEdit ? "הפרסומת עודכנה" : "הפרסומת נוצרה");
      onSave(saved);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "שגיאת שמירה");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid grid-cols-[minmax(0,1fr)] bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="ms-auto h-full w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isEdit ? "עריכת פרסומת" : "פרסומת חדשה"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            סגור
          </button>
        </div>

        {/* General */}
        <section className="mb-6 grid gap-3 rounded-2xl border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs opacity-70">שם הקמפיין</span>
              <input
                className="rounded-lg border px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="למשל: ספוט — צמאה 10"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs opacity-70">סוג</span>
              <select
                className="rounded-lg border px-3 py-2"
                value={type}
                onChange={(e) => setType(e.target.value as Promotion["type"])}
              >
                <option value="banner">Banner</option>
                <option value="interstitial">Interstitial</option>
                <option value="audio_preroll">Audio pre-roll</option>
                <option value="sponsored_track">Sponsored track</option>
                <option value="playlist_takeover">Playlist takeover</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs opacity-70">סטטוס</span>
              <select
                className="rounded-lg border px-3 py-2"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as Promotion["status"])
                }
              >
                <option value="draft">טיוטה</option>
                <option value="active">פעיל</option>
                <option value="paused">מושהה</option>
                <option value="archived">ארכיון</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs opacity-70">עדיפות</span>
              <select
                className="rounded-lg border px-3 py-2"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as Promotion["priority"])
                }
              >
                <option value="normal">רגיל</option>
                <option value="high">גבוה</option>
              </select>
            </label>
          </div>
        </section>

        {/* Audience */}
        <section className="mb-6 grid gap-4 rounded-2xl border p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Users2 className="h-4 w-4" />
            פילוח קהל
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={audSeeking}
                onChange={(e) => setAudSeeking(e.target.checked)}
              />
              רווקים/רווקות בחיפוש זוגיות
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={audMarriedOnly}
                onChange={(e) => setAudMarriedOnly(e.target.checked)}
              />
              נשואים בלבד
            </label>
          </div>

          <MultiChips
            label="קטגוריות/זרמים"
            options={CATEGORY_OPTIONS}
            value={audCategories}
            onChange={setAudCategories}
          />
          <MultiChips
            label="מצבי רוח"
            options={MOOD_OPTIONS}
            value={audMoods}
            onChange={setAudMoods}
          />
          <MultiChips
            label="טמפו"
            options={TEMPO_OPTIONS}
            value={audTempos}
            onChange={(xs) =>
              setAudTempos(xs as Promotion["audience"]["tempos"])
            }
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1">
              <span className="text-xs opacity-70">BPM מ-</span>
              <input
                type="number"
                min={40}
                max={220}
                className="rounded-lg border px-3 py-2"
                value={audBpmMin}
                onChange={(e) =>
                  setAudBpmMin(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs opacity-70">BPM עד</span>
              <input
                type="number"
                min={40}
                max={220}
                className="rounded-lg border px-3 py-2"
                value={audBpmMax}
                onChange={(e) =>
                  setAudBpmMax(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs opacity-70">שפות/איזורים</span>
              <input
                className="rounded-lg border px-3 py-2"
                value={audLocales.join(",")}
                onChange={(e) =>
                  setAudLocales(
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="he-IL,en-US"
              />
            </label>
          </div>
        </section>

        {/* Scheduling */}
        <section className="mb-6 grid gap-4 rounded-2xl border p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-4 w-4" />
            תזמון & קאפינג
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1">
              <span className="text-xs opacity-70">התחלה</span>
              <input
                type="datetime-local"
                className="rounded-lg border px-3 py-2"
                value={startAt?.slice(0, 16) || ""}
                onChange={(e) =>
                  setStartAt(
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  )
                }
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs opacity-70">סיום</span>
              <input
                type="datetime-local"
                className="rounded-lg border px-3 py-2"
                value={endAt?.slice(0, 16) || ""}
                onChange={(e) =>
                  setEndAt(
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  )
                }
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs opacity-70">אזור זמן</span>
              <input
                className="rounded-lg border px-3 py-2"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder={TIMEZONE_DEFAULT}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <label className="grid gap-1">
              <span className="text-xs opacity-70">Cap כולל</span>
              <input
                type="number"
                min={0}
                className="rounded-lg border px-3 py-2"
                value={capMax}
                onChange={(e) =>
                  setCapMax(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs opacity-70">Cap יומי</span>
              <input
                type="number"
                min={0}
                className="rounded-lg border px-3 py-2"
                value={capDaily}
                onChange={(e) =>
                  setCapDaily(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs opacity-70">Cap למשתמש</span>
              <input
                type="number"
                min={0}
                className="rounded-lg border px-3 py-2"
                value={capPerUser}
                onChange={(e) =>
                  setCapPerUser(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs opacity-70">קצב הצגה</span>
              <select
                className="rounded-lg border px-3 py-2"
                value={pacing}
                onChange={(e) => setPacing(e.target.value as "even" | "asap")}
              >
                <option value="even">אחיד</option>
                <option value="asap">מהר ככל האפשר</option>
              </select>
            </label>
          </div>
        </section>

        {/* Budget */}
        <section className="mb-6 grid gap-4 rounded-2xl border p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Coins className="h-4 w-4" />
            תקציב
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1">
              <span className="text-xs opacity-70">מודל</span>
              <select
                className="rounded-lg border px-3 py-2"
                value={budgetModel}
                onChange={(e) => setBudgetModel(e.target.value as any)}
              >
                <option value="CPM">CPM</option>
                <option value="CPC">CPC</option>
                <option value="Fixed">Fixed</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-xs opacity-70">Bid</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="rounded-lg border px-3 py-2"
                value={bid}
                onChange={(e) =>
                  setBid(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="למשל: 2.5"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs opacity-70">Total Budget</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="rounded-lg border px-3 py-2"
                value={totalBudget}
                onChange={(e) =>
                  setTotalBudget(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </label>
          </div>
        </section>

        {/* Creatives */}
        <section className="mb-6 grid gap-4 rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Layers className="h-4 w-4" />
              קריאייטיבים (A/B)
            </div>
            <button
              onClick={addCreative}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              הוספת קריאייטיב
            </button>
          </div>

          <div className="grid gap-3">
            {creatives.map((cr, idx) => (
              <div key={cr.id} className="grid gap-3 rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">וריאציה {idx + 1}</div>
                  <button
                    onClick={() => removeCreative(cr.id)}
                    className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> מחיקה
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs opacity-70">כותרת</span>
                    <input
                      className="rounded-lg border px-3 py-2"
                      value={cr.title || ""}
                      onChange={(e) =>
                        setCreatives((prev) =>
                          prev.map((x) =>
                            x.id === cr.id
                              ? { ...x, title: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs opacity-70">
                      תיאור קצר (אופציונלי)
                    </span>
                    <input
                      className="rounded-lg border px-3 py-2"
                      value={cr.body || ""}
                      onChange={(e) =>
                        setCreatives((prev) =>
                          prev.map((x) =>
                            x.id === cr.id ? { ...x, body: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs opacity-70">
                      תמונת באנר/כרזה (URL)
                    </span>
                    <input
                      className="rounded-lg border px-3 py-2"
                      placeholder="https://..."
                      value={cr.imageUrl || ""}
                      onChange={(e) =>
                        setCreatives((prev) =>
                          prev.map((x) =>
                            x.id === cr.id
                              ? { ...x, imageUrl: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs opacity-70">
                      אודיו (URL) — לפרה-רול
                    </span>
                    <input
                      className="rounded-lg border px-3 py-2"
                      placeholder="https://..."
                      value={cr.audioUrl || ""}
                      onChange={(e) =>
                        setCreatives((prev) =>
                          prev.map((x) =>
                            x.id === cr.id
                              ? { ...x, audioUrl: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs opacity-70">CTA Label</span>
                    <input
                      className="rounded-lg border px-3 py-2"
                      value={cr.ctaLabel || ""}
                      onChange={(e) =>
                        setCreatives((prev) =>
                          prev.map((x) =>
                            x.id === cr.id
                              ? { ...x, ctaLabel: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs opacity-70">CTA URL</span>
                    <input
                      className="rounded-lg border px-3 py-2"
                      placeholder="https://..."
                      value={cr.ctaUrl || ""}
                      onChange={(e) =>
                        setCreatives((prev) =>
                          prev.map((x) =>
                            x.id === cr.id
                              ? { ...x, ctaUrl: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                </div>

                {/* Preview */}
                <div className="grid gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/40">
                  <div className="text-xs opacity-70">תצוגה מוקדמת</div>
                  <div className="flex items-center gap-3">
                    {cr.imageUrl ? (
                      <img
                        src={cr.imageUrl}
                        alt="banner"
                        className="h-16 w-28 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-28 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-700">
                        <Upload className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {cr.title || "—"}
                      </div>
                      <div className="truncate text-xs opacity-70">
                        {cr.body || "—"}
                      </div>
                      {cr.ctaUrl && (
                        <a
                          className="mt-1 inline-block rounded-md bg-zinc-900 px-2 py-1 text-xs text-white dark:bg-zinc-700"
                          href={cr.ctaUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {cr.ctaLabel || "לפרטים"}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ביטול
          </button>
          <button
            disabled={busy}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            <Rocket className="h-4 w-4" />
            {isEdit ? "שמירת שינויים" : "יצירת פרסומת"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** **********************************************************************
 * 📄 Table + Bulk actions
 *********************************************************************** */
function PromotionsTable({
  items,
  selected,
  setSelected,
  onEdit,
}: {
  items: Promotion[];
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  onEdit: (p: Promotion) => void;
}) {
  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((x) => x.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="overflow-hidden rounded-2xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-900/50">
          <tr className="text-zinc-500 dark:text-zinc-300">
            <th className="px-3 py-2 text-right">
              <input
                type="checkbox"
                aria-label="בחר הכל"
                checked={selected.size === items.length && items.length > 0}
                onChange={toggleAll}
              />
            </th>
            <th className="px-3 py-2 text-right">שם</th>
            <th className="px-3 py-2 text-right">סוג</th>
            <th className="px-3 py-2 text-right">סטטוס</th>
            <th className="px-3 py-2 text-right">עדיפות</th>
            <th className="px-3 py-2 text-right">אימפרשנס</th>
            <th className="px-3 py-2 text-right">CTR</th>
            <th className="px-3 py-2 text-right">עדכון</th>
            <th className="px-3 py-2 text-right">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr
              key={p.id}
              className="border-t hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40"
            >
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  aria-label={`בחר ${p.name}`}
                  checked={selected.has(p.id)}
                  onChange={() => toggleOne(p.id)}
                />
              </td>
              <td className="px-3 py-2 font-medium">
                <div className="truncate max-w-[260px]" title={p.name}>
                  {p.name}
                </div>
              </td>
              <td className="px-3 py-2">{p.type}</td>
              <td className="px-3 py-2">
                {p.status === "active" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> פעיל
                  </span>
                ) : p.status === "paused" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                    <Pause className="h-3.5 w-3.5" /> מושהה
                  </span>
                ) : p.status === "archived" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    ארכיון
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    טיוטה
                  </span>
                )}
              </td>
              <td className="px-3 py-2">{p.priority}</td>
              <td className="px-3 py-2">{p.stats?.impressions ?? 0}</td>
              <td className="px-3 py-2">{pct(p.stats?.ctr ?? 0)}</td>
              <td className="px-3 py-2 text-xs opacity-70">
                {new Date(p.updatedAt).toLocaleString("he-IL")}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(p)}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {items.length === 0 && (
            <tr>
              <td colSpan={9} className="px-3 py-10 text-center text-zinc-500">
                אין פרסומות. לחץ “פרסומת חדשה”.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/** **********************************************************************
 * 🌟 Page
 *********************************************************************** */
export const metadata = { title: "פרסומות — אדמין" };
export const dynamic = "force-dynamic";

export default function Page() {
  const { q, setQ } = useQuery();
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState<Promotion | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let xs = [...items];
    if (q.q.trim()) {
      const s = q.q.trim().toLowerCase();
      xs = xs.filter((p) => p.name.toLowerCase().includes(s));
    }
    if (q.status) xs = xs.filter((p) => p.status === q.status);
    if (q.type) xs = xs.filter((p) => p.type === q.type);

    if (q.sort === "recent")
      xs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (q.sort === "impressions")
      xs.sort(
        (a, b) => (b.stats?.impressions ?? 0) - (a.stats?.impressions ?? 0),
      );
    if (q.sort === "ctr")
      xs.sort((a, b) => (b.stats?.ctr ?? 0) - (a.stats?.ctr ?? 0));

    return xs;
  }, [items, q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiList();
      setItems(list);
    } catch (e: any) {
      toast.error(e?.message || "שגיאת טעינה");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onNew = () => {
    setEditItem(null);
    setDrawerOpen(true);
  };

  const onEdit = (p: Promotion) => {
    setEditItem(p);
    setDrawerOpen(true);
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    const ids = [...selected];
    try {
      await apiDeleteMany(ids);
      toast.success("נמחק בהצלחה");
      setSelected(new Set());
      load();
    } catch (e: any) {
      toast.error(e?.message || "מחיקה נכשלה");
    }
  };

  const bulkPause = async () => {
    if (!selected.size) return;
    try {
      await Promise.all(
        [...selected].map((id) => apiUpdate(id, { status: "paused" })),
      );
      toast.success("עודכן למושהה");
      setSelected(new Set());
      load();
    } catch (e: any) {
      toast.error(e?.message || "כשל עדכון");
    }
  };

  const bulkActivate = async () => {
    if (!selected.size) return;
    try {
      await Promise.all(
        [...selected].map((id) => apiUpdate(id, { status: "active" })),
      );
      toast.success("הופעלו");
      setSelected(new Set());
      load();
    } catch (e: any) {
      toast.error(e?.message || "כשל עדכון");
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-6">
      <Toaster position="top-center" />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">פרסומות</h1>
          <p className="text-sm opacity-70">
            יצירה, פילוח קהל, תזמון, תקציב, A/B, וניהול קמפיינים – בפאנל אחד.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNew}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-2 text-sm text-white shadow hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            פרסומת חדשה
          </button>
          <button
            onClick={load}
            title="רענון"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 grid gap-3 rounded-2xl border p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
            <input
              dir="rtl"
              className="w-full rounded-lg border bg-white/70 px-10 py-2 outline-none dark:bg-zinc-900"
              placeholder="חיפוש לפי שם"
              value={q.q}
              onChange={(e) => setQ((prev) => ({ ...prev, q: e.target.value }))}
            />
          </label>
          <div className="flex gap-2">
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={q.status}
              onChange={(e) =>
                setQ((prev) => ({ ...prev, status: e.target.value as any }))
              }
            >
              <option value="">כל הסטטוסים</option>
              <option value="draft">טיוטה</option>
              <option value="active">פעיל</option>
              <option value="paused">מושהה</option>
              <option value="archived">ארכיון</option>
            </select>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={q.type}
              onChange={(e) =>
                setQ((prev) => ({ ...prev, type: e.target.value as any }))
              }
            >
              <option value="">כל הסוגים</option>
              <option value="banner">Banner</option>
              <option value="interstitial">Interstitial</option>
              <option value="audio_preroll">Audio pre-roll</option>
              <option value="sponsored_track">Sponsored track</option>
              <option value="playlist_takeover">Playlist takeover</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Filter className="h-4 w-4 opacity-60" />
            <select
              className="rounded-lg border px-3 py-2"
              value={q.sort}
              onChange={(e) =>
                setQ((prev) => ({ ...prev, sort: e.target.value as any }))
              }
            >
              <option value="recent">עדכונים אחרונים</option>
              <option value="impressions">הכי נצפו</option>
              <option value="ctr">CTR גבוה</option>
            </select>
          </div>
        </div>

        {/* bulk actions */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs opacity-70">
            נבחרו {selected.size} / {filtered.length}
          </span>
          <button
            onClick={bulkActivate}
            disabled={!selected.size}
            className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            הפעלה
          </button>
          <button
            onClick={bulkPause}
            disabled={!selected.size}
            className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            השהיה
          </button>
          <button
            onClick={bulkDelete}
            disabled={!selected.size}
            className="rounded-lg border px-3 py-1.5 text-xs text-red-600 disabled:opacity-50"
          >
            מחיקה
          </button>
        </div>
      </div>

      {/* Table */}
      <PromotionsTable
        items={filtered}
        selected={selected}
        setSelected={setSelected}
        onEdit={onEdit}
      />

      {/* Drawer */}
      <PromotionEditor
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initial={editItem}
        onSave={(saved) => {
          setItems((prev) => {
            const idx = prev.findIndex((x) => x.id === saved.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = saved;
              return copy;
            }
            return [saved, ...prev];
          });
        }}
      />
    </main>
  );
}
