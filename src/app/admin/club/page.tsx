// src/app/admin/club/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";

/** ---------- Types ---------- */
type ClubStats = {
  postsTotal: number;
  postsPending: number;
  promotions: number;
  reportsOpen: number;
  users: number;
  onlineCount?: number;

  postsByDay?: Array<{ date: string; count: number }>;
  newUsersByDay?: Array<{ date: string; count: number }>;
  topTags?: Array<{ tag: string; count: number }>;
  activeHours?: Array<{ hour: number; count: number }>;
};

type Promotion = {
  _id: string;
  title: string;
  imageUrl?: string | null;
  link?: string | null;
  ctaText?: string | null;
  active: boolean;
  impressions?: number;
  clicks?: number;
  createdAt?: string;
};

type ReportItem = {
  _id: string;
  kind: "abuse" | "spam" | "copyright" | "other";
  status: "open" | "in_progress" | "closed";
  createdAt: string;
  ref?: {
    type: "post" | "user";
    id: string;
    title?: string;
    userName?: string;
  };
  notes?: string;
};

type InboxItem = {
  _id: string;
  fromUserId: string;
  fromName: string;
  subject: string;
  body?: string;
  createdAt: string;
  unread?: boolean;
};

type Customer = {
  _id: string;
  name: string;
  email?: string;
  joinedAt: string;
  posts?: number;
  reports?: number;
  status?: "active" | "suspended" | "blocked";
};

/** ---------- Helpers ---------- */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJSON<T>(
  url: string,
  init?: RequestInit,
  fallback?: T,
): Promise<T> {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(id);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = (await r.json()) as any;
    return (j?.items ?? j) as T;
  } catch {
    if (fallback !== undefined) return fallback;
    throw new Error("Network error");
  }
}

function toCSV(rows: Array<Record<string, any>>): string {
  if (!rows.length) return "";
  const keys = Array.from(
    rows.reduce((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set<string>()),
  );
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  return [
    keys.join(","),
    ...rows.map((r) => keys.map((k) => esc(r[k])).join(",")),
  ].join("\n");
}

function download(
  filename: string,
  content: string,
  mime = "text/csv;charset=utf-8",
) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function fmtDate(s?: string) {
  try {
    if (!s) return "—";
    return new Date(s).toLocaleString();
  } catch {
    return s || "—";
  }
}

/** ---------- Animated Counter ---------- */
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const animate = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/** ---------- Tiny Charts (no external libs) ---------- */
function AreaSparkline({
  data,
  height = 48,
}: {
  data: number[];
  height?: number;
}) {
  const w = 180;
  const h = height;
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - 2) + 1;
    const y = h - (v / max) * (h - 6) - 3;
    return `${x},${y}`;
  });
  const d = ["M 1", h, "L", pts.join(" "), `L ${w - 1},${h} Z`].join(" ");
  const line = ["M", pts[0], "L", pts.slice(1).join(" ")].join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
    >
      <path d={d} fill="url(#g)" opacity={0.15} />
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function Bars({
  data,
  max = Math.max(1, ...[0, ...data.map((d) => d.v)]),
}: {
  data: Array<{ k: string; v: number }>;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.k} className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="h-2 rounded bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500/80 to-violet-500/80 transition-[width] duration-700"
              style={{ width: `${(100 * d.v) / max}%` }}
            />
          </div>
          <div className="text-xs tabular-nums opacity-70">{d.v}</div>
        </div>
      ))}
    </div>
  );
}

