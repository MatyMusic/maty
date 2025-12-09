// src/app/admin/users/page.tsx  (רשימת משתמשים)
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type User = { _id: string; name?: string; email: string; phone?: string; role?: string; status?: string; createdAt?: string };

export default function AdminUsersList() {
  const [rows, setRows] = useState<User[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    return p.toString();
  }, [q, page, pageSize]);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/admin/users?${qs}`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    setLoading(false);
    if (j?.ok) { setRows(j.rows || []); setTotal(j.total || 0); setPage(j.page || 1); setPageSize(j.pageSize || 20); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [qs]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">משתמשים</h1>
        <Link href="/admin/users/new" className="btn">+ משתמש חדש</Link>
      </div>

      <div className="card p-3 md:p-4 grid gap-2 md:grid-cols-4">
        <input className="input input-rtl" placeholder="חיפוש (שם/אימייל/טל')" value={q} onChange={(e)=>{ setPage(1); setQ(e.target.value); }} />
        <select className="input" value={pageSize} onChange={(e)=>{ setPage(1); setPageSize(Number(e.target.value)); }}>
          {[10,20,50,100].map(n=> <option key={n} value={n}>{n} בעמוד</option>)}
        </select>
        <button className="btn" onClick={load} disabled={loading}>רענן</button>
        <div className="text-sm opacity-70 self-center">{loading ? "טוען…" : `${total} רשומות`}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-right border-b">
              <th className="py-2 px-2">שם</th>
              <th className="py-2 px-2">אימייל</th>
              <th className="py-2 px-2">טלפון</th>
              <th className="py-2 px-2">תפקיד</th>
              <th className="py-2 px-2">סטטוס</th>
              <th className="py-2 px-2">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(u => (
              <tr key={u._id} className="border-b">
                <td className="py-2 px-2">{u.name || "—"}</td>
                <td className="py-2 px-2">{u.email}</td>
                <td className="py-2 px-2">{u.phone || "—"}</td>
                <td className="py-2 px-2">{u.role || "user"}</td>
                <td className="py-2 px-2">{u.status || "active"}</td>
                <td className="py-2 px-2 whitespace-nowrap">
                  <Link href={`/admin/users/${u._id}`} className="btn px-2 py-1 mr-2">ערוך</Link>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && <tr><td className="py-3 opacity-70 text-center" colSpan={6}>אין נתונים</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button className="btn disabled:opacity-50" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1||loading}>← הקודם</button>
        <div className="text-sm opacity-80">עמוד {page} מתוך {totalPages}</div>
        <button className="btn disabled:opacity-50" onClick={()=>setPage(p=>p+1)} disabled={page>=totalPages||loading}>הבא →</button>
      </div>
    </div>
  );
}
