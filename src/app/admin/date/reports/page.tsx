// src/app/admin/date/reports/page.tsx
import AdminDateNav from "@/components/admin/date/AdminDateNav";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import clientPromise from "@/lib/mongodb";
import Link from "next/link";

export const metadata = { title: "דיווחים · MATY-DATE" };
export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams: Promise<Search | undefined>;
};

export default async function ReportsPage(props: PageProps) {
  await requireAdmin("admin", {
    signInRedirect: "/auth?from=/admin/date/reports",
  });

  const search = (await props.searchParams) ?? {};

  const q = str(search.q);
  const status = str(search.status);
  const limit = num(search.limit, 20, 1, 100);
  const page = num(search.page, 1, 1, 100000);

  const db = (await clientPromise).db(process.env.MONGODB_DB || "maty-music");
  const C = db.collection("date_reports");

  const query: any = {};
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    query.$or = [
      { message: rx },
      { type: rx },
      { reporterEmail: rx },
      { targetEmail: rx },
      { reporterUserId: rx },
      { targetUserId: rx },
    ];
  }
  if (status) query.status = status;

  const total = await C.countDocuments(query);
  const rows = await C.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  const items = rows.map((d: any) => ({
    _id: String(d._id),
    type: d.type ?? "—",
    message: d.message ?? "",
    reporterUserId: d.reporterUserId ?? null,
    reporterEmail: d.reporterEmail ?? null,
    targetUserId: d.targetUserId ?? null,
    targetEmail: d.targetEmail ?? null,
    status: d.status ?? "—",
    createdAt: toDate(d.createdAt),
  }));

  const pages = Math.max(1, Math.ceil(total / limit));
  const prevHref =
    page > 1 ? `?${qs({ q, status, limit, page: page - 1 })}` : null;
  const nextHref =
    page < pages ? `?${qs({ q, status, limit, page: page + 1 })}` : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
      <h1 className="text-2xl font-extrabold">דיווחים</h1>
      <AdminDateNav />

      {/* מסננים */}
      <form className="mb-4 flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="חיפוש: טקסט / אימייל / מזהה"
          className="h-10 rounded-full border px-3 text-sm border-amber-400/40 dark:border-amber-300/20 bg-white/80 dark:bg-neutral-900/70 min-w-[240px]"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-full border px-3 text-sm border-amber-400/40 dark:border-amber-300/20 bg-white/80 dark:bg-neutral-900/70"
        >
          <option value="">כל הסטטוסים</option>
          <option value="open">פתוח</option>
          <option value="resolved">טופל</option>
          <option value="dismissed">נדחה</option>
          <option value="blocked">חסימה</option>
        </select>
        <select
          name="limit"
          defaultValue={String(limit)}
          className="h-10 rounded-full border px-3 text-sm border-amber-400/40 dark:border-amber-300/20 bg-white/80 dark:bg-neutral-900/70"
        >
          <option value="20">20 בעמוד</option>
          <option value="50">50 בעמוד</option>
          <option value="100">100 בעמוד</option>
        </select>
        <button className="h-10 rounded-full px-4 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">
          סנן
        </button>
        <Link
          href="/admin/date/reports"
          className="h-10 rounded-full px-4 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
        >
          איפוס
        </Link>
        <div className="ms-auto text-sm opacity-70">
          סה״כ: {total.toLocaleString("he-IL")} · עמוד {page} מתוך {pages}
        </div>
      </form>

      {/* טבלה */}
      <div className="overflow-x-auto rounded-xl border border-black/5 dark:border-white/5 bg-white/80 dark:bg-neutral-900/70">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-right bg-black/[.02] dark:bg-white/[.03] border-b border-black/10 dark:border-white/10">
              <th className="py-2 px-2">סוג</th>
              <th className="py-2 px-2">דיווח</th>
              <th className="py-2 px-2">מדווח</th>
              <th className="py-2 px-2">נגד</th>
              <th className="py-2 px-2">סטטוס</th>
              <th className="py-2 px-2">תאריך</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr
                key={r._id}
                className="border-b border-black/5 dark:border-white/5 align-top"
              >
                <td className="py-2 px-2 whitespace-nowrap">{r.type}</td>
                <td className="py-2 px-2">
                  <div className="max-w-[520px] whitespace-pre-wrap">
                    {r.message || "—"}
                  </div>
                </td>
                <td className="py-2 px-2">
                  {r.reporterEmail ? (
                    <a
                      className="underline decoration-dotted"
                      href={`mailto:${r.reporterEmail}`}
                    >
                      {r.reporterEmail}
                    </a>
                  ) : (
                    <span className="opacity-60">—</span>
                  )}
                  <div className="opacity-60">{r.reporterUserId || "—"}</div>
                </td>
                <td className="py-2 px-2">
                  {r.targetEmail ? (
                    <a
                      className="underline decoration-dotted"
                      href={`mailto:${r.targetEmail}`}
                    >
                      {r.targetEmail}
                    </a>
                  ) : (
                    <span className="opacity-60">—</span>
                  )}
                  <div className="opacity-60">{r.targetUserId || "—"}</div>
                </td>
                <td className="py-2 px-2">
                  <span className={chipClass(r.status)}>
                    {statusLabel(r.status)}
                  </span>
                </td>
                <td className="py-2 px-2 whitespace-nowrap">
                  {fmt(r.createdAt)}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center opacity-60">
                  אין נתונים.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* פאג׳ינציה */}
      <div className="mt-3 flex items-center gap-2">
        <Link
          aria-disabled={!prevHref}
          className="h-9 rounded-full px-3 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 aria-disabled:opacity-50 aria-disabled:pointer-events-none"
          href={prevHref || "#"}
        >
          הקודם
        </Link>
        <Link
          aria-disabled={!nextHref}
          className="h-9 rounded-full px-3 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 aria-disabled:opacity-50 aria-disabled:pointer-events-none"
          href={nextHref || "#"}
        >
          הבא
        </Link>
        <div className="ms-auto text-xs opacity-60">
          מציג {Math.min(total, (page - 1) * limit + 1)}–
          {Math.min(page * limit, total)} מתוך {total.toLocaleString("he-IL")}
        </div>
      </div>
    </div>
  );
}

/* helpers */
function str(v: string | string[] | undefined): string | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] : v;
}

function num(
  v: string | string[] | undefined,
  d: number,
  min: number,
  max: number,
) {
  const n = Number(str(v) ?? d);
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : d));
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toDate(d: any): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  const t = new Date(d);
  return isNaN(t.getTime()) ? null : t;
}

function fmt(d: Date | null) {
  return d ? d.toLocaleString("he-IL") : "—";
}

function qs(obj: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === null || typeof v === "undefined" || v === "") return;
    sp.set(k, String(v));
  });
  return sp.toString();
}

function statusLabel(s: string | null) {
  switch (s) {
    case "open":
      return "פתוח";
    case "resolved":
      return "טופל";
    case "dismissed":
      return "נדחה";
    case "blocked":
      return "חסימה";
    default:
      return s || "—";
  }
}

function chipClass(s: string | null) {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded-full text-xs border";
  switch (s) {
    case "open":
      return `${base} border-amber-400/40 bg-amber-50/60 dark:bg-amber-900/20`;
    case "resolved":
      return `${base} border-emerald-400/40 bg-emerald-50/60 dark:bg-emerald-900/20`;
    case "dismissed":
      return `${base} border-slate-400/40 bg-slate-50/60 dark:bg-slate-800/30`;
    case "blocked":
      return `${base} border-red-400/40 bg-red-50/60 dark:bg-red-900/20`;
    default:
      return `${base} border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70`;
  }
}