function Donut({
  parts,
  size = 120,
}: {
  parts: Array<{ label: string; value: number; color: string }>;
  size?: number;
}) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  let acc = 0;
  const segs = parts.map((p, i) => {
    const start = (acc / total) * 2 * Math.PI;
    acc += p.value;
    const end = (acc / total) * 2 * Math.PI;
    const large = end - start > Math.PI ? 1 : 0;
    const r = size / 2;
    const cx = r;
    const cy = r;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const d = `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
    return <path key={i} d={d} fill={p.color} opacity={0.85} />;
  });
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segs}
      </svg>
      <div className="absolute inset-0 m-auto size-[60%] rounded-full bg-white dark:bg-neutral-950 border border-black/10 dark:border-white/10" />
    </div>
  );
}

/** ---------- Cards ---------- */
function StatCard({
  title,
  value,
  trend,
  color = "text-fuchsia-600",
  hint,
}: {
  title: string;
  value: number;
  trend?: number; // +/- %
  color?: string;
  hint?: string;
}) {
  const v = useCountUp(value);
  const arrow = trend === undefined ? null : trend >= 0 ? "↑" : "↓";
  const trendClass =
    trend === undefined ? "" : trend >= 0 ? "text-emerald-600" : "text-red-600";

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-900/50 backdrop-blur">
      <div className="text-xs opacity-70 mb-1">{title}</div>
      <div className={`text-3xl font-extrabold tabular-nums ${color}`}>
        {v.toLocaleString()}
      </div>
      {trend !== undefined && (
        <div className={`text-xs mt-1 ${trendClass}`}>
          {arrow} {Math.abs(trend)}% בשבוע
        </div>
      )}
      {hint && <div className="text-xs opacity-60 mt-1">{hint}</div>}
    </div>
  );
}

/** ---------- Main Page ---------- */
export default function ClubDashboardPage() {
  const [stats, setStats] = React.useState<ClubStats | null>(null);
  const [promos, setPromos] = React.useState<Promotion[]>([]);
  const [reports, setReports] = React.useState<ReportItem[]>([]);
  const [inbox, setInbox] = React.useState<InboxItem[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      setLoading(true);

      const fallbackStats: ClubStats = {
        postsTotal: 1320,
        postsPending: 8,
        promotions: 12,
        reportsOpen: 3,
        users: 4800,
        onlineCount: 142,
        postsByDay: Array.from({ length: 14 }, (_, i) => ({
          date: new Date(Date.now() - (13 - i) * 86400000).toISOString(),
          count: Math.max(0, Math.round(40 + 25 * Math.sin(i / 2) + (i % 3))),
        })),
        newUsersByDay: Array.from({ length: 14 }, (_, i) => ({
          date: new Date(Date.now() - (13 - i) * 86400000).toISOString(),
          count: Math.max(0, Math.round(8 + 4 * Math.cos(i / 1.8))),
        })),
        topTags: [
          { tag: "מבצעים", count: 124 },
          { tag: "אירועים", count: 92 },
          { tag: "מדריכים", count: 61 },
          { tag: "דעות", count: 44 },
          { tag: "קופונים", count: 33 },
        ],
        activeHours: Array.from({ length: 24 }, (_, h) => ({
          hour: h,
          count: Math.round(10 + 9 * Math.sin((h - 9) / 3)),
        })),
      };

      const base = process.env.NEXT_PUBLIC_BASE_URL || "";
      const [s, p, r, i, c] = await Promise.all([
        fetchJSON<ClubStats>(
          `${base}/api/admin/club/stats`,
          undefined,
          fallbackStats,
        ).catch(() => fallbackStats),
        fetchJSON<{ ok: boolean; items: Promotion[] }>(
          `${base}/api/club/promotions?limit=10`,
          undefined,
          { ok: true, items: [] } as any,
        )
          .then((j) => j.items || [])
          .catch(() => []),
        // יתכן שאין אצלך ראוטים לדוחות/אינבוקס/לקוחות — נופלים חינני לפולבאק דמו
        fetchJSON<{ items: ReportItem[] }>(
          `${base}/api/admin/club/reports?status=open&limit=10`,
          undefined,
          { items: [] },
        ).then((j) => j.items),
        fetchJSON<{ items: InboxItem[] }>(
          `${base}/api/admin/club/inbox?limit=8`,
          undefined,
          { items: [] },
        ).then((j) => j.items),
        fetchJSON<{ items: Customer[] }>(
          `${base}/api/admin/club/users?limit=12`,
          undefined,
          { items: [] },
        ).then((j) => j.items),
      ]);

      // אם אין נתונים אמיתיים — נייצר דמו כדי לראות את הדשבורד חי
      const demoReports =
        r.length > 0
          ? r
          : [
              {
                _id: "rp1",
                kind: "abuse",
                status: "open",
                createdAt: new Date().toISOString(),
                ref: { type: "post", id: "p1", title: "פוסט פוגעני" },
              },
              {
                _id: "rp2",
                kind: "spam",
                status: "open",
                createdAt: new Date().toISOString(),
                ref: { type: "user", id: "u2", userName: "משתמש חדש" },
              },
            ];

      const demoInbox =
        i.length > 0
          ? i
          : [
              {
                _id: "in1",
                fromUserId: "u3",
                fromName: "רות",
                subject: "בקשה להסרת פוסט",
                body: "אשמח לעזרה…",
                createdAt: new Date().toISOString(),
                unread: true,
              },
              {
                _id: "in2",
                fromUserId: "u4",
                fromName: "דוד",
                subject: "רעיון לשיפור",
                createdAt: new Date().toISOString(),
              },
            ];

      const demoCustomers =
        c.length > 0
          ? c
          : [
              {
                _id: "cu1",
                name: "יעל כהן",
                email: "yael@example.com",
                joinedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
                posts: 12,
                reports: 0,
                status: "active",
              },
              {
                _id: "cu2",
                name: "משה לוי",
                email: "moshe@example.com",
                joinedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
                posts: 3,
                reports: 1,
                status: "active",
              },
              {
                _id: "cu3",
                name: "טל בר",
                email: "tal@example.com",
                joinedAt: new Date(Date.now() - 86400000 * 100).toISOString(),
                posts: 44,
                reports: 2,
                status: "suspended",
              },
            ];

      setStats(s);
      setPromos(p);
      setReports(demoReports);
      setInbox(demoInbox);
      setCustomers(demoCustomers);

      // אנימציה קלה להרגשה "חיה"
      await sleep(120);
      setLoading(false);
    })();
  }, []);

  /** ------ Derived ------ */
  const postsSeries = React.useMemo(
    () => stats?.postsByDay?.map((d) => d.count) ?? [],
    [stats],
  );
  const usersSeries = React.useMemo(
    () => stats?.newUsersByDay?.map((d) => d.count) ?? [],
    [stats],
  );
  const topTagsBars = React.useMemo(
    () => (stats?.topTags ?? []).map((t) => ({ k: `#${t.tag}`, v: t.count })),
    [stats],
  );
  const donutParts = React.useMemo(() => {
    const a = stats?.postsPending ?? 0;
    const b = (stats?.postsTotal ?? 0) - a;
    return [
      { label: "ממתינים", value: a, color: "#ef4444" },
      { label: "מאושרים", value: Math.max(0, b), color: "#10b981" },
    ];
  }, [stats]);

  /** ------ Export Handlers ------ */
  function exportPromosCSV() {
    const csv = toCSV(
      promos.map((p) => ({
        id: p._id,
        title: p.title,
        active: p.active ? 1 : 0,
        impressions: p.impressions ?? 0,
        clicks: p.clicks ?? 0,
        createdAt: p.createdAt,
        link: p.link || "",
      })),
    );
    download(`maty-club-promotions.csv`, csv);
  }
  function exportCustomersCSV() {
    const csv = toCSV(
      customers.map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email || "",
        joinedAt: c.joinedAt,
        posts: c.posts ?? 0,
        reports: c.reports ?? 0,
        status: c.status ?? "active",
      })),
    );
    download(`maty-club-customers.csv`, csv);
  }
  function exportReportsCSV() {
    const csv = toCSV(
      reports.map((r) => ({
        id: r._id,
        kind: r.kind,
        status: r.status,
        createdAt: r.createdAt,
        refType: r.ref?.type || "",
        refId: r.ref?.id || "",
        refTitle: r.ref?.title || r.ref?.userName || "",
      })),
    );
    download(`maty-club-reports.csv`, csv);
  }

  /** ------ UI ------ */
  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">דאשבורד MATY-CLUB</h2>
          <p className="opacity-70 text-sm">
            סקירה כללית של פעילות הקהילה, פוסטים, דיווחים ופרסומים.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/club/promotions/new"
            className="rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            + יצירת פרסום
          </Link>
          <Link
            href="/admin/club/approvals"
            className="rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            תור אישורים
          </Link>
          <button
            onClick={exportPromosCSV}
            className="rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            יצוא פרסומים CSV
          </button>
          <button
            onClick={exportCustomersCSV}
            className="rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            יצוא לקוחות CSV
          </button>
          <button
            onClick={exportReportsCSV}
            className="rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            יצוא דיווחים CSV
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="סה״כ פוסטים"
          value={stats?.postsTotal ?? 0}
          trend={+7}
          color="text-fuchsia-600"
        />
        <StatCard
          title="ממתינים לאישור"
          value={stats?.postsPending ?? 0}
          trend={-12}
          color="text-orange-600"
        />
        <StatCard
          title="פרסומים פעילים"
          value={stats?.promotions ?? 0}
          trend={+3}
          color="text-violet-600"
        />
        <StatCard
          title="דיווחים פתוחים"
          value={stats?.reportsOpen ?? 0}
          trend={+2}
          color="text-red-600"
        />
        <StatCard
          title="משתמשים במערכת"
          value={stats?.users ?? 0}
          trend={+4}
          color="text-emerald-600"
        />
        <StatCard
          title="מחוברים עכשיו"
          value={stats?.onlineCount ?? 0}
          color="text-sky-600"
          hint="נמשך מ-/api/online"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Posts Activity */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-900/50 backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">
              פוסטים אחרונים (14 ימים)
            </div>
            <span className="text-xs opacity-60">ספארקליין</span>
          </div>
          <div className="text-fuchsia-600">
            <AreaSparkline
              data={
                postsSeries.length
                  ? postsSeries
                  : [2, 3, 5, 4, 6, 5, 7, 9, 8, 11, 10, 12, 9, 14]
              }
            />
          </div>
          <div className="text-xs opacity-70 mt-3">מראה מגמת פעילות יומית.</div>
        </div>

        {/* New Users */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-900/50 backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">משתמשים חדשים (14 ימים)</div>
            <span className="text-xs opacity-60">ספארקליין</span>
          </div>
          <div className="text-emerald-600">
            <AreaSparkline
              data={
                usersSeries.length
                  ? usersSeries
                  : [1, 2, 1, 3, 2, 4, 3, 5, 6, 5, 4, 6, 7, 8]
              }
            />
          </div>
          <div className="text-xs opacity-70 mt-3">הרשמות טריות לפי יום.</div>
        </div>

        {/* Donut */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-900/50 backdrop-blur">
          <div className="text-sm font-semibold mb-3">סטטוס פוסטים</div>
          <div className="flex items-center gap-4">
            <Donut parts={donutParts} />
            <div className="text-sm space-y-2">
              {donutParts.map((p) => (
                <div key={p.label} className="flex items-center gap-2">
                  <span
                    className="inline-block size-3 rounded-full"
                    style={{ background: p.color }}
                  />
                  <span className="opacity-80">{p.label}</span>
                  <span className="ms-2 tabular-nums opacity-70">
                    {p.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tags + Active Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-900/50 backdrop-blur">
          <div className="text-sm font-semibold mb-2">תגיות מובילות</div>
          <Bars
            data={
              topTagsBars.length
                ? topTagsBars
                : [
                    { k: "#מבצעים", v: 10 },
                    { k: "#אירועים", v: 7 },
                  ]
            }
          />
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-900/50 backdrop-blur">
          <div className="text-sm font-semibold mb-3">שעות פעילות</div>
          <div className="grid grid-cols-12 gap-2 items-end h-28">
            {(
              stats?.activeHours ??
              Array.from({ length: 12 }, (_, i) => ({
                hour: i * 2,
                count: (i + 2) * 2,
              }))
            ).map((h) => {
              const max = Math.max(
                ...(stats?.activeHours ?? []).map((x) => x.count),
                1,
              );
              const pct = Math.round((100 * h.count) / (max || 1));
              return (
                <div key={h.hour} className="flex flex-col items-center gap-1">
                  <div
                    className="w-3 rounded bg-violet-500/80"
                    style={{ height: `${pct}%` }}
                  />
                  <div className="text-[10px] opacity-60">{h.hour}:00</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Urgent Alerts & Inbox */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Alerts */}
        <div className="xl:col-span-2 rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-900/50 backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">התראות דחופות</div>
            <Link
              href="/admin/club/reports"
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              לכל הדיווחים →
            </Link>
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {reports.length ? (
              reports.slice(0, 6).map((r) => (
                <div key={r._id} className="py-2 flex items-center gap-3">
                  <span
                    className={`inline-flex items-center justify-center size-6 rounded-full text-white text-xs ${
                      r.kind === "abuse"
                        ? "bg-red-600"
                        : r.kind === "spam"
                          ? "bg-orange-500"
                          : "bg-slate-500"
                    }`}
                  >
                    !
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm">
                      דיווח על {r.ref?.type === "post" ? "פוסט" : "משתמש"}{" "}
                      <span className="font-medium">
                        {r.ref?.title || r.ref?.userName || r.ref?.id}
                      </span>
                    </div>
                    <div className="text-xs opacity-60">
                      {fmtDate(r.createdAt)} • {r.kind}
                    </div>
                  </div>
                  <div className="ms-auto flex gap-2">
                    <Link
                      href={`/admin/club/reports`}
                      className="rounded-lg border px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      טיפול
                    </Link>
                    <button className="rounded-lg border px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10">
                      סגור
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-sm opacity-70">
                אין התראות דחופות כרגע.
              </div>
            )}
          </div>
        </div>

        {/* Inbox */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-900/50 backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">פניות אישיות</div>
            <Link
              href="/admin/club/users"
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              לכל הלקוחות →
            </Link>
          </div>
          <div className="space-y-2">
            {inbox.length ? (
              inbox.slice(0, 6).map((m) => (
                <div
                  key={m._id}
                  className={`rounded-xl border p-2 ${m.unread ? "border-emerald-400/50" : "border-black/10 dark:border-white/10"}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block size-2 rounded-full ${m.unread ? "bg-emerald-500" : "bg-slate-400"}`}
                    />
                    <div className="font-medium text-sm truncate">
                      {m.subject}
                    </div>
                    <div className="ms-auto text-xs opacity-60">
                      {fmtDate(m.createdAt)}
                    </div>
                  </div>
                  <div className="text-xs opacity-70 mt-1 truncate">
                    מאת {m.fromName}
                  </div>
                  {m.body && (
                    <div className="text-sm mt-1 line-clamp-2 opacity-80">
                      {m.body}
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Link
                      href={`/admin/club/users`}
                      className="rounded-lg border px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      השב
                    </Link>
                    <button className="rounded-lg border px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10">
                      סמן כנקרא
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm opacity-70">אין הודעות חדשות.</div>
            )}
          </div>
        </div>
      </div>

      {/* Promotions & Customers */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Promotions mini table */}
        <div className="xl:col-span-2 rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-900/50 backdrop-blur overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">פרסומים פעילים</div>
            <Link
              href="/admin/club/promotions"
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              נהל פרסומים →
            </Link>
          </div>
          <table className="min-w-[680px] w-full text-sm border-separate border-spacing-y-1">
            <thead>
              <tr className="text-right opacity-70">
                <th className="px-2">כותרת</th>
                <th className="px-2">סטטוס</th>
                <th className="px-2">Impr.</th>
                <th className="px-2">Clicks</th>
                <th className="px-2"></th>
              </tr>
            </thead>
            <tbody>
              {(promos || []).slice(0, 8).map((p) => (
                <tr
                  key={p._id}
                  className="bg-white/80 dark:bg-neutral-900/60 backdrop-blur border rounded-xl"
                >
                  <td className="px-2 py-2 font-medium">{p.title}</td>
                  <td className="px-2">{p.active ? "פעיל" : "כבוי"}</td>
                  <td className="px-2 tabular-nums">{p.impressions ?? 0}</td>
                  <td className="px-2 tabular-nums">{p.clicks ?? 0}</td>
                  <td className="px-2">
                    <Link
                      href={`/admin/club/promotions`}
                      className="rounded-lg border px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      ערוך
                    </Link>
                  </td>
                </tr>
              ))}
              {(!promos || promos.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center opacity-70">
                    אין פרסומים להצגה.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Customers snapshot */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-900/50 backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">לקוחות אחרונים</div>
            <button
              onClick={exportCustomersCSV}
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              יצוא →
            </button>
          </div>
          <div className="space-y-2">
            {customers.slice(0, 6).map((c) => (
              <div key={c._id} className="rounded-xl border p-2">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="ms-auto text-xs opacity-60">
                    {fmtDate(c.joinedAt)}
                  </div>
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {c.email || "—"} • פוסטים: {c.posts ?? 0} • דיווחים:{" "}
                  {c.reports ?? 0}
                </div>
                <div className="mt-2 flex gap-2">
                  <Link
                    href={`/admin/club/users`}
                    className="rounded-lg border px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    פרופיל
                  </Link>
                  <button className="rounded-lg border px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10">
                    השב
                  </button>
                </div>
              </div>
            ))}
            {customers.length === 0 && (
              <div className="text-sm opacity-70">אין לקוחות להצגה.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
