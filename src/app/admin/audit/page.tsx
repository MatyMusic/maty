"use client";

import { useEffect, useState } from "react";

type Audit = { _id: string; type: string; email?: string; ip?: string; ua?: string; createdAt: string; meta?: any };

export default function AdminAuditPage() {
  const [items, setItems] = useState<Audit[]>([]);
  const [type, setType] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  async function load() {
    const qs = new URLSearchParams({ limit: "200" });
    if (type) qs.set("type", type);
    if (email) qs.set("email", email);
    const r = await fetch(`/api/admin/audit?${qs.toString()}`, { cache: "no-store" });
    const j = await r.json().catch(()=>({}));
    if (j?.ok) setItems(j.items || []);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabולד">לוגים</h1>

      <div className="flex gap-2">
        <input className="input border px-3 py-1 rounded" placeholder="סוג (למשל auth.signin)" value={type} onChange={e=>setType(e.target.value)} />
        <input className="input border px-3 py-1 rounded" placeholder="אימייל" value={email} onChange={e=>setEmail(e.target.value)} />
        <button className="btn px-3" onClick={load}>סנן</button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-right border-b">
              <th className="py-2 px-2">זמן</th>
              <th className="py-2 px-2">סוג</th>
              <th className="py-2 px-2">אימייל</th>
              <th className="py-2 px-2">IP</th>
              <th className="py-2 px-2">User-Agent</th>
              <th className="py-2 px-2">Meta</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a._id} className="border-b align-top">
                <td className="py-2 px-2 whitespace-nowrap">{new Date(a.createdAt).toLocaleString("he-IL")}</td>
                <td className="py-2 px-2">{a.type}</td>
                <td className="py-2 px-2">{a.email || "-"}</td>
                <td className="py-2 px-2">{a.ip || "-"}</td>
                <td className="py-2 px-2 max-w-[280px] truncate" title={a.ua}>{a.ua || "-"}</td>
                <td className="py-2 px-2 max-w-[320px]">
                  <pre className="text-[11px] whitespace-pre-wrap break-words opacity-80">{JSON.stringify(a.meta || {}, null, 2)}</pre>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td className="py-3 opacity-70" colSpan={6}>אין לוגים</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
