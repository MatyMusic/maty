// src/app/admin/reports/page.tsx
"use client";

import { useToast } from "@/contexts/toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import * as React from "react";

type ReportStatus = "open" | "in_review" | "resolved" | "dismissed";

type ReportReason = "spam" | "abuse" | "fake" | "security" | "other";

type ReportRow = {
  _id: string;
  createdAt: string;

  reporterId?: string;
  reporterName?: string;

  reportedUserId: string;
  reportedUserName?: string;

  contextType?: "profile" | "chat" | "post" | "audio" | "other";
  contextId?: string;
  contextPreview?: string;

  reason: ReportReason;
  message?: string;

  status: ReportStatus;
  notes?: string;

  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
};

type ApiListResponse = {
  ok: boolean;
  rows: ReportRow[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
};

type SortOpt = "new" | "old" | "status" | "reason";

function formatDate(s?: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

const STATUS_LABEL: Record<ReportStatus, string> = {
  open: "פתוח",
  in_review: "בטיפול",
  resolved: "טופל",
  dismissed: "נדחה",
};

const REASON_LABEL: Record<ReportReason, string> = {
  spam: "ספאם / פרסום",
  abuse: "הטרדה / פגיעה",
  fake: "פרופיל מזויף",
  security: "אבטחה / רמאות",
  other: "אחר",
};

export default function AdminReportsPage() {
  const admin = useIsAdmin();
  const { push } = useToast();

  const [rows, setRows] = React.useState<ReportRow[]>([]);
  const [total, setTotal] = React.useState(0);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"" | ReportStatus>(
    "open",
  );
  const [reasonFilter, setReasonFilter] = React.useState<"" | ReportReason>("");
  const [sort, setSort] = React.useState<SortOpt>("new");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(30);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qs = React.useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (statusFilter) p.set("status", statusFilter);
    if (reasonFilter) p.set("reason", reasonFilter);
    p.set("sort", sort);
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    return p.toString();
  }, [q, statusFilter, reasonFilter, sort, page, pageSize]);

  const load = React.useCallback(async () => {
    if (admin === false) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/reports?${qs}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const j = (await r.json().catch(() => ({}))) as Partial<ApiListResponse>;
      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      setRows(j.rows || []);
      setTotal(j.total || 0);
    } catch (e: any) {
      const msg = e?.message || "load_failed";
      setError(msg);
      push("error", "טעינת תלונות נכשלה: " + msg);
    } finally {
      setLoading(false);
    }
  }, [admin, qs, push]);

  React.useEffect(() => {
    if (admin === null) return;
    void load();
  }, [admin, load]);

  async function updateStatus(id: string, status: ReportStatus) {
    try {
      const r = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id, status }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      setRows((prev) =>
        prev.map((row) =>
          row._id === id
            ? { ...row, status, lastUpdatedAt: new Date().toISOString() }
            : row,
        ),
      );
      push("success", "סטטוס התלונה עודכן", "עודכן בהצלחה");
    } catch (e: any) {
      push("error", e?.message || "עדכון סטטוס נכשל");
    }
  }

  async function addNote(id: string, notes: string) {
    try {
      const r = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id, notes }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      setRows((prev) =>
        prev.map((row) => (row._id === id ? { ...row, notes } : row)),
      );
      push("success", "הערת אדמין נשמרה");
    } catch (e: any) {
      push("error", e?.message || "שמירת הערה נכשלה");
    }
  }

  function openProfile(userId: string) {
    if (!userId) return;
    // ⬅️ עדכן את הנתיב לפי MATY-DATE שלך
    const url = `/matydate/profile/${userId}`;
    window.open(url, "_blank");
  }

  if (admin === false) {
    return (
      <div className="p-6" dir="rtl">
        <div className="max-w-xl mx-auto rounded-2xl border border-rose-300/60 bg-rose-50/90 dark:bg-rose-950/40 dark:border-rose-900/70 p-5 text-center">
          <h1 className="text-xl font-bold mb-2">🔒 גישת אדמין נדרשת</h1>
          <p className="text-sm opacity-80">
            דף התלונות זמין רק למנהלי מערכת. ודא שאתה מחובר כ־Admin או ש־bypass
            פעיל.
          </p>
        </div>
      </div>
    );
  }

  if (admin === null) {
    return (
      <div className="p-6" dir="rtl">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="h-7 w-40 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-32 rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* כותרת */}
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              🚨 תלונות / דיווחי משתמשים
            </h1>
            <p className="text-sm opacity-70 mt-1">
              כאן תראה תלונות על פרופילים, צ׳אטים ותכנים ב־MATY-DATE ותוכל לטפל
              בהן, לשנות סטטוס ולהיכנס לפרופילים הרלוונטיים.
            </p>
          </div>
          <div className="text-xs opacity-70 flex flex-col items-start md:items-end gap-1">
            <div>סה״כ תלונות: {total}</div>
            {loading && (
              <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                טוען…
              </div>
            )}
          </div>
        </header>

        {/* שורת פילטרים */}
        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 p-4 shadow-sm space-y-3">
          {error && (
            <div className="mb-2 rounded-xl border border-rose-300 bg-rose-50/90 text-rose-900 px-3 py-2 text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>שגיאה בטעינה: {error}</span>
              <button
                type="button"
                onClick={() => load()}
                className="ml-auto text-xs underline hover:no-underline"
              >
                נסה שוב
              </button>
            </div>
          )}

          <div className="grid gap-2 md:grid-cols-5 md:items-end">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-medium opacity-80">
                חיפוש (שם, הודעה, ID…)
              </label>
              <input
                type="text"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400/70"
                placeholder="לדוגמה: ספאם, abuse, userId…"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium opacity-80">
                סטטוס
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400/70"
              >
                <option value="">כל הסטטוסים</option>
                <option value="open">פתוח</option>
                <option value="in_review">בטיפול</option>
                <option value="resolved">טופל</option>
                <option value="dismissed">נדחה</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium opacity-80">סיבה</label>
              <select
                value={reasonFilter}
                onChange={(e) => {
                  setReasonFilter(e.target.value as any);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400/70"
              >
                <option value="">כל הסיבות</option>
                <option value="spam">ספאם / פרסום</option>
                <option value="abuse">הטרדה / פגיעה</option>
                <option value="fake">פרופיל מזויף</option>
                <option value="security">אבטחה / רמאות</option>
                <option value="other">אחר</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium opacity-80">
                סידור
              </label>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortOpt);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400/70"
              >
                <option value="new">חדשים קודם</option>
                <option value="old">ישנים קודם</option>
                <option value="status">לפי סטטוס</option>
                <option value="reason">לפי סיבה</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] opacity-70">
            <div>
              נמצאו {total} תלונות • עמוד {page} מתוך {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <label>בעמוד:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) || 30);
                  setPage(1);
                }}
                className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-0.5 text-[11px]"
              >
                {[20, 30, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => load()}
                disabled={loading}
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-2.5 py-0.5 text-[11px] hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-60"
              >
                {loading ? "טוען…" : "רענן"}
              </button>
            </div>
          </div>
        </section>

        {/* טבלה / רשימה */}
        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 shadow-sm overflow-x-auto">
          {rows.length === 0 ? (
            <div className="p-6 text-sm opacity-70 text-center">
              אין כרגע תלונות להצגה.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-right bg-gradient-to-l from-sky-600 to-violet-600 text-white">
                  <th className="p-2">תאריך</th>
                  <th className="p-2">מדווח</th>
                  <th className="p-2">נגד מי</th>
                  <th className="p-2">קונטקסט</th>
                  <th className="p-2">סיבה</th>
                  <th className="p-2">הודעה</th>
                  <th className="p-2">סטטוס</th>
                  <th className="p-2">הערת אדמין</th>
                  <th className="p-2">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r._id}
                    className="border-t border-neutral-100 dark:border-neutral-800 align-top text-[12px] odd:bg-neutral-50/80 dark:odd:bg-neutral-900/60"
                  >
                    {/* תאריך */}
                    <td className="p-2 whitespace-nowrap">
                      <div>{formatDate(r.createdAt)}</div>
                      {r.lastUpdatedAt && (
                        <div className="mt-0.5 text-[10px] opacity-70">
                          עודכן: {formatDate(r.lastUpdatedAt)}
                        </div>
                      )}
                    </td>

                    {/* מדווח */}
                    <td className="p-2">
                      <div className="font-medium">
                        {r.reporterName || r.reporterId || "אנונימי"}
                      </div>
                      {r.reporterId && (
                        <div className="text-[10px] opacity-70">
                          ID: {r.reporterId}
                        </div>
                      )}
                    </td>

                    {/* נגד מי */}
                    <td className="p-2">
                      <div className="font-medium">
                        {r.reportedUserName || "משתמש ללא שם"}
                      </div>
                      <div className="text-[10px] opacity-70">
                        ID: {r.reportedUserId}
                      </div>
                    </td>

                    {/* קונטקסט */}
                    <td className="p-2 max-w-xs">
                      <div className="text-[11px] font-medium">
                        {r.contextType === "profile"
                          ? "פרופיל"
                          : r.contextType === "chat"
                            ? "צ׳אט / חדר"
                            : r.contextType === "post"
                              ? "פוסט / תוכן"
                              : r.contextType === "audio"
                                ? "שיר / אודיו"
                                : "אחר"}
                      </div>
                      {r.contextId && (
                        <div className="text-[10px] opacity-70">
                          ID: {r.contextId}
                        </div>
                      )}
                      {r.contextPreview && (
                        <div className="mt-1 text-[10px] opacity-80 line-clamp-3">
                          {r.contextPreview}
                        </div>
                      )}
                    </td>

                    {/* סיבה */}
                    <td className="p-2">
                      <div className="inline-flex items-center gap-1 rounded-full border border-rose-200/70 dark:border-rose-800/70 bg-rose-50/90 dark:bg-rose-950/40 px-2 py-0.5 text-[11px]">
                        <span>🚩</span>
                        <span>{REASON_LABEL[r.reason] || "אחר"}</span>
                      </div>
                    </td>

                    {/* הודעת משתמש */}
                    <td className="p-2 max-w-xs">
                      {r.message ? (
                        <div className="text-[11px] leading-snug whitespace-pre-wrap">
                          {r.message}
                        </div>
                      ) : (
                        <span className="text-[11px] opacity-60">—</span>
                      )}
                    </td>

                    {/* סטטוס */}
                    <td className="p-2 whitespace-nowrap">
                      <select
                        value={r.status}
                        onChange={(e) =>
                          updateStatus(r._id, e.target.value as ReportStatus)
                        }
                        className={[
                          "rounded-lg border px-2 py-0.5 text-[11px] outline-none",
                          r.status === "open"
                            ? "border-rose-300 bg-rose-50"
                            : r.status === "in_review"
                              ? "border-amber-300 bg-amber-50"
                              : r.status === "resolved"
                                ? "border-emerald-300 bg-emerald-50"
                                : "border-neutral-300 bg-neutral-50",
                        ].join(" ")}
                      >
                        <option value="open">פתוח</option>
                        <option value="in_review">בטיפול</option>
                        <option value="resolved">טופל</option>
                        <option value="dismissed">נדחה</option>
                      </select>
                    </td>

                    {/* הערת אדמין */}
                    <td className="p-2 max-w-xs">
                      <textarea
                        defaultValue={r.notes || ""}
                        placeholder="הערות טיפול, מה עשית, למה החלטת…"
                        onBlur={(e) => addNote(r._id, e.target.value)}
                        className="w-full min-h-[52px] rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-2 py-1 text-[11px] resize-vertical outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400/70"
                      />
                    </td>

                    {/* פעולות */}
                    <td className="p-2 whitespace-nowrap text-[11px]">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => openProfile(r.reportedUserId)}
                          className="rounded-lg border border-sky-300 bg-sky-50 px-2 py-0.5 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-950/60 dark:hover:bg-sky-900"
                        >
                          👤 פתח פרופיל
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/60 dark:hover:bg-amber-900"
                          // TODO: חבר ל־API חסימת משתמש
                          onClick={() =>
                            push("info", "כאן נחבר API לחסימת משתמש", "TODO")
                          }
                        >
                          ⛔ חסימת משתמש
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-neutral-300 bg-neutral-50 px-2 py-0.5 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                          // TODO: קפיצה למסך צ'אט / לוג
                          onClick={() =>
                            push(
                              "info",
                              "כאן תיפתח בעתיד תצוגת צ׳אט / לוג מלא",
                              "TODO",
                            )
                          }
                        >
                          💬 פתח צ׳אט
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* עימוד */}
          {rows.length > 0 && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px]">
              <span>
                עמוד {page} מתוך {totalPages} • סה״כ {total} תלונות
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 disabled:opacity-50"
                >
                  « ראשון
                </button>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 disabled:opacity-50"
                >
                  ‹ קודם
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 disabled:opacity-50"
                >
                  הבא ›
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
