"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { DateAdminStats } from "@/lib/db/date-admin";
// אופציונלי: אם מותקן recharts (מומלץ לחוויה מלאה). אם אין – ניפול ל-Fallback פשוט.
// npm i recharts
let Recharts: any = {};
try {
  // דינאמי כדי להימנע משגיאה אם הספרייה לא מותקנת
  // @ts-ignore
  Recharts = require("recharts");
} catch {}

/** =============================================
 *  AdminDateDashboard Pro — דשבורד חווייתי מלא
 *  - KPI + כרטיסי סטטוס
 *  - גרפים (מגדר / זרם / גילאים) עם recharts או fallback
 *  - טבלת פרופילים עם סינון, חיפוש, אינפיניטי-סקול, בחירה מרובה
 *  - דפדפת פרופיל (Drawer): כל הפרטים, אקשנים מהירים (חסימה/השהיה/אימות)
 *  - יצוא CSV, קיצורי מקלדת, RTL מלא
 *  קבצי API משוערים: /api/admin/date/stats, /api/admin/date/profiles, /api/admin/date/profile
 *  אפשר לשנות את כתובות ה-fetch בתחתית הקובץ (Data Adapters)
 *  ============================================= */

/** ---------- Types (UI) ---------- */
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

export type ProfileListItem = {
  _id: string;
  userId: string;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null; // ייתכן קיים במסד — יופיע אם חוזר מה-API
  gender?: Gender;
  judaism_direction?: Direction;
  country?: string | null;
  city?: string | null;
  languages?: string[]; // אופציונלי
  goals?: string[]; // אופציונלי
  updatedAt?: string | null;
  avatarUrl?: string | null;
};

export type ProfileFull = ProfileListItem & {
  birthDate?: string | null; // YYYY-MM-DD או ISO
  kashrut_level?: "strict" | "partial" | "none" | null;
  shabbat_level?: "strict" | "partial" | "none" | null;
  about_me?: string | null;
  photos?: string[];
  addressLine?: string | null;
  postalCode?: string | null;
  social?: { instagram?: string; facebook?: string; tiktok?: string };
  status?: "active" | "paused" | "blocked";
};

/** ---------- Utils ---------- */
const nf = (n: number | undefined | null) =>
  (n ?? 0).toLocaleString("he-IL");
const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("he-IL") : "—";
const cls = (...xs: Array<string | false | undefined>) => xs.filter(Boolean).join(" ");
const stop = (e: React.SyntheticEvent) => e.stopPropagation();
const colors = {
  brand: "#f59e0b",
  brandSoft: "#fde68a",
  ok: "#10b981",
  warn: "#f59e0b",
  danger: "#ef4444",
  surface: "#111827",
};

/** ---------- Dictionaries ---------- */
const dirName = (k: Direction) => {
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
};
const genderName = (k: Gender) =>
  k === "male" ? "זכר" : k === "female" ? "נקבה" : k === "other" ? "אחר" : "לא צוין";
const langName = (k: string) => {
  const m: Record<string, string> = {
    he: "עברית",
    en: "אנגלית",
    ru: "רוסית",
    fr: "צרפתית",
    es: "ספרדית",
    ar: "ערבית",
    am: "אמהרית",
    yi: "יידיש",
  };
  return m[k] || k;
};

