// src/app/(admin)/songs/manage/admin/page.tsx


"use client";

import * as React from "react";

/**
 * AdminExecutiveDashboard.tsx
 * -----------------------------------------------------------
 * פאנל מנהלים משודרג: KPIs, תרשימי SVG (דונאט/ספרקליין), פילטרים,
 * חיפוש/מיון/עימוד, ייצוא CSV, הדפסה, רענון אוטומטי, קיצורי־מקלדת,
 * תצוגת RTL מלאה, לוגיקת מגמות, ו־UX נקי למוביל ודסקטופ.
 * אין תלות בספריות חיצוניות (שימוש ב-Tailwind + SVG).
 * -----------------------------------------------------------
 */

/* =========================== Types & Data =========================== */

type MetricPayload = {
  totals: {
    profiles: number;
    new7d: number;
    updated24h: number;
    online10m: number;
    avgAge: number | null;
  };
  byGender: { key: string; count: number }[];
  byDirection: { key: string; count: number }[];
  byGoal: { key: string; count: number }[];
  topCities: { key: string; count: number }[];
  recent: {
    userId: string;
    displayName: string | null;
    city: string | null;
    country: string | null;
    birthDate: string | null; // YYYY-MM-DD
    judaism_direction: string | null;
    goals: string | null;
    updatedAt: string | null; // ISO
  }[];
};

type Metric = Awaited<ReturnType<typeof fetchMetrics>>;

async function fetchMetrics(signal?: AbortSignal) {
  const r = await fetch("/api/admin/metrics", {
    cache: "no-store",
    headers: { "x-maty-admin": "1" },
    signal,
  });
  let j: any = null;
  try {
    j = await r.json();
  } catch {
    /* ignore */
  }
  if (!r.ok || !j?.ok) {
    throw new Error(j?.error || `HTTP ${r.status}`);
  }
  return j as { ok: true; data: MetricPayload };
}

/* =========================== Utils =========================== */

const fmt = new Intl.NumberFormat("he-IL");
const fmtCompact = new Intl.NumberFormat("he-IL", { notation: "compact" });
const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function useLocalStorage<T>(key: string, initial: T) {
  const [val, setVal] = React.useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(val));
    } catch {
      /* ignore */
    }
  }, [key, val]);
  return [val, setVal] as const;
}

