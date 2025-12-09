"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import TrackUploadButton from "@/components/admin/TrackUploadButton";
import { CATEGORY_LABEL, type TrackCategory } from "@/types/music";

type TrackRow = {
  _id: string; title: string; artist?: string;
  category: TrackCategory; duration?: number;
  audioUrl: string; coverUrl?: string; published?: boolean;
};

export default function AdminTracksPage() {
  const [rows, setRows] = useState<TrackRow[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<""|TrackCategory>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const abortRef = useRef<AbortController|null>(null);

  const qs = useMemo(()=>{
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (cat) p.set("category", cat);
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    return p.toString();
  }, [q, cat, page, pageSize]);

  async function load() {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const timeout = setTimeout(()=>ctrl.abort(), 12000);
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`/api/admin/tracks?${qs}`, { cache: "no-store", signal: ctrl.signal });
      const j = await r.json().catch(()=>({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setRows(j.rows || []); setTotal(j.total || 0);
      setPage(j.page || 1); setPageSize(j.pageSize || 30);
    } catch (e:any) {
      if (e?.name !== "AbortError") setErr(e?.message || "load_failed");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [qs]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">שירים</h1>
        <TrackUploadButton onDone={load} />
      </div>

      <div className="mm-card p-3 md:p-4">
        <div className="grid gap-2 md:grid-cols-6">
          <input className="mm-input input-rtl" placeholder="חיפוש (כותרת/אמן/תג)"
                 value={q} onChange={(e)=>{ setPage(1); setQ(e.target.value); }} />
          <select className="mm-select" value={cat}
                  onChange={(e)=>{ setPage(1); setCat(e.target.value as TrackCategory | ""); }}>
            <option value="">כל הקטגוריות</option>
            <option value="chasidi">{CATEGORY_LABEL.chasidi}</option>
            <option value="mizrahit">{CATEGORY_LABEL.mizrahit}</option>
            <option value="quiet">{CATEGORY_LABEL.quiet}</option>
            <option value="energetic">{CATEGORY_LABEL.energetic}</option>
          </select>
          <select className="mm-select" value={pageSize}
                  onChange={(e)=>{ setPage(1); setPageSize(Number(e.target.value)); }}>
            {[30,60,100].map(n=> <option key={n} value={n}>{n} בעמוד</option>)}
          </select>
          <button className="mm-btn mm-pressable" onClick={load} disabled={loading}>רענון</button>
          {err && <div className="text-sm text-red-600 col-span-full">שגיאה: {err}</div>}
        </div>
      </div>

      {!loading && rows.length === 0 && (
        <div className="mm-card p-6 text-center space-y-2">
          <div className="text-lg font-semibold">אין שירים עדיין</div>
          <div className="opacity-70">בחר קטגוריה והעלה שיר ראשון.</div>
          <div className="flex justify-center"><TrackUploadButton onDone={load} /></div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {rows.map(r=>(
          <div key={r._id} className="card p-3">
            <div className="aspect-video bg-black/5 rounded-lg grid place-items-center">
              <audio src={r.audioUrl} controls className="w-full" />
            </div>
            <div className="mt-2 grid gap-1 text-sm">
              <div className="font-semibold truncate" title={r.title}>{r.title}</div>
              <div className="opacity-70 text-xs">
                {CATEGORY_LABEL[r.category]}{r.duration ? ` • ${Math.round(r.duration)}s` : ""}
              </div>
              <a href={r.audioUrl} target="_blank" className="mm-btn mm-pressable mt-1">פתח</a>
            </div>
          </div>
        ))}
      </div>

      {rows.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <button className="mm-btn mm-pressable disabled:opacity-50"
                  onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={page<=1 || loading}>← הקודם</button>
          <div className="text-sm opacity-80">עמוד {page} מתוך {totalPages}</div>
          <button className="mm-btn mm-pressable disabled:opacity-50"
                  onClick={()=>setPage(p=>p+1)} disabled={page>=totalPages || loading}>הבא →</button>
        </div>
      )}
    </div>
  );
}