/** ---------- Main Component ---------- */
export default function AdminDateDashboardPro({ initialStats }: { initialStats: DateAdminStats }) {
  // מקור הנתונים הראשוני מהשרת
  const [stats, setStats] = useState<DateAdminStats>(initialStats);
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  // טבלת פרופילים
  const [q, setQ] = useState("");
  const [gender, setGender] = useState<Gender>(null);
  const [direction, setDirection] = useState<Direction>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [withAvatarOnly, setWithAvatarOnly] = useState(false);

  const [rows, setRows] = useState<ProfileListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Drawer
  const [openDrawer, setOpenDrawer] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [focusData, setFocusData] = useState<ProfileFull | null>(null);
  const [loadingFocus, setLoadingFocus] = useState(false);

  // קיצורי מקלדת
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        const input = document.getElementById("adm-search") as HTMLInputElement | null;
        input?.focus();
      }
      if (e.key.toLowerCase() === "r") refreshStats();
      if (e.key.toLowerCase() === "e") exportCSV();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows]);

  /** --------- Stats --------- */
  const refreshStats = async () => {
    setLoadingStats(true);
    setErrorStats(null);
    try {
      const next = await apiFetchStats();
      setStats(next);
    } catch (e: any) {
      setErrorStats(e?.message || "שגיאה בעדכון נתונים");
    } finally {
      setLoadingStats(false);
    }
  };

  /** --------- Rows / List (infinite) --------- */
  const onResetAndLoad = useCallback(async () => {
    setRows([]);
    setCursor(null);
    setHasMore(true);
    setSelected(new Set());
    await loadMore(true);
  }, [q, gender, direction, country, withAvatarOnly]);

  useEffect(() => {
    // טעינה ראשונה
    onResetAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // ריענון כשמסננים משתנים
    const t = setTimeout(() => {
      onResetAndLoad();
    }, 150);
    return () => clearTimeout(t);
  }, [q, gender, direction, country, withAvatarOnly, onResetAndLoad]);

  const loadMore = useCallback(async (isFirst = false) => {
    if (loadingRows || (!isFirst && !hasMore)) return;
    setLoadingRows(true);
    try {
      const res = await apiFetchProfiles({
        q,
        gender,
        direction,
        country,
        withAvatar: withAvatarOnly,
        limit: 30,
        cursor: isFirst ? null : cursor,
      });
      setRows((prev) => (isFirst ? res.items : [...prev, ...res.items]));
      setCursor(res.nextCursor);
      setHasMore(Boolean(res.nextCursor));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRows(false);
    }
  }, [q, gender, direction, country, withAvatarOnly, cursor, hasMore, loadingRows]);

  // אינפיניטי: צופה ב-sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const ent of entries) {
        if (ent.isIntersecting) {
          loadMore();
        }
      }
    }, { root: null, rootMargin: "1200px 0px 1200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  /** --------- Select / Bulk --------- */
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAllOnPage = () => {
    const pageIds = rows.map((r) => r._id);
    const allSelected = pageIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  /** --------- Drawer --------- */
  const openProfile = async (id: string) => {
    setFocusId(id);
    setOpenDrawer(true);
    setLoadingFocus(true);
    try {
      const data = await apiFetchProfile(id);
      setFocusData(data);
    } catch (e) {
      console.error(e);
      // fallback: השתמש ברשומה מהטבלה
      const base = rows.find((r) => r._id === id) || null;
      setFocusData(base as any);
    } finally {
      setLoadingFocus(false);
    }
  };

  const onAction = async (action: "verify" | "pause" | "unpause" | "block") => {
    if (!focusId) return;
    try {
      await apiProfileAction(focusId, action);
      // רענון שורה בטבלה
      setRows((prev) => prev.map((r) => (r._id === focusId ? { ...r } : r)));
    } catch (e) {
      console.error(e);
    }
  };

  /** --------- Export CSV --------- */
  const exportCSV = async () => {
    try {
      const header = [
        "_id",
        "userId",
        "displayName",
        "email",
        "phone",
        "gender",
        "judaism_direction",
        "country",
        "city",
        "languages",
        "goals",
        "updatedAt",
      ];
      const lines = [header.join(",")];
      rows.forEach((r) => {
        const line = [
          r._id,
          r.userId,
          safe(r.displayName),
          safe(r.email),
          safe((r as any).phone),
          r.gender || "",
          r.judaism_direction || "",
          safe(r.country),
          safe(r.city),
          safe((r.languages || []).join(";")),
          safe((r.goals || []).join(";")),
          r.updatedAt || "",
        ]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",");
        lines.push(line);
      });
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `matydate_profiles_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };
  const safe = (v: any) => (v == null ? "" : String(v));

  /** --------- Derived --------- */
  const withAvatarPct = useMemo(() =>
    stats.totals.all ? Math.round((stats.totals.withAvatar / stats.totals.all) * 100) : 0,
  [stats]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Topbar */}
      <header className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold">דאשבורד MATY-DATE</h1>
          <span className="text-xs px-2 py-1 rounded-full border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70">
            ⌘/ להתמקדות חיפוש · R לרענון · E ליצוא
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshStats}
            className="h-9 rounded-full px-4 text-sm bg-brand text-white hover:opacity-90"
          >
            {loadingStats ? "מרענן…" : "רענן נתונים"}
          </button>
          <button
            onClick={exportCSV}
            className="h-9 rounded-full px-4 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
          >
            יצוא CSV
          </button>
        </div>
      </header>

      {errorStats && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-400/30 rounded-lg p-3">
          שגיאה בעדכון נתונים: {errorStats}
        </div>
      )}

      {/* KPI cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPI title="סה״כ פרופילים" value={nf(stats.totals.all)} href="/admin/date/users" />
        <KPI title="עם תמונה" value={`${nf(stats.totals.withAvatar)} (${withAvatarPct}%)`} href="/admin/date/users" />
        <KPI title="ממוצע השלמת פרופיל" value={`${Math.round(stats.totals.avgCompleteness)}%`} />
        <KPI title="עודכנו · 24 שעות" value={nf(stats.totals.last24h)} />
        <KPI title="עודכנו · 7 ימים" value={nf(stats.totals.last7d)} />
        <KPI title="עודכנו · 30 ימים" value={nf(stats.totals.last30d)} />
      </section>

      {/* Charts + Insights */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="התפלגות מגדר">
          <ChartBar
            data={stats.byGender.map((g) => ({ name: genderName(g.key), value: g.count }))}
            total={stats.totals.all}
          />
        </Card>
        <Card title="זרם ביהדות">
          <ChartBar
            data={stats.byDirection.map((d) => ({ name: dirName(d.key), value: d.count }))}
            total={stats.totals.all}
          />
        </Card>
        <Card title="טווחי גילאים">
          <ChartBar
            data={stats.ageBuckets.map((b) => ({ name: b.key, value: b.count }))}
            total={stats.totals.all}
          />
        </Card>
      </section>

      {/* Top Countries + Top Languages */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="מדינות מובילות">
          <ul className="space-y-2">
            {stats.topCountries.map((c) => (
              <li key={c.key} className="flex items-center justify-between text-sm">
                <span className="truncate">{c.key}</span>
                <span className="tabular-nums opacity-70">{nf(c.count)}</span>
              </li>
            ))}
            {stats.topCountries.length === 0 && <Empty text="אין נתונים" />}
          </ul>
        </Card>
        <Card title="שפות מובילות">
          <ul className="space-y-2">
            {stats.topLanguages.map((l) => (
              <li key={l.key} className="flex items-center justify-between text-sm">
                <span className="truncate" title={l.key !== langName(l.key) ? l.key : undefined}>{langName(l.key)}</span>
                <span className="tabular-nums opacity-70">{nf(l.count)}</span>
              </li>
            ))}
            {stats.topLanguages.length === 0 && <Empty text="אין נתונים" />}
          </ul>
        </Card>
      </section>

      {/* Filters + Table */}
      <section className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/80 dark:bg-neutral-900/70">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            id="adm-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש: שם / אימייל / עיר / מדינה / טלפון"
            className="h-10 rounded-full border px-3 text-sm border-amber-400/40 dark:border-amber-300/20 bg-white/80 dark:bg-neutral-900/70 min-w-[220px]"
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
            onChange={(e) => setDirection((e.target.value || null) as Direction)}
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
            <input type="checkbox" className="accent-amber-500" checked={withAvatarOnly} onChange={(e) => setWithAvatarOnly(e.target.checked)} />
            רק עם תמונה
          </label>

          <div className="ms-auto flex items-center gap-2">
            <button
              onClick={onResetAndLoad}
              className="h-9 rounded-full px-4 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
            >
              החל ריענון
            </button>
            {selected.size > 0 && (
              <button
                onClick={clearSelection}
                className="h-9 rounded-full px-4 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
              >
                נקה בחירה ({selected.size})
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-black/5 dark:border-white/5">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-right bg-black/[.02] dark:bg-white/[.03] border-b border-black/10 dark:border-white/10">
                <th className="py-2 px-2 w-10">
                  <input type="checkbox" aria-label="בחר הכל" onChange={toggleAllOnPage} checked={rows.length > 0 && rows.every((r) => selected.has(r._id))} />
                </th>
                <th className="py-2 px-2">שם</th>
                <th className="py-2 px-2">אימייל</th>
                <th className="py-2 px-2">טלפון</th>
                <th className="py-2 px-2">מגדר</th>
                <th className="py-2 px-2">זרם</th>
                <th className="py-2 px-2">עיר/מדינה</th>
                <th className="py-2 px-2">עודכן</th>
                <th className="py-2 px-2">תמונה</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r._id}
                  className="border-b border-black/5 dark:border-white/5 hover:bg-amber-50/40 dark:hover:bg-amber-900/10 cursor-pointer"
                  onClick={() => openProfile(r._id)}
                >
                  <td className="py-2 px-2" onClick={stop}>
                    <input type="checkbox" checked={selected.has(r._id)} onChange={() => toggleOne(r._id)} aria-label={`בחר את ${r.displayName || r.email || r._id}`} />
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      {r.avatarUrl ? (
                        <img src={r.avatarUrl} alt={r.displayName || "avatar"} className="h-7 w-7 rounded-full object-cover border border-black/10 dark:border-white/10" onError={(e) => (((e.currentTarget as HTMLImageElement).style.display = "none"))} />
                      ) : (
                        <span aria-hidden className="h-7 w-7 rounded-full bg-black/10 dark:bg-white/10 inline-block" />
                      )}
                      <span className="truncate max-w-[220px]" title={r.displayName || undefined}>{r.displayName ?? "—"}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 truncate max-w-[240px]">
                    {r.email ? (
                      <a href={`mailto:${r.email}`} className="underline decoration-dotted" onClick={stop}>{r.email}</a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 px-2 truncate max-w-[160px]">
                    {(r as any).phone ? (
                      <a href={`https://wa.me/${digitsOnly((r as any).phone)}`} target="_blank" rel="noreferrer" className="underline decoration-dotted" onClick={stop}>
                        {(r as any).phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 px-2">{genderName(r.gender ?? null)}</td>
                  <td className="py-2 px-2">{dirName(r.judaism_direction ?? null)}</td>
                  <td className="py-2 px-2">{[r.city, r.country].filter(Boolean).join(", ") || "—"}</td>
                  <td className="py-2 px-2">{fmtDateTime(r.updatedAt)}</td>
                  <td className="py-2 px-2">{r.avatarUrl ? "✓" : "—"}</td>
                </tr>
              ))}
              {loadingRows && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-sm opacity-70">
                    טוען…
                  </td>
                </tr>
              )}
              {!loadingRows && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-sm opacity-70">
                    אין נתונים.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div ref={sentinelRef} className="h-6" />

        {/* Bulk actions */}
        <div className="flex items-center gap-2 pt-3">
          <span className="text-sm opacity-70">נבחרו: {selected.size}</span>
          <button className="h-9 rounded-full px-3 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10" onClick={() => bulkAction(selected, "verify").catch(console.error)} disabled={selected.size === 0}>
            אמת
          </button>
          <button className="h-9 rounded-full px-3 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10" onClick={() => bulkAction(selected, "pause").catch(console.error)} disabled={selected.size === 0}>
            השהה
          </button>
          <button className="h-9 rounded-full px-3 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-red-600" onClick={() => bulkAction(selected, "block").catch(console.error)} disabled={selected.size === 0}>
            חסום
          </button>
        </div>
      </section>

      {/* Drawer */}
      {openDrawer && (
        <ProfileDrawer
          open={openDrawer}
          onClose={() => setOpenDrawer(false)}
          loading={loadingFocus}
          data={focusData}
          onAction={onAction}
        />
      )}
    </div>
  );
}