function useInterval(cb: () => void, ms: number | null) {
  const ref = React.useRef(cb);
  ref.current = cb;
  React.useEffect(() => {
    if (ms == null) return;
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

function downloadBlob(filename: string, content: string, type = "text/csv") {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function copyText(s: string) {
  void navigator.clipboard.writeText(s);
}

/* =========================== Derived Analytics =========================== */

/** מפיק סדרת זמן יומית מה־recent (עדכונים אחרונים) */
function buildDailySeries(
  recent: MetricPayload["recent"],
  days: number
): { date: string; count: number }[] {
  const today = new Date();
  const map = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    map.set(fmtDate(d), 0);
  }
  for (const r of recent || []) {
    if (!r.updatedAt) continue;
    const d = fmtDate(new Date(r.updatedAt));
    if (map.has(d)) map.set(d, (map.get(d) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** חישוב מגמה פשוט (אחוז שינוי) בין חלונות */
function percentChange(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/* =========================== Small Primitives =========================== */

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={classNames(
        "animate-pulse rounded-xl bg-black/[0.06] dark:bg-white/[0.08]",
        className
      )}
    />
  );
}

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "danger" | "warning" | "muted";
}) {
  const palette =
    tone === "success"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
      : tone === "danger"
      ? "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300"
      : tone === "warning"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
      : tone === "muted"
      ? "bg-black/5 text-black/70 dark:bg-white/5 dark:text-white/70"
      : "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300";
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        palette
      )}
    >
      {children}
    </span>
  );
}

function Icon({
  name,
  className = "",
  title,
}: {
  name: string;
  className?: string;
  title?: string;
}) {
  const icons: Record<string, string> = {
    refresh: "↻",
    download: "⬇︎",
    print: "🖨️",
    search: "🔎",
    pause: "⏸",
    play: "▶️",
    up: "▲",
    down: "▼",
    flat: "◆",
    kpi: "📊",
    clock: "⏱️",
    user: "👤",
    city: "🏙️",
    target: "🎯",
    shield: "🛡️",
    map: "🗺️",
    gear: "⚙️",
    bell: "🔔",
  };
  return (
    <span className={className} title={title} aria-hidden>
      {icons[name] ?? "•"}
    </span>
  );
}

/* =========================== Charts (SVG) =========================== */

/** Sparkline (inline SVG) */
function Sparkline({
  values,
  height = 38,
  strokeWidth = 2,
  className = "",
  showArea = true,
}: {
  values: number[];
  height?: number;
  strokeWidth?: number;
  className?: string;
  showArea?: boolean;
}) {
  const width = Math.max(values.length * 8, 80);
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);
  const points = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * (width - 4) + 2;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  const path = points
    .map((p, i) => (i === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`))
    .join(" ");

  const area =
    points.length > 1
      ? `${path} L ${points[points.length - 1][0]},${height - 2} L ${
          points[0][0]
        },${height - 2} Z`
      : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={classNames("w-full", className)}
      aria-hidden
    >
      {showArea && points.length > 1 && (
        <path d={area} className="fill-violet-500/15" />
      )}
      <path
        d={path}
        className="stroke-violet-500"
        strokeWidth={strokeWidth}
        fill="none"
      />
    </svg>
  );
}

/** Donut chart (SVG) */
function DonutChart({
  data,
  size = 148,
  thickness = 16,
  legend = true,
  unit = "",
}: {
  data: { key: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
  legend?: boolean;
  unit?: string;
}) {
  const total = Math.max(
    1,
    data.reduce((a, b) => a + (b.value || 0), 0)
  );
  const r = size / 2;
  const inner = r - thickness;
  const C = 2 * Math.PI * inner;
  let acc = 0;
  const palette = [
    "#7c3aed",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#84cc16",
    "#e879f9",
    "#fb923c",
    "#10b981",
    "#60a5fa",
  ];

  return (
    <div className="flex gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        <circle
          cx={r}
          cy={r}
          r={inner}
          className="fill-none stroke-black/10 dark:stroke-white/10"
          strokeWidth={thickness}
        />
        {data.map((d, i) => {
          const frac = d.value / total;
          const len = frac * C;
          const dasharray = `${len} ${C - len}`;
          const dashoffset = -acc * C;
          acc += frac;
          return (
            <circle
              key={d.key + i}
              cx={r}
              cy={r}
              r={inner}
              stroke={d.color || palette[i % palette.length]}
              strokeWidth={thickness}
              fill="none"
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
            />
          );
        })}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-current text-xl font-extrabold"
        >
          {fmtCompact.format(total)}
          {unit}
        </text>
      </svg>
      {legend && (
        <div className="grid content-start gap-2 text-sm">
          {data.map((d, i) => (
            <div key={d.key + i} className="flex items-center gap-2">
              <span
                className="inline-block size-3 rounded"
                style={{ background: d.color || palette[i % palette.length] }}
              />
              <span className="truncate">{d.key}</span>
              <span className="ms-auto tabular-nums">
                {fmt.format(d.value)}
              </span>
              <span className="opacity-60 text-[11px]">
                ({Math.round((d.value / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================== Table (search/sort/paginate) =========================== */

type SortKey = "name" | "loc" | "dir" | "goal" | "age" | "updated";
type SortDir = "asc" | "desc";

function useSearchSortPaginate(rows: MetricPayload["recent"]) {
  const [query, setQuery] = useLocalStorage<string>("admin:search", "");
  const [sortKey, setSortKey] = useLocalStorage<SortKey>(
    "admin:sortKey",
    "updated"
  );
  const [sortDir, setSortDir] = useLocalStorage<SortDir>(
    "admin:sortDir",
    "desc"
  );
  const [page, setPage] = useLocalStorage<number>("admin:page", 1);
  const [pageSize, setPageSize] = useLocalStorage<number>("admin:pageSize", 15);

  const norm = (s?: string | null) => (s || "").toLowerCase();

  const filtered = React.useMemo(() => {
    const q = norm(query);
    if (!q) return rows || [];
    return (rows || []).filter((r) => {
      const pile = [
        r.displayName,
        r.city,
        r.country,
        r.judaism_direction,
        r.goals,
        r.userId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return pile.includes(q);
    });
  }, [rows, query]);

  function ageOf(birthDate: string | null) {
    if (!birthDate) return null;
    const now = new Date();
    const y = parseInt(birthDate.slice(0, 4), 10);
    let a = now.getFullYear() - y;
    const mmdd = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    if (birthDate.slice(5) > mmdd) a -= 1;
    return a;
  }

  const sorted = React.useMemo(() => {
    const out = [...filtered];
    const mul = sortDir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return mul * norm(a.displayName).localeCompare(norm(b.displayName));
        case "loc":
          return (
            mul *
            norm(`${a.city},${a.country}`).localeCompare(
              norm(`${b.city},${b.country}`)
            )
          );
        case "dir":
          return (
            mul *
            norm(a.judaism_direction).localeCompare(norm(b.judaism_direction))
          );
        case "goal":
          return mul * norm(a.goals).localeCompare(norm(b.goals));
        case "age":
          return (
            mul * ((ageOf(a.birthDate) ?? -1) - (ageOf(b.birthDate) ?? -1))
          );
        case "updated":
        default:
          return (
            mul *
            (new Date(a.updatedAt || 0).getTime() -
              new Date(b.updatedAt || 0).getTime())
          );
      }
    });
    return out;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = React.useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize]
  );

  function onHeaderClick(k: SortKey) {
    setPage(1);
    if (sortKey === k) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  return {
    query,
    setQuery,
    sortKey,
    sortDir,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    rows: pageRows,
    allRows: sorted,
    onHeaderClick,
  };
}

/* =========================== KPI Cards =========================== */

function TrendBadge({ change }: { change: number | null }) {
  if (change == null)
    return (
      <Badge tone="muted">
        <Icon name="flat" className="me-1" />—
      </Badge>
    );
  if (change > 0)
    return (
      <Badge tone="success">
        <Icon name="up" className="me-1" />
        {Math.round(change)}%
      </Badge>
    );
  if (change < 0)
    return (
      <Badge tone="danger">
        <Icon name="down" className="me-1" />
        {Math.round(Math.abs(change))}%
      </Badge>
    );
  return (
    <Badge tone="muted">
      <Icon name="flat" className="me-1" />
      0%
    </Badge>
  );
}

function KPI({
  icon,
  label,
  value,
  sub,
  change,
  loading,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  change?: number | null;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 p-4">
      <div className="flex items-center gap-2 text-sm opacity-80">
        <Icon name={icon} />
        <span>{label}</span>
        <div className="ms-auto">
          {change !== undefined ? <TrendBadge change={change ?? null} /> : null}
        </div>
      </div>
      <div className="mt-1 text-3xl font-extrabold">
        {loading ? <Skeleton className="h-8 w-24" /> : value}
      </div>
      {sub && <div className="mt-1 text-xs opacity-70">{sub}</div>}
    </div>
  );
}

/* =========================== Toolbar & Filters =========================== */

type Range = 7 | 14 | 30 | 90;

function Toolbar({
  loading,
  lastUpdatedAt,
  autoMs,
  setAutoMs,
  onRefresh,
  range,
  setRange,
  query,
  setQuery,
  onExportCSV,
  onPrint,
}: {
  loading: boolean;
  lastUpdatedAt: Date | null;
  autoMs: number | null;
  setAutoMs: (ms: number | null) => void;
  onRefresh: () => void;
  range: Range;
  setRange: (r: Range) => void;
  query: string;
  setQuery: (s: string) => void;
  onExportCSV: () => void;
  onPrint: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 p-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
          title="רענון (R)"
        >
          <Icon name="refresh" /> רענון
        </button>
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
            title="תדירות רענון"
          >
            <Icon name={autoMs ? "play" : "pause"} />
            {autoMs ? `${autoMs / 1000}s` : "מופסק"}
          </button>
          {open && (
            <div className="absolute z-10 mt-2 w-40 rounded-xl border bg-white/95 dark:bg-neutral-900/95 p-2 shadow">
              {[0, 15_000, 30_000, 60_000, 120_000].map((ms) => (
                <button
                  key={ms}
                  onClick={() => {
                    setAutoMs(ms || null);
                    setOpen(false);
                  }}
                  className={classNames(
                    "block w-full rounded-lg px-3 py-1.5 text-right text-sm hover:bg-black/5 dark:hover:bg-white/5",
                    ms === (autoMs || 0) && "bg-black/5 dark:bg-white/5"
                  )}
                >
                  {ms ? `${ms / 1000}s` : "ללא"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ms-auto flex items-center gap-2">
        <div className="relative">
          <Icon name="search" className="absolute end-3 top-2.5 opacity-60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש בפרופילים (/)…"
            className="h-9 w-56 rounded-xl border bg-transparent pe-9 ps-3 text-sm outline-none"
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl border px-1.5 py-1">
          {[7, 14, 30, 90].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r as Range)}
              className={classNames(
                "rounded-lg px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/5",
                r === range && "bg-black/5 dark:bg-white/5 font-bold"
              )}
            >
              {r} ימים
            </button>
          ))}
        </div>

        <button
          onClick={onExportCSV}
          className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
          title="ייצוא CSV (E)"
        >
          <Icon name="download" /> ייצוא
        </button>
        <button
          onClick={onPrint}
          className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
          title="הדפסה (P)"
        >
          <Icon name="print" /> הדפס
        </button>
      </div>

      <div className="w-full text-[11px] opacity-70">
        <Icon name="clock" /> עדכון אחרון:{" "}
        {lastUpdatedAt ? lastUpdatedAt.toLocaleString("he-IL") : "—"}
      </div>
    </div>
  );
}

/* =========================== Panels & Cards =========================== */

function StatGroup({
  loading,
  totals,
  dailySeries,
  prevWindowSum,
}: {
  loading: boolean;
  totals: MetricPayload["totals"] | null;
  dailySeries: { date: string; count: number }[];
  prevWindowSum: number | null;
}) {
  const currentSum = dailySeries.reduce((a, b) => a + b.count, 0);
  const change =
    prevWindowSum != null ? percentChange(currentSum, prevWindowSum) : null;

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KPI
        icon="kpi"
        label="סה״כ פרופילים"
        value={loading ? "…" : fmt.format(totals?.profiles ?? 0)}
      />
      <KPI
        icon="shield"
        label="חדשים 7 ימים"
        value={loading ? "…" : fmt.format(totals?.new7d ?? 0)}
      />
      <KPI
        icon="gear"
        label="עודכנו 24ש׳"
        value={loading ? "…" : fmt.format(totals?.updated24h ?? 0)}
      />
      <KPI
        icon="bell"
        label="מחוברים (≈10ד׳)"
        value={loading ? "…" : fmt.format(totals?.online10m ?? 0)}
        change={null}
      />
      <KPI
        icon="user"
        label="גיל ממוצע"
        value={loading ? "…" : totals?.avgAge ?? "—"}
        change={change}
        sub={
          <div className="mt-2">
            <Sparkline values={dailySeries.map((d) => d.count)} />
          </div>
        }
      />
    </div>
  );
}

function DistributionCards({
  loading,
  byGender,
  byDirection,
  byGoal,
}: {
  loading: boolean;
  byGender: MetricPayload["byGender"];
  byDirection: MetricPayload["byDirection"];
  byGoal: MetricPayload["byGoal"];
}) {
  const genderDonut = (byGender || []).map((x, i) => ({
    key: x.key,
    value: x.count,
  }));
  const dirDonut = (byDirection || []).map((x) => ({
    key: x.key,
    value: x.count,
  }));
  const goalDonut = (byGoal || []).map((x) => ({ key: x.key, value: x.count }));

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 p-4">
        <div className="mb-3 font-bold">פילוח לפי מין</div>
        {loading ? (
          <Skeleton className="h-40" />
        ) : (
          <DonutChart data={genderDonut} />
        )}
      </div>
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 p-4">
        <div className="mb-3 font-bold">זרם ביהדות</div>
        {loading ? (
          <Skeleton className="h-40" />
        ) : (
          <DonutChart data={dirDonut} />
        )}
      </div>
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 p-4">
        <div className="mb-3 font-bold">מטרות היכרות</div>
        {loading ? (
          <Skeleton className="h-40" />
        ) : (
          <DonutChart data={goalDonut} />
        )}
      </div>
    </div>
  );
}

function TopCitiesCard({
  loading,
  items,
}: {
  loading: boolean;
  items: MetricPayload["topCities"];
}) {
  const total = Math.max(
    1,
    (items || []).reduce((a, b) => a + b.count, 0)
  );
  return (
    <div className="mt-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 p-4">
      <div className="mb-3 font-bold">ערים מובילות</div>
      {loading ? (
        <Skeleton className="h-36" />
      ) : (
        <div className="grid gap-2">
          {(items || []).map((r, idx) => {
            const pct = Math.round((r.count / total) * 100);
            return (
              <div
                key={r.key}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-2"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="city" />
                  <span className="truncate">
                    {idx + 1}. {r.key}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className="h-2 bg-gradient-to-r from-violet-500 to-fuchsia-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-12 text-right text-xs tabular-nums">
                  {fmt.format(r.count)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecentTable({
  loading,
  rows,
  allRows,
  sortKey,
  sortDir,
  page,
  setPage,
  pageSize,
  setPageSize,
  totalPages,
  onHeaderClick,
}: ReturnType<typeof useSearchSortPaginate> & { loading: boolean }) {
  function cellAge(birthDate: string | null) {
    if (!birthDate) return "—";
    const now = new Date();
    const y = parseInt(birthDate.slice(0, 4), 10);
    let a = now.getFullYear() - y;
    const mmdd = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    if (birthDate.slice(5) > mmdd) a -= 1;
    return String(a);
  }

  const H = ({
    k,
    children,
    w,
  }: {
    k: SortKey;
    children: React.ReactNode;
    w?: string;
  }) => (
    <th
      className={classNames("py-2 cursor-pointer select-none", w && `w-[${w}]`)}
      onClick={() => onHeaderClick(k)}
      title="לחץ למיון"
    >
      <div className="inline-flex items-center gap-1">
        {children}
        {sortKey === k ? (
          <span className="opacity-60 text-[10px]">
            {sortDir === "asc" ? "▲" : "▼"}
          </span>
        ) : null}
      </div>
    </th>
  );

  return (
    <div className="mt-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 p-4 overflow-x-auto">
      <div className="mb-3 flex items-center gap-2 font-bold">
        <span>עדכונים אחרונים</span>
        <Badge tone="muted">{fmt.format(allRows.length)} רשומות</Badge>
      </div>
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur text-xs opacity-80 text-right">
          <tr>
            <H k="name">שם</H>
            <H k="loc">מיקום</H>
            <H k="dir">זרם</H>
            <H k="goal">מטרה</H>
            <H k="age" w="64px">
              גיל
            </H>
            <H k="updated" w="160px">
              עדכון
            </H>
            <th className="py-2 w-[220px]">משתמש</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <tr
                  key={i}
                  className="border-t border-black/5 dark:border-white/10"
                >
                  <td className="py-2">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="py-2">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="py-2">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="py-2">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="py-2">
                    <Skeleton className="h-4 w-10" />
                  </td>
                  <td className="py-2">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="py-2">
                    <Skeleton className="h-4 w-48" />
                  </td>
                </tr>
              ))
            : rows.map((r) => {
                const age = cellAge(r.birthDate);
                return (
                  <tr
                    key={r.userId}
                    className="border-t border-black/5 dark:border-white/10"
                  >
                    <td className="py-2">{r.displayName || "—"}</td>
                    <td className="py-2">
                      {[r.city, r.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="py-2">{r.judaism_direction || "—"}</td>
                    <td className="py-2">{r.goals || "—"}</td>
                    <td className="py-2">{age}</td>
                    <td className="py-2">
                      {r.updatedAt?.replace("T", " ").slice(0, 16) || "—"}
                    </td>
                    <td className="py-2 font-mono text-[11px] opacity-70">
                      {r.userId}
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-3 flex items-center gap-3">
        <div className="text-xs opacity-70">
          עמוד {page} מתוך {fmt.format(totalPages)}
        </div>
        <div className="ms-auto flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={page <= 1}
            className="rounded-lg border px-2 py-1 text-sm disabled:opacity-50"
          >
            « ראשון
          </button>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-lg border px-2 py-1 text-sm disabled:opacity-50"
          >
            ‹ הקודם
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border px-2 py-1 text-sm disabled:opacity-50"
          >
            הבא ›
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            className="rounded-lg border px-2 py-1 text-sm disabled:opacity-50"
          >
            אחרון »
          </button>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs opacity-70">שורות בעמוד:</span>
          <select
            className="rounded-lg border bg-transparent px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[10, 15, 20, 30, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

/* =========================== Main Component =========================== */

export default function AdminExecutiveDashboard() {
  const [data, setData] = React.useState<MetricPayload | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<Date | null>(null);
  const [autoMs, setAutoMs] = useLocalStorage<number | null>(
    "admin:autoMs",
    30_000
  );
  const [range, setRange] = useLocalStorage<Range>("admin:range", 30);

  const controllerRef = React.useRef<AbortController | null>(null);

  const { query, setQuery, ...table } = useSearchSortPaginate(
    data?.recent || []
  );

  const dailySeries = React.useMemo(
    () => buildDailySeries(data?.recent || [], range),
    [data?.recent, range]
  );
  const prevWindowSum = React.useMemo(() => {
    if (!data?.recent?.length) return null;
    const before = buildDailySeries(data.recent, range * 2).slice(0, -range);
    return before.reduce((a, b) => a + b.count, 0);
  }, [data?.recent, range]);

  const [historyOnline, setHistoryOnline] = useLocalStorage<number[]>(
    "admin:onlineHist",
    []
  );

  async function load() {
    setLoading(true);
    setError(null);
    controllerRef.current?.abort();
    const ctl = new AbortController();
    controllerRef.current = ctl;
    try {
      const j = await fetchMetrics(ctl.signal);
      setData(j.data);
      setLastUpdatedAt(new Date());
      // accumulate online history (last 20 samples)
      setHistoryOnline((h) => {
        const next = [...h, j.data.totals.online10m].slice(-20);
        return next;
      });
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message || "שגיאה בטעינת נתונים");
    } finally {
      setLoading(false);
    }
  }

  // initial & interval load
  React.useEffect(() => {
    load();
    // pause auto when tab hidden
    function vis() {
      if (document.hidden) {
        controllerRef.current?.abort();
      }
    }
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useInterval(() => {
    if (!document.hidden) load();
  }, autoMs);

  // keyboard shortcuts
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey ? true : false;
      if (!mod && e.key === "r") {
        e.preventDefault();
        load();
      }
      if (!mod && e.key === "/") {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>(
          "input[placeholder*='חיפוש']"
        );
        el?.focus();
      }
      if (!mod && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        handleExportCSV();
      }
      if (!mod && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        window.print();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, table]);

  function handleExportCSV() {
    const rows = table.allRows;
    const head = [
      "userId",
      "displayName",
      "city",
      "country",
      "judaism_direction",
      "goals",
      "birthDate",
      "updatedAt",
    ];
    const csv =
      head.join(",") +
      "\n" +
      rows
        .map((r) =>
          [
            r.userId,
            r.displayName ?? "",
            r.city ?? "",
            r.country ?? "",
            r.judaism_direction ?? "",
            r.goals ?? "",
            r.birthDate ?? "",
            r.updatedAt ?? "",
          ]
            .map((x) => JSON.stringify(x))
            .join(",")
        )
        .join("\n");
    downloadBlob(`maty-date-recent-${Date.now()}.csv`, csv);
  }

  function handlePrint() {
    window.print();
  }

  // simple insights
  const topGender = React.useMemo(() => {
    const g = (data?.byGender || [])
      .slice()
      .sort((a, b) => b.count - a.count)[0];
    return g ? `${g.key} – ${fmt.format(g.count)}` : "—";
  }, [data?.byGender]);

  const topDirection = React.useMemo(() => {
    const d = (data?.byDirection || [])
      .slice()
      .sort((a, b) => b.count - a.count)[0];
    return d ? `${d.key} – ${fmt.format(d.count)}` : "—";
  }, [data?.byDirection]);

  const topGoal = React.useMemo(() => {
    const g = (data?.byGoal || []).slice().sort((a, b) => b.count - a.count)[0];
    return g ? `${g.key} – ${fmt.format(g.count)}` : "—";
  }, [data?.byGoal]);

  const onlineSpark = React.useMemo(() => {
    return historyOnline.slice(-20);
  }, [historyOnline]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 print:px-0" dir="rtl">
      <header className="mb-3">
        <h1 className="text-3xl font-extrabold">פאנל מנהלים</h1>
        <p className="opacity-70">סקירה חכמה ל־MATY-DATE (ועדכונים חיים)</p>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-300/40 bg-rose-100/80 dark:bg-rose-500/10 p-3 text-rose-800 dark:text-rose-300">
          {error} — ודא שלמשתמש יש הרשאות (ADMIN), ושה־API זמין.
        </div>
      )}

      <Toolbar
        loading={loading}
        lastUpdatedAt={lastUpdatedAt}
        autoMs={autoMs}
        setAutoMs={setAutoMs}
        onRefresh={load}
        range={range}
        setRange={setRange}
        query={query}
        setQuery={setQuery}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
      />

      {/* KPIs */}
      <StatGroup
        loading={loading}
        totals={data?.totals ?? null}
        dailySeries={dailySeries}
        prevWindowSum={prevWindowSum}
      />

      {/* Quick insights */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 p-4">
          <div className="flex items-center gap-2 text-sm opacity-80">
            <Icon name="user" /> פילוח בולט (מין)
          </div>
          <div className="mt-1 text-lg font-bold">
            {loading ? "…" : topGender}
          </div>
          <div className="mt-2">
            <Sparkline values={(data?.byGender || []).map((x) => x.count)} />
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 p-4">
          <div className="flex items-center gap-2 text-sm opacity-80">
            <Icon name="shield" /> זרם מוביל
          </div>
          <div className="mt-1 text-lg font-bold">
            {loading ? "…" : topDirection}
          </div>
          <div className="mt-2">
            <Sparkline values={(data?.byDirection || []).map((x) => x.count)} />
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 p-4">
          <div className="flex items-center gap-2 text-sm opacity-80">
            <Icon name="target" /> מטרה מובילה
          </div>
          <div className="mt-1 text-lg font-bold">
            {loading ? "…" : topGoal}
          </div>
          <div className="mt-2">
            <Sparkline values={(data?.byGoal || []).map((x) => x.count)} />
          </div>
        </div>
      </div>

      {/* Distributions */}
      <DistributionCards
        loading={loading}
        byGender={data?.byGender || []}
        byDirection={data?.byDirection || []}
        byGoal={data?.byGoal || []}
      />

      {/* Top Cities */}
      <TopCitiesCard loading={loading} items={data?.topCities || []} />

      {/* Online Spark (live) */}
      <div className="mt-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 p-4">
        <div className="mb-3 flex items-center gap-2 font-bold">
          <span>מחוברים בזמן אמת (עקב 20 דגימות אחרונות)</span>
          <Badge tone="muted">
            <Icon name="clock" className="me-1" />{" "}
            {autoMs ? `${autoMs / 1000}s` : "עצור"}
          </Badge>
        </div>
        {loading && onlineSpark.length === 0 ? (
          <Skeleton className="h-16" />
        ) : (
          <Sparkline
            values={onlineSpark.length ? onlineSpark : [0]}
            height={48}
          />
        )}
      </div>

      {/* Recent table with search/sort/paginate */}
      <RecentTable
        loading={loading}
        rows={table.rows}
        allRows={table.allRows}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        page={table.page}
        setPage={table.setPage}
        pageSize={table.pageSize}
        setPageSize={table.setPageSize}
        totalPages={table.totalPages}
        onHeaderClick={table.onHeaderClick}
      />

      {/* Footer actions */}
      <footer className="mt-8 flex flex-wrap items-center gap-2 text-xs opacity-70 print:hidden">
        <div>טיפים:</div>
        <Badge tone="muted">/ – חיפוש</Badge>
        <Badge tone="muted">R – רענון</Badge>
        <Badge tone="muted">E – ייצוא</Badge>
        <Badge tone="muted">P – הדפסה</Badge>
        <div className="ms-auto">© MATY – Admin Suite</div>
      </footer>
    </main>
  );
}
