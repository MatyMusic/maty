"use client";

import { useEffect, useMemo, useState } from "react";

type Customer = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  createdAt?: string | Date;
};

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    return p.toString();
  }, [q, from, to, page, pageSize]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setErr(null);
    fetch(`/api/admin/customers?${qs}`, { cache: "no-store", signal: ac.signal })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setRows(j.rows || []);
        setTotal(j.total || 0);
        setPage(j.page || 1);
        setPageSize(j.pageSize || 20);
      })
      .catch((e: any) => !ac.signal.aborted && setErr(e?.message || "load_failed"))
      .finally(() => !ac.signal.aborted && setLoading(false));
    return () => ac.abort();
  }, [qs]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">לקוחות</h1>
        <div className="text-sm opacity-70">{loading ? "טוען…" : `${total} רשומות`}</div>
      </div>

      <div className="card p-3 md:p-4">
        <div className="grid gap-2 md:grid-cols-6">
          <input
            className="input-base input-rtl"
            placeholder="חיפוש (שם/אימייל/טל')"
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
          />
          <input type="date" className="input-base input-rtl" value={from}
                 onChange={(e) => { setPage(1); setFrom(e.target.value); }} />
          <input type="date" className="input-base input-rtl" value={to}
                 onChange={(e) => { setPage(1); setTo(e.target.value); }} />
          <select className="input-base" value={pageSize}
                  onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}>
            {[10,20,50,100].map(n => <option key={n} value={n}>{n} בעמוד</option>)}
          </select>
          <button className="btn" onClick={() => setPage(1)} disabled={loading}>רענן</button>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          קרתה שגיאה בטעינה: {err}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-right border-b">
              <th className="py-2 px-2">שם</th>
              <th className="py-2 px-2">אימייל</th>
              <th className="py-2 px-2">טלפון</th>
              <th className="py-2 px-2">נוצר</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r._id ?? `${r.email}-${i}`} className="border-b">
                <td className="py-2 px-2">{r.name || "—"}</td>
                <td className="py-2 px-2">{r.email || "—"}</td>
                <td className="py-2 px-2">{r.phone || "—"}</td>
                <td className="py-2 px-2 whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr><td className="py-3 opacity-70 text-center" colSpan={4}>אין נתונים</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button className="btn px-3 py-1 rounded disabled:opacity-50"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}>← הקודם</button>
        <div className="text-sm opacity-80">עמוד {page} מתוך {totalPages}</div>
        <button className="btn px-3 py-1 rounded disabled:opacity-50"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages || loading}>הבא →</button>
      </div>
    </div>
  );
}

function formatDateTime(d?: string | Date) {
  if (!d) return "—";
  try {
    const dt = typeof d === "string" ? new Date(d) : d;
    return isNaN(dt.getTime()) ? "—" : dt.toLocaleString("he-IL");
  } catch { return "—"; }
}