/** ====================== UI sub-components ====================== */

function KPI({ title, value, href }: { title: string; value: string; href?: string }) {
  const Cmp: any = href ? Link : "div";
  return (
    <Cmp
      href={href as any}
      className={cls(
        "rounded-xl border border-black/10 dark:border-white/10 p-4",
        "bg-white/90 dark:bg-neutral-950/80 hover:bg-white dark:hover:bg-neutral-900 transition",
        href ? "" : "pointer-events-none"
      )}
    >
      <div className="text-sm opacity-70 mb-1">{title}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </Cmp>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/80 dark:bg-neutral-900/70 min-h-[220px]">
      <h2 className="text-base font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Empty({ text = "אין נתונים" }: { text?: string }) {
  return <div className="text-sm opacity-60">{text}</div>;
}

/** ---------- Charts (recharts with graceful fallback) ---------- */
function ChartBar({ data, total }: { data: { name: string; value: number }[]; total: number }) {
  const hasLib = Boolean(Recharts?.ResponsiveContainer);
  const pct = (v: number) => Math.round((v / Math.max(1, total)) * 100);

  if (!hasLib) {
    // Fallback: פסי התקדמות פשוטים
    return (
      <div>
        {data.map((d) => (
          <div key={d.name} className="mb-2">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate">{d.name}</span>
              <span className="tabular-nums opacity-70">{nf(d.value)} · {pct(d.value)}%</span>
            </div>
            <div className="h-2 mt-1 rounded-full bg-black/[.06] dark:bg-white/[.06] overflow-hidden" aria-hidden>
              <div className="h-full" style={{ width: `${pct(d.value)}%`, backgroundColor: colors.brand }} />
            </div>
          </div>
        ))}
        {data.length === 0 && <Empty />}
      </div>
    );
  }

  const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } = Recharts;

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={0} height={40} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: any) => [v, "כמות"]} labelClassName="text-sm" />
          <Bar dataKey="value" fill={colors.brand} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** ---------- Drawer ---------- */
