"use client";

import { useEffect, useMemo, useState } from "react";

type Row = { _id: string; date: string; status: "busy"|"hold"; note?: string|null; expiresAt?: string|null };

export default function AdminSchedulePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [from, setFrom] = useState<string>(new Date().toISOString().slice(0,10));
  const [to, setTo] = useState<string>(new Date(Date.now()+1000*60*60*24*60).toISOString().slice(0,10)); // +60d

  const [newDate, setNewDate] = useState<string>("");
  const [newStatus, setNewStatus] = useState<"busy"|"hold">("busy");
  const [newNote, setNewNote] = useState<string>("");
  const [ttl, setTtl] = useState<number>(72);

  async function load() {
    const r = await fetch(`/api/admin/availability?from=${from}&to=${to}`, { cache: "no-store" });
    const j = await r.json();
    if (j?.ok) setRows(j.rows || []);
  }

  async function addRow() {
    if (!newDate) return;
    const r = await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        date: newDate, status: newStatus, note: newNote || undefined,
        ...(newStatus === "hold" ? { ttlHours: Math.max(1, Number(ttl||72)) } : {})
      }),
    });
    if (r.ok) {
      setNewDate(""); setNewNote(""); setTtl(72);
      load();
    }
  }

  async function del(date: string, status?: string) {
    const r = await fetch(`/api/admin/availability?date=${encodeURIComponent(date)}${status?`&status=${status}`:""}`, { method: "DELETE" });
    if (r.ok) load();
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [from, to]);

  const calendar = useMemo(() => {
    const map = new Map<string, Row[]>();
    rows.forEach(r => {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date)!.push(r);
    });
    return map;
  }, [rows]);

  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-2xl font-extrabold">לוח זמנים</h1>

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <div className="text-xs opacity-70">מ־</div>
          <input type="date" className="input border px-3 py-1 rounded" value={from} onChange={e=>setFrom(e.target.value)} />
        </div>
        <div>
          <div className="text-xs opacity-70">עד</div>
          <input type="date" className="input border px-3 py-1 rounded" value={to} onChange={e=>setTo(e.target.value)} />
        </div>
        <button className="btn px-3 py-1 rounded" onClick={load}>רענן</button>
      </div>

      <div className="card p-4 space-y-2">
        <div className="font-semibold">חסימת תאריך ידנית</div>
        <div className="flex flex-wrap gap-2 items-end">
          <input type="date" className="input border px-3 py-1 rounded" value={newDate} onChange={e=>setNewDate(e.target.value)} />
          <select className="input border px-3 py-1 rounded" value={newStatus} onChange={e=>setNewStatus(e.target.value as any)}>
            <option value="busy">תפוס (Busy)</option>
            <option value="hold">החזקה זמנית (Hold)</option>
          </select>
          {newStatus === "hold" && (
            <label className="grid gap-1">
              <span className="text-xs opacity-70">משך (שעות)</span>
              <input type="number" className="input border px-3 py-1 rounded w-[120px]" value={ttl} min={1} max={336}
                     onChange={e=>setTtl(Math.max(1, Number(e.target.value||72)))} />
            </label>
          )}
          <input className="input border px-3 py-1 rounded w-[280px]" placeholder="הערה (לא חובה)"
                 value={newNote} onChange={e=>setNewNote(e.target.value)} />
          <button className="btn px-3 py-1 rounded" onClick={addRow}>הוסף</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-right border-b">
              <th className="py-2 px-2">תאריך</th>
              <th className="py-2 px-2">מצב</th>
              <th className="py-2 px-2">פג-תוקף (אם HOLD)</th>
              <th className="py-2 px-2">הערה</th>
              <th className="py-2 px-2">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r._id} className="border-b">
                <td className="py-2 px-2 font-mono">{r.date}</td>
                <td className="py-2 px-2">
                  {r.status === "busy" ? <span className="px-2 py-0.5 rounded bg-red-100 text-red-800">תפוס</span>
                  : <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">החזקה</span>}
                </td>
                <td className="py-2 px-2">{r.expiresAt ? new Date(r.expiresAt).toLocaleString("he-IL") : "-"}</td>
                <td className="py-2 px-2">{r.note || "-"}</td>
                <td className="py-2 px-2">
                  <div className="flex gap-2">
                    <button className="btn px-2 py-1" onClick={()=>del(r.date, r.status)}>מחק</button>
                    {r.status === "hold" && (
                      <button className="btn px-2 py-1" onClick={async ()=>{
                        // קידום HOLD ל-BUSY
                        await fetch("/api/admin/availability", { method:"POST", headers:{ "Content-Type":"application/json" },
                          body: JSON.stringify({ date: r.date, status:"busy", note: "Confirmed booking" }) });
                        await del(r.date, "hold");
                      }}>אשר (Busy)</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className="py-3 opacity-70" colSpan={5}>אין חסימות בטווח</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
