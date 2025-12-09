"use client";

import { useEffect, useMemo, useState } from "react";
import SongForm from "@/components/admin/SongForm";

type Row = {
  _id: string;
  title: string;
  artist: string;
  genre?: string;
  status: "draft"|"published";
  audioUrl: string;
  coverUrl?: string;
  duration?: number;
  createdAt?: string;
};

export default function AdminSongsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
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
    try {
      const r = await fetch(`/api/admin/songs?${qs}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setRows(j.rows || []); setTotal(j.total || 0);
      setPage(j.page || 1); setPageSize(j.pageSize || 30);
    } catch (e:any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [qs]);

  async function del(id: string) {
    if (!confirm("למחוק שיר?")) return;
    const r = await fetch(`/api/admin/songs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const j = await r.json().catch(()=>({}));
    if (!r.ok || !j?.ok) return alert(j?.error || "מחיקה נכשלה");
    load();
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-extrabold">שירים</h1>
      <SongForm onSaved={load} />

      <div className="mm-card p-3 md:p-4">
        <div className="grid gap-2 md:grid-cols-6">
          <input
            className="mm-input input-rtl"
            placeholder="חיפוש (שם/אמן/תג)"
            value={q}
            onChange={(e)=>{ setPage(1); setQ(e.target.value); }}
          />
          <select
            className="mm-select"
            value={pageSize}
            onChange={(e)=>{ setPage(1); setPageSize(Number(e.target.value)); }}
          >
            {[30,60,100].map(n=><option key={n} value={n}>{n} בעמוד</option>)}
          </select>
          <button className="mm-btn mm-pressable" onClick={load} disabled={loading}>
            {loading ? "טוען…" : "רענון"}
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mm-card p-6 text-center opacity-70">אין שירים עדיין.</div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {rows.map((r) => (
              <div key={r._id} className="card p-2">
                <div className="aspect-square rounded-lg overflow-hidden bg-black/5 grid place-items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.coverUrl || "/assets/logo/maty-music-icon.svg"}
                    alt={r.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-2 grid gap-1 text-sm">
                  <div className="font-semibold truncate" title={r.title}>{r.title}</div>
                  <div className="opacity-70 text-xs truncate">{r.artist} · {r.genre || "—"}</div>
                  <audio src={r.audioUrl} controls className="w-full mt-1" />
                  <div className="flex gap-2 mt-2">
                    <button className="mm-btn mm-pressable" onClick={()=>del(r._id)}>מחק</button>
                    <a href={r.audioUrl} target="_blank" className="mm-btn mm-pressable">פתח</a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button className="mm-btn mm-pressable disabled:opacity-50" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1||loading}>
              ← הקודם
            </button>
            <div className="text-sm opacity-80">עמוד {page} מתוך {totalPages}</div>
            <button className="mm-btn mm-pressable disabled:opacity-50" onClick={()=>setPage(p=>p+1)} disabled={page>=totalPages||loading}>
              הבא →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