function ProfileDrawer({
  open,
  onClose,
  loading,
  data,
  onAction,
}: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  data: ProfileFull | null;
  onAction: (a: "verify" | "pause" | "unpause" | "block") => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999]" role="dialog" aria-modal="true" dir="rtl">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-[100dvh] w-[92%] sm:w-[560px] bg-white dark:bg-neutral-950 shadow-2xl border-l border-black/10 dark:border-white/10 flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-black/10 dark:border-white/10">
          <div className="font-semibold">פרטי משתמש</div>
          <button onClick={onClose} className="h-8 w-8 rounded-md border border-black/10 dark:border-white/10">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <div className="opacity-70 text-sm">טוען…</div>}
          {!loading && data && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {data.avatarUrl ? (
                  <img src={data.avatarUrl} alt={data.displayName || "avatar"} className="h-14 w-14 rounded-full object-cover border" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-black/10 dark:bg-white/10" />
                )}
                <div className="min-w-0">
                  <div className="text-lg font-bold truncate">{data.displayName || "—"}</div>
                  <div className="text-sm opacity-70 truncate">{data.email || "—"}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="טלפון">
                  {data.phone ? (
                    <a className="underline" href={`https://wa.me/${digitsOnly(data.phone)}`} target="_blank" rel="noreferrer">{data.phone}</a>
                  ) : (
                    "—"
                  )}
                </Field>
                <Field label="מגדר">{genderName(data.gender ?? null)}</Field>
                <Field label="זרם ביהדות">{dirName(data.judaism_direction ?? null)}</Field>
                <Field label="תאריך לידה">{data.birthDate || "—"}</Field>
                <Field label="מדינה">{data.country || "—"}</Field>
                <Field label="עיר">{data.city || "—"}</Field>
                <Field label="כתובת">{data.addressLine || "—"}</Field>
                <Field label="מיקוד">{data.postalCode || "—"}</Field>
                <Field label="כשרות">{levelName(data.kashrut_level)}</Field>
                <Field label="שמירת שבת">{levelName(data.shabbat_level)}</Field>
                <Field label="סטטוס">{statusName(data.status)}</Field>
                <Field label="עודכן">{fmtDateTime(data.updatedAt)}</Field>
              </div>

              <Field label="שפות">
                <Chips values={(data.languages || []).map((l) => langName(l))} />
              </Field>
              <Field label="מטרות">
                <Chips values={data.goals || []} />
              </Field>

              <Field label="על עצמי">
                <div className="text-sm whitespace-pre-wrap leading-6 max-h-64 overflow-auto">
                  {data.about_me || "—"}
                </div>
              </Field>

              {data.photos && data.photos.length > 0 && (
                <Field label="תמונות נוספות">
                  <div className="grid grid-cols-3 gap-2">
                    {data.photos.map((p, i) => (
                      <img key={i} src={p} alt="photo" className="w-full aspect-[4/3] object-cover rounded-lg border" />
                    ))}
                  </div>
                </Field>
              )}

              <Field label="רשתות חברתיות">
                <div className="flex flex-wrap gap-2 text-sm">
                  {linkOrDash("Instagram", data.social?.instagram)}
                  {linkOrDash("Facebook", data.social?.facebook)}
                  {linkOrDash("TikTok", data.social?.tiktok)}
                </div>
              </Field>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-black/10 dark:border-white/10 flex items-center gap-2">
          <button className="h-9 rounded-full px-3 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10" onClick={() => onAction("verify")}>
            אשר/אמת
          </button>
          <button className="h-9 rounded-full px-3 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10" onClick={() => onAction("pause")}>
            השהה
          </button>
          <button className="h-9 rounded-full px-3 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10" onClick={() => onAction("unpause")}>
            הסר השהיה
          </button>
          <button className="h-9 rounded-full px-3 text-sm border border-black/10 dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600" onClick={() => onAction("block")}>
            חסום
          </button>
          <div className="ms-auto text-xs opacity-70">ESC לסגור</div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs opacity-70 mb-1">{label}</div>
      <div className="text-sm break-words">{children}</div>
    </div>
  );
}

