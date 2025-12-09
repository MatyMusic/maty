// src/components/admin/date/AdminDateDashboard.tsx
"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RcTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Stats = import("@/lib/db/date-admin").DateAdminStats;

type Gender = "male" | "female" | "other" | null;
type Direction =
  | "orthodox"
  | "haredi"
  | "chasidic"
  | "modern"
  | "conservative"
  | "reform"
  | "reconstructionist"
  | "secular"
  | null;

type RowItem = {
  _id: string;
  userId?: string;
  displayName?: string;
  email?: string;
  gender?: Gender;
  judaism_direction?: Direction;
  country?: string | null;
  city?: string | null;
  updatedAt?: string | null;
  avatarUrl?: string | null;
};

const LS = {
  COLS: "mm.date.cols",
  VIEW: "mm.date.view",
  VIEWS: "mm.date.views",
  AUTOR: "mm.date.autoRefresh",
};

const DEFAULT_COLS: Record<string, boolean> = {
  avatar: true,
  displayName: true,
  email: true,
  gender: true,
  direction: true,
  location: true,
  updatedAt: true,
  userId: false,
};

const LIMIT = 20;

/* עוזרים קטנים */
const isBrowser = () => typeof window !== "undefined";
const arrify = (v: any): any[] => (Array.isArray(v) ? v : v ? [v] : []);
const csv = (v?: string | null) => {
  const s = (v ?? "").toString();
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const nf = (n: number | string) => Number(n || 0).toLocaleString("he-IL");

export default function AdminDateDashboard({
  initialStats,
}: {
  initialStats: Stats;
}) {
  /* ===== סטטיסטיקות ===== */
  const [stats, setStats] = React.useState<Stats>(initialStats);
  const [statsLoading, setStatsLoading] = React.useState(false);
  const [statsErr, setStatsErr] = React.useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = React.useState<boolean>(false);

  // קריאת localStorage לאחר מונט בלבד (SSR-safe)
  React.useEffect(() => {
    if (!isBrowser()) return;
    try {
      setAutoRefresh(localStorage.getItem(LS.AUTOR) === "1");
    } catch {}
  }, []);

  const refreshStats = async () => {
    try {
      setStatsLoading(true);
      setStatsErr(null);
      const r = await fetch("/api/admin/date/stats", { cache: "no-store" });
      const j = await r.json().catch(() => null);
      if (!j?.ok) throw new Error(j?.error || "שגיאה בעדכון נתונים");
      setStats(j.stats);
    } catch (e: any) {
      setStatsErr(e?.message || "שגיאה");
    } finally {
      setStatsLoading(false);
    }
  };

  React.useEffect(() => {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(LS.AUTOR, autoRefresh ? "1" : "0");
    } catch {}
  }, [autoRefresh]);

  React.useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(refreshStats, 30_000);
    return () => clearInterval(t);
  }, [autoRefresh]);

  /* ===== סינון/רשימה (טעינה ידנית בלבד) ===== */
  const [q, setQ] = React.useState("");
  const [gender, setGender] = React.useState<Gender>(null);
  const [direction, setDirection] = React.useState<Direction>(null);
  const [country, setCountry] = React.useState<string | null>(null);
  const [withAvatarOnly, setWithAvatarOnly] = React.useState(false);

  // תצוגות שמורות (נטען אחרי מונט בלבד)
  const [views, setViews] = React.useState<Record<string, any>>({});
  const [activeView, setActiveView] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isBrowser()) return;
    try {
      const rawViews = localStorage.getItem(LS.VIEWS);
      setViews(rawViews ? JSON.parse(rawViews) : {});
      setActiveView(localStorage.getItem(LS.VIEW));
    } catch {}
  }, []);

  const saveView = () => {
    const name = prompt("שם לתצוגה (לדוגמה: 'עם תמונה • נשים • ישראל')");
    if (!name) return;
    const next = {
      ...views,
      [name]: { q, gender, direction, country, withAvatarOnly },
    };
    setViews(next);
    if (isBrowser()) {
      try {
        localStorage.setItem(LS.VIEWS, JSON.stringify(next));
        localStorage.setItem(LS.VIEW, name);
      } catch {}
    }
    setActiveView(name);
  };

  const applyView = (name: string) => {
    const v = views[name];
    if (!v) return;
    setQ(v.q || "");
    setGender(v.gender ?? null);
    setDirection(v.direction ?? null);
    setCountry(v.country ?? null);
    setWithAvatarOnly(!!v.withAvatarOnly);
    setActiveView(name);
    if (isBrowser()) {
      try {
        localStorage.setItem(LS.VIEW, name);
      } catch {}
    }
    loadList(true);
  };

  const deleteView = (name: string) => {
    const next = { ...views };
    delete next[name];
    setViews(next);
    if (isBrowser()) {
      try {
        localStorage.setItem(LS.VIEWS, JSON.stringify(next));
      } catch {}
    }
    if (activeView === name) {
      setActiveView(null);
      if (isBrowser()) {
        try {
          localStorage.removeItem(LS.VIEW);
        } catch {}
      }
    }
  };

  // טבלה
  const [rows, setRows] = React.useState<RowItem[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [rowsLoading, setRowsLoading] = React.useState(false);
  const [rowsErr, setRowsErr] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const anySelected = React.useMemo(
    () => Object.values(selected).some(Boolean),
    [selected]
  );

  // עמודות (טוענים אחרי מונט)
  const [cols, setCols] = React.useState<Record<string, boolean>>(DEFAULT_COLS);
  React.useEffect(() => {
    if (!isBrowser()) return;
    try {
      const rawCols = localStorage.getItem(LS.COLS);
      setCols(
        rawCols ? { ...DEFAULT_COLS, ...JSON.parse(rawCols) } : DEFAULT_COLS
      );
    } catch {}
  }, []);
  React.useEffect(() => {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(LS.COLS, JSON.stringify(cols));
    } catch {}
  }, [cols]);

  function toggleCol(key: keyof typeof DEFAULT_COLS) {
    setCols((c) => ({ ...c, [key]: !c[key] }));
  }

  async function loadList(reset = false) {
    if (rowsLoading) return;
    setRowsLoading(true);
    setRowsErr(null);
    try {
      const sp = new URLSearchParams();
      sp.set("limit", String(LIMIT));
      if (!reset && cursor) sp.set("cursor", cursor);
      if (q.trim()) sp.set("q", q.trim());
      if (gender) sp.set("gender", gender);
      if (direction) sp.set("direction", direction);
      if (country) sp.set("country", country!);
      if (withAvatarOnly) sp.set("withAvatar", "1");

      const r = await fetch(`/api/admin/date/list?${sp.toString()}`, {
        cache: "no-store",
      });
      const j = await r.json().catch(() => null);
      if (!j?.ok) throw new Error(j?.error || "שגיאה בטעינה");
      const items: RowItem[] = j.items || [];
      setRows((prev) => (reset ? items : [...prev, ...items]));
      setCursor(j.nextCursor || null);
      setHasMore(Boolean(j.nextCursor));
      setSelected({});
    } catch (e: any) {
      setRowsErr(e?.message || "שגיאה");
    } finally {
      setRowsLoading(false);
    }
  }

  // טעינה ראשונית בלבד
  React.useEffect(() => {
    loadList(true); // eslint-disable-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters() {
    setCursor(null);
    setHasMore(true);
    loadList(true);
  }

  // מיון (קליינט על העמוד הנוכחי)
  type SortKey =
    | "displayName"
    | "email"
    | "gender"
    | "judaism_direction"
    | "country"
    | "city"
    | "updatedAt";
  const [sort, setSort] = React.useState<{
    key: SortKey;
    dir: "asc" | "desc";
  } | null>(null);
  const visibleRows = React.useMemo(() => {
    if (!sort) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const A = String((a as any)[sort.key] ?? "");
      const B = String((b as any)[sort.key] ?? "");
      if (A === B) return 0;
      return sort.dir === "asc" ? (A > B ? 1 : -1) : A < B ? 1 : -1;
    });
    return copy;
  }, [rows, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  /* ===== פעולות ===== */
  async function bulkAction(action: "verify" | "pause" | "unpause" | "block") {
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([id]) => id);
    if (!ids.length) return;
    if (!confirm(`לבצע "${labelAction(action)}" על ${ids.length} פרופיל(ים)?`))
      return;
    for (const id of ids) {
      await doRowAction(id, action, false);
    }
    alert("בוצע.");
  }

  async function doRowAction(
    id: string,
    action: "verify" | "pause" | "unpause" | "block",
    confirmFirst = true
  ) {
    if (confirmFirst && !confirm(`לבצע פעולה: ${labelAction(action)}?`)) return;
    const r = await fetch(`/api/admin/date/profile/${id}/action`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const j = await r.json().catch(() => null);
    if (!j?.ok) {
      alert(j?.error || "שגיאה בביצוע הפעולה");
    }
  }

  function labelAction(a: string) {
    switch (a) {
      case "verify":
        return "אישור";
      case "pause":
        return "השהיה";
      case "unpause":
        return "ביטול השהיה";
      case "block":
        return "חסימה";
      default:
        return a;
    }
  }

  /* ===== יצוא CSV של הדף הנוכחי ===== */
  function toCsv(rows: RowItem[]) {
    const headers = [
      "ID",
      "UserId",
      "Name",
      "Email",
      "Gender",
      "Direction",
      "Country",
      "City",
      "UpdatedAt",
      "AvatarUrl",
    ];
    const lines = [headers.join(",")];
    for (const r of rows) {
      const vals = [
        r._id,
        r.userId || "",
        csv(r.displayName),
        csv(r.email),
        csv(genderName(r.gender ?? null)),
        csv(dirName(r.judaism_direction ?? null)),
        csv(r.country || ""),
        csv(r.city || ""),
        r.updatedAt || "",
        csv(r.avatarUrl || ""),
      ];
      lines.push(vals.join(","));
    }
    return lines.join("\n");
  }
  function downloadCsv() {
    const blob = new Blob([toCsv(visibleRows)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maty-date-profiles-${new Date()
      .toISOString()
      .slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ===== קיצורי דרך ===== */
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        refreshStats();
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (hasMore && !rowsLoading) loadList(false);
      } else if (e.key === "Escape") {
        setOpenId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasMore, rowsLoading]);

  /* ===== מפות ===== */
  function dirName(k: Direction) {
    switch (k) {
      case "orthodox":
        return "אורתודוקסי";
      case "haredi":
        return "חרדי";
      case "chasidic":
        return "חסידי";
      case "modern":
        return "מודרן־אורתודוקסי";
      case "conservative":
        return "קונסרבטיבי";
      case "reform":
        return "רפורמי";
      case "reconstructionist":
        return "רקונסטרוקציוניסטי";
      case "secular":
        return "חילוני";
      default:
        return "לא צוין";
    }
  }
  function genderName(g: Gender) {
    return g === "male"
      ? "זכר"
      : g === "female"
      ? "נקבה"
      : g === "other"
      ? "אחר"
      : "לא צוין";
  }
  function fmtDate(s?: string | null) {
    return s ? new Date(s).toLocaleString("he-IL") : "—";
  }
  const COLORS = [
    "#6D4AFF",
    "#F43F5E",
    "#22C55E",
    "#06B6D4",
    "#F59E0B",
    "#8B5CF6",
    "#14B8A6",
    "#84CC16",
  ];

  // הדגשת טקסט חיפוש
  function Highlight({ text }: { text?: string | null }) {
    const t = text || "";
    const qx = q.trim();
    if (!qx) return <>{t}</>;
    try {
      const rx = new RegExp(qx.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
      const parts = t.split(rx);
      const matches = t.match(rx);
      const out: React.ReactNode[] = [];
      parts.forEach((p, i) => {
        out.push(<span key={`p${i}`}>{p}</span>);
        if (matches && matches[i]) {
          out.push(
            <mark
              key={`m${i}`}
              className="bg-yellow-200/70 dark:bg-yellow-700/40 rounded px-0.5"
            >
              {matches[i]}
            </mark>
          );
        }
      });
      return <>{out}</>;
    } catch {
      return <>{t}</>;
    }
  }

  /* ===== מגירת פרופיל ===== */
  const [openId, setOpenId] = React.useState<string | null>(null);

  /* ===== רנדר ===== */
  return (
    <div className="space-y-8" dir="rtl">
      {/* פס עליון */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={refreshStats}
          className="h-9 rounded-full px-4 text-sm bg-brand text-white hover:opacity-90"
        >
          {statsLoading ? "מרענן…" : "רענון סטטיסטיקות"}
        </button>

        <label className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border border-amber-400/30 dark:border-amber-300/20 bg-white/70 dark:bg-neutral-900/70">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="accent-amber-500"
          />
          רענון אוטומטי (30ש׳)
        </label>

        <button
          onClick={downloadCsv}
          className="h-9 rounded-full px-4 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
          title="ייצוא CSV של הדף הנוכחי"
        >
          יצוא CSV
        </button>

        {statsErr && (
          <span className="text-sm text-red-600">שגיאה: {statsErr}</span>
        )}

        <div className="ms-auto flex items-center gap-2 text-xs opacity-70">
          קיצורי דרך: <kbd className="px-1 rounded border">/</kbd> חיפוש ·{" "}
          <kbd className="px-1 rounded border">R</kbd> רענון ·{" "}
          <kbd className="px-1 rounded border">N</kbd> טען עוד
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Kpi title="סה״כ פרופילים" value={nf(stats.totals.all)} />
        <Kpi title="24 שעות" value={nf(stats.totals.last24h)} />
        <Kpi title="7 ימים" value={nf(stats.totals.last7d)} />
        <Kpi title="30 ימים" value={nf(stats.totals.last30d)} />
        <Kpi
          title="עם תמונה"
          value={`${nf(stats.totals.withAvatar)} (${
            stats.totals.all
              ? Math.round((stats.totals.withAvatar * 100) / stats.totals.all)
              : 0
          }%)`}
        />
        <Kpi
          title="ממוצע השלמה"
          value={`${Math.round(stats.totals.avgCompleteness)}%`}
        />
      </div>

      {/* גרפים */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="מגדר">
          <ChartOrEmpty
            ok={(stats.byGender || []).length > 0}
            render={() => (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={(stats.byGender || []).map((g) => ({
                      ...g,
                      name: genderName(g.key),
                    }))}
                    dataKey="count"
                    nameKey="name"
                    outerRadius={90}
                    label={(e: any) => `${e.name} (${e.count})`}
                  >
                    {(stats.byGender || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RcTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          />
        </Card>

        <Card title="זרם ביהדות">
          <ChartOrEmpty
            ok={(stats.byDirection || []).length > 0}
            render={() => (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={(stats.byDirection || []).map((d) => ({
                    ...d,
                    name: dirName(d.key),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <RcTooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          />
        </Card>

        <Card title="התפלגות גילאים">
          <ChartOrEmpty
            ok={(stats.ageBuckets || []).length > 0}
            render={() => (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.ageBuckets || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="key" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <RcTooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          />
        </Card>
      </div>

      {/* מסננים ותצוגות */}
      <Card title="מסננים ותצוגות">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={searchRef}
            dir="rtl"
            className="h-10 rounded-full border px-3 text-sm border-amber-400/40 dark:border-amber-300/20 bg-white/80 dark:bg-neutral-900/70 min-w-[220px]"
            placeholder="חיפוש: שם / אימייל / עיר / מדינה"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
          <select
            value={gender || ""}
            onChange={(e) => setGender((e.target.value || null) as Gender)}
            className="h-10 rounded-full border px-3 text-sm border-amber-400/40 dark:border-amber-300/20 bg-white/80 dark:bg-neutral-900/70"
          >
            <option value="">כל המגדרים</option>
            <option value="male">זכר</option>
            <option value="female">נקבה</option>
            <option value="other">אחר</option>
          </select>
          <select
            value={direction || ""}
            onChange={(e) =>
              setDirection((e.target.value || null) as Direction)
            }
            className="h-10 rounded-full border px-3 text-sm border-amber-400/40 dark:border-amber-300/20 bg-white/80 dark:bg-neutral-900/70"
          >
            <option value="">כל הזרמים</option>
            <option value="orthodox">אורתודוקסי</option>
            <option value="haredi">חרדי</option>
            <option value="chasidic">חסידי</option>
            <option value="modern">מודרן־אורתודוקסי</option>
            <option value="conservative">קונסרבטיבי</option>
            <option value="reform">רפורמי</option>
            <option value="reconstructionist">רקונסטרוקציוניסטי</option>
            <option value="secular">חילוני</option>
          </select>
          <input
            value={country ?? ""}
            onChange={(e) => setCountry(e.target.value || null)}
            placeholder="מדינה…"
            className="h-10 rounded-full border px-3 text-sm border-amber-400/40 dark:border-amber-300/20 bg-white/80 dark:bg-neutral-900/70 min-w-[150px]"
          />
          <label className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border border-amber-400/30 dark:border-amber-300/20 bg-white/70 dark:bg-neutral-900/70">
            <input
              type="checkbox"
              className="accent-amber-500"
              checked={withAvatarOnly}
              onChange={(e) => setWithAvatarOnly(e.target.checked)}
            />
            רק עם תמונה
          </label>

          <div className="ms-auto flex items-center gap-2">
            <button
              onClick={applyFilters}
              className="h-9 rounded-full px-4 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
            >
              החל סינון
            </button>
            <button
              onClick={() => {
                setQ("");
                setGender(null);
                setDirection(null);
                setCountry(null);
                setWithAvatarOnly(false);
                setActiveView(null);
                if (isBrowser()) {
                  try {
                    localStorage.removeItem(LS.VIEW);
                  } catch {}
                }
                loadList(true);
              }}
              className="h-9 rounded-full px-4 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
            >
              איפוס
            </button>
            <button
              onClick={saveView}
              className="h-9 rounded-full px-4 text-sm bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            >
              שמור תצוגה
            </button>
          </div>
        </div>

        {/* תצוגות שמורות */}
        {Object.keys(views).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.keys(views).map((name) => (
              <span
                key={name}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                  activeView === name
                    ? "border-amber-400/60 bg-amber-50/60 dark:bg-amber-900/20"
                    : "border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70",
                ].join(" ")}
              >
                <button
                  onClick={() => applyView(name)}
                  className="underline decoration-dotted"
                >
                  {name}
                </button>
                <button
                  onClick={() => deleteView(name)}
                  className="opacity-60 hover:opacity-100"
                  title="מחק תצוגה"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* טבלה מתקדמת */}
      <Card title="פרופילים (20 בכל טעינה)">
        {/* שליטה בעמודות + פעולות גורפות */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <ColToggle
              label="תמונה"
              on={cols.avatar}
              onClick={() => toggleCol("avatar")}
            />
            <ColToggle
              label="שם"
              on={cols.displayName}
              onClick={() => toggleCol("displayName")}
            />
            <ColToggle
              label="אימייל"
              on={cols.email}
              onClick={() => toggleCol("email")}
            />
            <ColToggle
              label="מגדר"
              on={cols.gender}
              onClick={() => toggleCol("gender")}
            />
            <ColToggle
              label="זרם"
              on={cols.direction}
              onClick={() => toggleCol("direction")}
            />
            <ColToggle
              label="מיקום"
              on={cols.location}
              onClick={() => toggleCol("location")}
            />
            <ColToggle
              label="עודכן"
              on={cols.updatedAt}
              onClick={() => toggleCol("updatedAt")}
            />
            <ColToggle
              label="UserId"
              on={cols.userId}
              onClick={() => toggleCol("userId")}
            />
          </div>

          <div className="ms-auto flex items-center gap-2">
            <button
              disabled={!anySelected}
              onClick={() => bulkAction("verify")}
              className="h-8 rounded-full px-3 text-xs border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-900/20 disabled:opacity-50"
            >
              אשר נבחרים
            </button>
            <button
              disabled={!anySelected}
              onClick={() => bulkAction("pause")}
              className="h-8 rounded-full px-3 text-xs border border-amber-500/40 bg-amber-50/70 dark:bg-amber-900/20 disabled:opacity-50"
            >
              השהה נבחרים
            </button>
            <button
              disabled={!anySelected}
              onClick={() => bulkAction("unpause")}
              className="h-8 rounded-full px-3 text-xs border border-amber-500/40 bg-amber-50/70 dark:bg-amber-900/20 disabled:opacity-50"
            >
              בטל השהיית נבחרים
            </button>
            <button
              disabled={!anySelected}
              onClick={() => bulkAction("block")}
              className="h-8 rounded-full px-3 text-xs border border-red-500/40 bg-red-50/70 dark:bg-red-900/20 disabled:opacity-50"
            >
              חסום נבחרים
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-black/5 dark:border-white/5">
          <table className="min-w-[960px] w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-black/5 dark:bg-white/5 text-right">
                <Th className="w-10">
                  <input
                    type="checkbox"
                    aria-label="בחר הכל"
                    checked={
                      rows.length > 0 && rows.every((r) => selected[r._id])
                    }
                    onChange={(e) => {
                      const on = e.target.checked;
                      const next: Record<string, boolean> = {};
                      rows.forEach((r) => (next[r._id] = on));
                      setSelected(next);
                    }}
                  />
                </Th>

                {cols.avatar && <Th className="w-12">תמונה</Th>}
                {cols.displayName && (
                  <ThSort
                    onClick={() => toggleSort("displayName")}
                    active={sort?.key === "displayName"}
                    dir={sort?.dir}
                  >
                    שם
                  </ThSort>
                )}
                {cols.email && (
                  <ThSort
                    onClick={() => toggleSort("email")}
                    active={sort?.key === "email"}
                    dir={sort?.dir}
                  >
                    אימייל
                  </ThSort>
                )}
                {cols.gender && (
                  <ThSort
                    onClick={() => toggleSort("gender")}
                    active={sort?.key === "gender"}
                    dir={sort?.dir}
                  >
                    מגדר
                  </ThSort>
                )}
                {cols.direction && (
                  <ThSort
                    onClick={() => toggleSort("judaism_direction")}
                    active={sort?.key === "judaism_direction"}
                    dir={sort?.dir}
                  >
                    זרם
                  </ThSort>
                )}
                {cols.location && (
                  <ThSort
                    onClick={() => toggleSort("country")}
                    active={sort?.key === "country"}
                    dir={sort?.dir}
                  >
                    מיקום
                  </ThSort>
                )}
                {cols.updatedAt && (
                  <ThSort
                    onClick={() => toggleSort("updatedAt")}
                    active={sort?.key === "updatedAt"}
                    dir={sort?.dir}
                  >
                    עודכן
                  </ThSort>
                )}
                {cols.userId && <Th>UserId</Th>}
                <Th className="w-44">פעולות</Th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => (
                <tr
                  key={r._id}
                  className="border-t border-black/10 dark:border-white/10 hover:bg-amber-50/40 dark:hover:bg-amber-900/10"
                >
                  <Td className="w-10">
                    <input
                      type="checkbox"
                      checked={!!selected[r._id]}
                      onChange={(e) =>
                        setSelected((s) => ({
                          ...s,
                          [r._id]: e.target.checked,
                        }))
                      }
                    />
                  </Td>

                  {cols.avatar && (
                    <Td className="w-12">
                      {r.avatarUrl ? (
                        <img
                          src={r.avatarUrl}
                          alt={r.displayName || "avatar"}
                          className="h-7 w-7 rounded-full object-cover border border-black/10 dark:border-white/10"
                          onError={(e) =>
                            ((
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none")
                          }
                        />
                      ) : (
                        <span className="block h-7 w-7 rounded-full bg-black/10 dark:bg-white/10" />
                      )}
                    </Td>
                  )}

                  {cols.displayName && (
                    <Td>
                      <div className="truncate max-w-[220px]">
                        <Highlight text={r.displayName || "—"} />
                      </div>
                    </Td>
                  )}

                  {cols.email && (
                    <Td className="ltr">
                      {r.email ? (
                        <span className="inline-flex items-center gap-2">
                          <a
                            className="underline decoration-dotted"
                            href={`mailto:${r.email}`}
                          >
                            <Highlight text={r.email} />
                          </a>
                          <button
                            className="text-xs opacity-60 hover:opacity-100"
                            title="העתק אימייל"
                            onClick={() =>
                              navigator.clipboard.writeText(r.email!)
                            }
                          >
                            העתק
                          </button>
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                  )}

                  {cols.gender && <Td>{genderName(r.gender ?? null)}</Td>}

                  {cols.direction && (
                    <Td>{dirName(r.judaism_direction ?? null)}</Td>
                  )}

                  {cols.location && (
                    <Td>
                      <Highlight
                        text={
                          [r.city, r.country].filter(Boolean).join(", ") || "—"
                        }
                      />
                    </Td>
                  )}

                  {cols.updatedAt && (
                    <Td className="ltr">{fmtDate(r.updatedAt)}</Td>
                  )}

                  {cols.userId && <Td className="ltr">{r.userId || "—"}</Td>}

                  <Td className="w-44">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setOpenId(r._id)}
                        className="h-8 rounded-full px-3 text-xs border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        פרטים
                      </button>
                      <button
                        onClick={() => doRowAction(r._id, "verify")}
                        className="h-8 rounded-full px-3 text-xs border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-900/20"
                      >
                        אשר
                      </button>
                      <button
                        onClick={() => doRowAction(r._id, "pause")}
                        className="h-8 rounded-full px-3 text-xs border border-amber-500/40 bg-amber-50/70 dark:bg-amber-900/20"
                      >
                        השהה
                      </button>
                      <button
                        onClick={() => doRowAction(r._id, "block")}
                        className="h-8 rounded-full px-3 text-xs border border-red-500/40 bg-red-50/70 dark:bg-red-900/20"
                      >
                        חסום
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}

              {rowsLoading && (
                <tr>
                  <td colSpan={99} className="py-6 text-center opacity-70">
                    טוען…
                  </td>
                </tr>
              )}
              {rowsErr && !rowsLoading && (
                <tr>
                  <td colSpan={99} className="py-6 text-center text-red-600">
                    {rowsErr}
                  </td>
                </tr>
              )}
              {!rowsErr && !rowsLoading && visibleRows.length === 0 && (
                <tr>
                  <td colSpan={99} className="py-6 text-center opacity-60">
                    אין נתונים.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* טעינה ידנית בלבד */}
        <div className="mt-3 flex justify-center gap-2">
          <button
            disabled={rowsLoading}
            className="h-9 rounded-full px-4 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
            onClick={() => loadList(true)}
            title="טען מחדש את העמוד הנוכחי"
          >
            רענן עמוד
          </button>
          {hasMore ? (
            <button
              disabled={rowsLoading}
              className="h-9 rounded-full px-4 text-sm bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 disabled:opacity-50"
              onClick={() => loadList(false)}
              title={`טען עוד ${LIMIT}`}
            >
              {rowsLoading ? "טוען…" : `טען עוד (${LIMIT})`}
            </button>
          ) : (
            <div className="text-xs opacity-60 self-center">
              הגעת לסוף הרשימה
            </div>
          )}
        </div>
      </Card>

      {/* מגירת פרופיל מלאה */}
      <ProfileDrawer id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

/* ===== UI קטנים ===== */
function Kpi({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/80 dark:bg-neutral-900/70">
      <div className="text-sm opacity-70">{title}</div>
      <div className="mt-1 text-2xl font-extrabold tabular-nums">{value}</div>
    </div>
  );
}
function Card({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/80 dark:bg-neutral-900/70">
      <div className="font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}
function Th({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th className={`text-right p-2 font-semibold ${className || ""}`}>
      {children}
    </th>
  );
}
function ThSort({
  children,
  active,
  dir,
  onClick,
  className,
}: React.PropsWithChildren<{
  active?: boolean;
  dir?: "asc" | "desc";
  onClick?: () => void;
  className?: string;
}>) {
  return (
    <Th className={className}>
      <button
        className={[
          "inline-flex items-center gap-1",
          active ? "underline decoration-dotted" : "",
        ].join(" ")}
        onClick={onClick}
        type="button"
      >
        {children}
        {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
      </button>
    </Th>
  );
}
function Td({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`p-2 align-middle ${className || ""}`}>{children}</td>;
}
function ColToggle({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "h-8 rounded-full px-3 text-xs border",
        on
          ? "border-amber-500/50 bg-amber-50/60 dark:bg-amber-900/20"
          : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
function ChartOrEmpty({
  ok,
  render,
}: {
  ok: boolean;
  render: () => React.ReactNode;
}) {
  if (!ok) return <div className="text-sm opacity-60">אין נתונים.</div>;
  return <>{render()}</>;
}

/* ===== מגירת פרופיל ===== */
function ProfileDrawer({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [data, setData] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const r = await fetch(
          `/api/admin/date/profile?id=${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );
        const j = await r.json().catch(() => null);
        if (!j?.ok) throw new Error(j?.error || "שגיאה");
        setData(j.item);
      } catch (e: any) {
        setErr(e?.message || "שגיאה");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (id) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [id, onClose]);

  if (!id) return null;

  const fmt = (d: any) => (d ? new Date(d).toLocaleString("he-IL") : "—");
  const mapGender = (g: any) =>
    g === "male"
      ? "זכר"
      : g === "female"
      ? "נקבה"
      : g === "other"
      ? "אחר"
      : "לא צוין";
  const mapDir = (d: any) => {
    switch (d) {
      case "orthodox":
        return "אורתודוקסי";
      case "haredi":
        return "חרדי";
      case "chasidic":
        return "חסידי";
      case "modern":
        return "מודרן־אורתודוקסי";
      case "conservative":
        return "קונסרבטיבי";
      case "reform":
        return "רפורמי";
      case "reconstructionist":
        return "רקונסטרוקציוניסטי";
      case "secular":
        return "חילוני";
      default:
        return "לא צוין";
    }
  };

  // אינדקס השלמה – בטוח גם אם השדות מחרוזת
  const completenessFields = [
    "displayName",
    "birthDate",
    "gender",
    "country",
    "city",
    "languages",
    "judaism_direction",
    "kashrut_level",
    "shabbat_level",
    "goals",
    "about_me",
    "avatarUrl",
  ];
  const present = completenessFields.reduce((acc, f) => {
    const v = (data as any)?.[f];
    const has = Array.isArray(v)
      ? v.length > 0
      : v != null && String(v).trim() !== "";
    return acc + (has ? 1 : 0);
  }, 0);
  const percent = Math.round((present / completenessFields.length) * 100);

  async function call(action: "verify" | "pause" | "unpause" | "block") {
    const r = await fetch(`/api/admin/date/profile/${data._id}/action`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const j = await r.json().catch(() => null);
    if (!j?.ok) alert(j?.error || "שגיאה");
    else alert("בוצע.");
  }

  return (
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="absolute right-0 top-0 h-[100dvh] w-[92%] sm:w-[560px] bg-white dark:bg-neutral-950 shadow-2xl border-l border-black/10 dark:border-white/10 p-4 overflow-y-auto"
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-extrabold">פרטי פרופיל</div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-md border border-black/10 dark:border-white/10"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>

        {loading && <div className="opacity-70">טוען…</div>}
        {err && <div className="text-red-600">{err}</div>}
        {data && (
          <div className="space-y-4">
            {/* כרטיס עליון */}
            <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/80 dark:bg-neutral-900/70">
              <div className="flex items-center gap-4">
                {data.avatarUrl ? (
                  <img
                    src={data.avatarUrl}
                    alt={data.displayName || "avatar"}
                    className="h-16 w-16 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-black/10 dark:bg-white/10" />
                )}
                <div className="min-w-0">
                  <div className="text-xl font-extrabold truncate">
                    {data.displayName || "—"}
                  </div>
                  <div className="text-sm opacity-70 truncate ltr">
                    {data.email || "—"}
                  </div>
                  <div className="text-xs opacity-60 mt-1">
                    עודכן: {fmt(data.updatedAt)} · נוצר: {fmt(data.createdAt)} ·
                    ID: {data._id}
                  </div>
                </div>
                <div className="ms-auto grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => call("verify")}
                    className="h-8 rounded-full px-3 text-xs border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-900/20"
                  >
                    אשר
                  </button>
                  <button
                    onClick={() => call("pause")}
                    className="h-8 rounded-full px-3 text-xs border border-amber-500/40 bg-amber-50/70 dark:bg-amber-900/20"
                  >
                    השהה
                  </button>
                  <button
                    onClick={() => call("unpause")}
                    className="h-8 rounded-full px-3 text-xs border border-amber-500/40 bg-amber-50/70 dark:bg-amber-900/20"
                  >
                    בטל השהיה
                  </button>
                  <button
                    onClick={() => call("block")}
                    className="h-8 rounded-full px-3 text-xs border border-red-500/40 bg-red-50/70 dark:bg-red-900/20"
                  >
                    חסום
                  </button>
                </div>
              </div>
            </div>

            {/* מדד השלמה */}
            <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/80 dark:bg-neutral-900/70">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14">
                  <svg viewBox="0 0 36 36" className="h-14 w-14">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity="0.15"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${percent}, 100`}
                      transform="rotate(-90 18 18)"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm opacity-70">מדד השלמת פרופיל</div>
                  <div className="text-2xl font-extrabold">{percent}%</div>
                  <div className="text-xs opacity-60">
                    {present} / {completenessFields.length} שדות מלאים
                  </div>
                </div>
              </div>
            </div>

            {/* פרטים */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card title="פרטים כלליים">
                <Row k="מגדר" v={mapGender(data.gender)} />
                <Row k="זרם" v={mapDir(data.judaism_direction)} />
                <Row k="תאריך לידה" v={data.birthDate || "—"} />
                <Row k="טלפון" v={data.phone || "—"} />
                <Row k="מדינה" v={data.country || "—"} />
                <Row k="עיר" v={data.city || "—"} />
                <Row k="שפות" v={arrify(data.languages).join(", ") || "—"} />
              </Card>

              <Card title="דת/אורח חיים">
                <Row k="כשרות" v={data.kashrut_level || "—"} />
                <Row k="שבת" v={data.shabbat_level || "—"} />
                <Row k="מטרות" v={arrify(data.goals).join(", ") || "—"} />
                <Row k="על עצמי" v={data.about_me || "—"} />
              </Card>

              <Card title="מערכת">
                <Row k="User ID" v={data.userId || "—"} />
                <Row k="סטטוס" v={data.status || "—"} />
                <Row
                  k="מאומת"
                  v={data.verifiedAt ? `כן (${fmt(data.verifiedAt)})` : "לא"}
                />
                <Row k="מושהה" v={data.paused ? "כן" : "לא"} />
                <Row k="סימונים" v={arrify(data.flags).join(", ") || "—"} />
              </Card>

              <Card title="קישורים מהירים">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    className="h-9 rounded-full px-4 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 ltr"
                    href={`mailto:${data.email ?? ""}`}
                  >
                    שליחת אימייל
                  </a>
                  {data.phone && (
                    <a
                      className="h-9 rounded-full px-4 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 ltr"
                      href={`tel:${data.phone}`}
                    >
                      חיוג
                    </a>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs opacity-60">{k}</div>
      <div className="font-medium break-words">{v}</div>
    </div>
  );
}