function Chips({ values }: { values: string[] }) {
  if (!values || values.length === 0) return <span>—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v, i) => (
        <span key={`${v}-${i}`} className="text-xs px-2 py-1 rounded-full border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70">
          {v}
        </span>
      ))}
    </div>
  );
}

function linkOrDash(label: string, href?: string) {
  if (!href) return <span className="opacity-60">—</span>;
  const url = href.startsWith("http") ? href : `https://${href}`;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="underline decoration-dotted">
      {label}
    </a>
  );
}

function levelName(l?: string | null) {
  switch (l) {
    case "strict":
      return "מחמיר";
    case "partial":
      return "במידה";
    case "none":
      return "לא שומר";
    default:
      return "—";
  }
}
function statusName(s?: string | null) {
  switch (s) {
    case "active":
      return "פעיל";
    case "paused":
      return "מושהה";
    case "blocked":
      return "חסום";
    default:
      return "—";
  }
}
function digitsOnly(s?: string | null) {
  return (s || "").replace(/\D+/g, "");
}

/** ====================== Data Adapters ======================
 * ניתן להתאים בקלות לשכבת API שלך.
 * ברירת מחדל: קריאות GET לנתיבים הבאים
 *  - GET /api/admin/date/stats
 *  - GET /api/admin/date/profiles?q=&gender=&direction=&country=&withAvatar=1&limit=30&cursor=
 *  - GET /api/admin/date/profile?id=
 *  - POST /api/admin/date/profile/[id]/action { action }
 * אם הראוטים טרם קיימים, הקומפוננטה עדיין תוצג על בסיס initialStats,
 * וטבלת הפרופילים תנסה למשוך נתונים — במקרה של 404 פשוט לא תוצג תוצאה.
 */
async function apiFetchStats(): Promise<DateAdminStats> {
  const r = await fetch("/api/admin/date/stats", { cache: "no-store" });
  if (!r.ok) throw new Error("שגיאה בסטטיסטיקות");
  return r.json();
}

async function apiFetchProfiles(args: {
  q?: string;
  gender?: Gender;
  direction?: Direction;
  country?: string | null;
  withAvatar?: boolean;
  limit?: number;
  cursor?: string | null;
}): Promise<{ items: ProfileListItem[]; nextCursor: string | null }> {
  const sp = new URLSearchParams();
  if (args.q) sp.set("q", args.q);
  if (args.gender) sp.set("gender", String(args.gender));
  if (args.direction) sp.set("direction", String(args.direction));
  if (args.country) sp.set("country", String(args.country));
  if (args.withAvatar) sp.set("withAvatar", "1");
  if (args.limit) sp.set("limit", String(args.limit));
  if (args.cursor) sp.set("cursor", String(args.cursor));
  const r = await fetch(`/api/admin/date/profiles?${sp.toString()}`, { cache: "no-store" });
  if (!r.ok) throw new Error("שגיאה בטעינת פרופילים");
  return r.json();
}

async function apiFetchProfile(id: string): Promise<ProfileFull> {
  const r = await fetch(`/api/admin/date/profile?id=${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!r.ok) throw new Error("שגיאה בטעינת פרופיל");
  return r.json();
}

async function apiProfileAction(id: string, action: "verify" | "pause" | "unpause" | "block") {
  const r = await fetch(`/api/admin/date/profile/${encodeURIComponent(id)}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!r.ok) throw new Error("שגיאה בביצוע פעולה");
}

async function bulkAction(ids: Set<string>, action: "verify" | "pause" | "block") {
  if (ids.size === 0) return;
  try {
    await fetch(`/api/admin/date/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(ids), action }),
    });
  } catch (e) {
    console.error(e);
  }
}
