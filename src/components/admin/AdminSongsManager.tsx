// src/components/admin/AdminSongsManager.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import CloudinaryUpload from "./CloudinaryUpload";

type Song = {
  _id?: string;
  title_he: string;
  slug?: string;
  category?: string;
  tags?: string[];
  key?: string;
  tempo_bpm?: number;
  chords_chordpro?: string;
  lyrics_he?: string;
  links?: { youtube?: string; spotify?: string; source?: string };
  assets?: { audio_mp3?: string; backing_track?: string; pdf_chords?: string; stems_zip?: string; qr_svg?: string };
  composer?: string;
  year?: number;
  event_usage?: string[];
  notes?: string;
  status?: "draft" | "published";
  createdAt?: string;
};

const EMPTY: Song = {
  title_he: "",
  category: "chabad",
  tags: [],
  key: "",
  tempo_bpm: undefined,
  chords_chordpro: "",
  lyrics_he: "",
  links: {},
  assets: {},
  composer: "",
  year: undefined,
  event_usage: [],
  notes: "",
  status: "published",
};

export default function AdminSongsManager() {
  // list state
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Song[]>([]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  // form state
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Song>({ ...EMPTY });
  const editing = !!form._id;

  async function load() {
    const url = `/api/songs/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}&status=all&category=`;
    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json();
    if (j.ok) { setItems(j.items); setTotal(j.total); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, page]);

  function openNew() { setForm({ ...EMPTY }); setOpen(true); }
  function openEdit(item: Song) { setForm({ ...EMPTY, ...item }); setOpen(true); }

  async function save() {
    setBusy(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const body = editing ? { id: form._id, ...form } : form;
      const r = await fetch("/api/songs", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "FAILED");
      setOpen(false);
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally { setBusy(false); }
  }

  async function remove(id?: string) {
    if (!id) return;
    if (!confirm("למחוק את השיר?")) return;
    const r = await fetch(`/api/songs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const j = await r.json();
    if (!j.ok) return alert(j.error || "מחיקה נכשלה");
    await load();
  }

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ניהול ניגונים</h1>
          <p className="text-sm opacity-75">חיפוש, יצירה/עריכה, העלאות, ומחיקה.</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 rounded bg-violet-600 text-white">+ ניגון חדש</button>
      </header>

      {/* חיפוש */}
      <div className="flex items-center gap-3">
        <input value={q} onChange={(e)=>{ setPage(1); setQ(e.target.value); }} placeholder="חיפוש לפי שם/תג..." className="border rounded px-3 py-2 w-full max-w-md" />
        <button onClick={()=>{ setQ(""); setPage(1); }} className="px-3 py-2 rounded border">איפוס</button>
      </div>

      {/* טבלה */}
      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/40">
            <tr>
              <th className="text-right p-3">שם</th>
              <th className="text-right p-3">קטגוריה</th>
              <th className="text-right p-3">תגים</th>
              <th className="text-right p-3">BPM</th>
              <th className="text-right p-3">YouTube</th>
              <th className="text-right p-3 w-40">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s._id} className="border-t">
                <td className="p-3">{s.title_he}</td>
                <td className="p-3">{s.category}</td>
                <td className="p-3">{(s.tags||[]).join(", ")}</td>
                <td className="p-3">{s.tempo_bpm ?? ""}</td>
                <td className="p-3">
                  {s.links?.youtube ? <a href={s.links.youtube} className="text-violet-600 underline" target="_blank">פתח</a> : ""}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={()=>openEdit(s)} className="px-2 py-1 rounded border">ערוך</button>
                    <button onClick={()=>remove(s._id)} className="px-2 py-1 rounded bg-rose-600 text-white">מחק</button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan={6} className="p-6 text-center opacity-60">אין תוצאות</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* פאג'ינציה */}
      <nav className="flex items-center justify-center gap-2">
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} className="px-3 py-2 rounded border disabled:opacity-50">הקודם</button>
        <span className="text-sm opacity-75">עמוד {page} מתוך {totalPages}</span>
        <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} className="px-3 py-2 rounded border disabled:opacity-50">הבא</button>
      </nav>

      {/* מגש עריכה */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50" onClick={()=>!busy && setOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white dark:bg-slate-900 p-6 overflow-y-auto" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{editing ? "עריכת ניגון" : "ניגון חדש"}</h2>
              <button onClick={()=>!busy && setOpen(false)} className="px-3 py-1 rounded border">סגור</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm">שם (עברית)</span>
                  <input className="w-full border rounded px-3 py-2" value={form.title_he} onChange={(e)=>setForm(f=>({...f, title_he:e.target.value}))} />
                </label>

                <label className="block">
                  <span className="text-sm">קטגוריה</span>
                  <select className="w-full border rounded px-3 py-2" value={form.category} onChange={(e)=>setForm(f=>({...f, category:e.target.value}))}>
                    <option value="chabad">חב״ד</option>
                    <option value="hasidic">חסידי</option>
                    <option value="dance">ריקוד</option>
                    <option value="other">אחר</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm">תגים (מופרדים בפסיק)</span>
                  <input className="w-full border rounded px-3 py-2"
                         value={(form.tags||[]).join(", ")}
                         onChange={(e)=>setForm(f=>({...f, tags:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)}))}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm">סולם</span>
                    <input className="w-full border rounded px-3 py-2" value={form.key||""} onChange={(e)=>setForm(f=>({...f, key:e.target.value || undefined}))} />
                  </label>
                  <label className="block">
                    <span className="text-sm">BPM</span>
                    <input type="number" className="w-full border rounded px-3 py-2" value={form.tempo_bpm ?? ""} onChange={(e)=>setForm(f=>({...f, tempo_bpm: e.target.value ? Number(e.target.value) : undefined}))} />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm">יוטיוב</span>
                  <input className="w-full border rounded px-3 py-2"
                         value={form.links?.youtube || ""}
                         onChange={(e)=>setForm(f=>({...f, links:{...f.links, youtube:e.target.value}}))}
                  />
                </label>

                <label className="block">
                  <span className="text-sm">מצב</span>
                  <select className="w-full border rounded px-3 py-2" value={form.status || "published"} onChange={(e)=>setForm(f=>({...f, status: e.target.value as any}))}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm">ChordPro</span>
                  <textarea rows={8} className="w-full border rounded px-3 py-2 font-mono"
                            value={form.chords_chordpro || ""}
                            onChange={(e)=>setForm(f=>({...f, chords_chordpro:e.target.value}))}
                  />
                </label>

                <label className="block">
                  <span className="text-sm">מילים</span>
                  <textarea rows={6} className="w-full border rounded px-3 py-2"
                            value={form.lyrics_he || ""}
                            onChange={(e)=>setForm(f=>({...f, lyrics_he:e.target.value}))}
                  />
                </label>

                <label className="block">
                  <span className="text-sm">הערות</span>
                  <textarea rows={3} className="w-full border rounded px-3 py-2"
                            value={form.notes || ""}
                            onChange={(e)=>setForm(f=>({...f, notes:e.target.value}))}
                  />
                </label>
              </div>
            </div>

            {/* העלאות */}
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <CloudinaryUpload
                label="Audio MP3"
                resourceType="video" /* Cloudinary מחשיב אודיו כ-video */
                value={form.assets?.audio_mp3}
                onChange={(url)=>setForm(f=>({...f, assets:{...f.assets, audio_mp3:url}}))}
              />
              <CloudinaryUpload
                label="PDF Chords"
                resourceType="raw"
                value={form.assets?.pdf_chords}
                onChange={(url)=>setForm(f=>({...f, assets:{...f.assets, pdf_chords:url}}))}
              />
            </div>

            <div className="mt-6 flex items-center justify-between">
              {editing ? (
                <span className="text-xs opacity-60">ID: {form._id}</span>
              ) : <span />}

              <div className="flex gap-2">
                <button disabled={busy} onClick={()=>setOpen(false)} className="px-4 py-2 rounded border disabled:opacity-50">בטל</button>
                <button disabled={busy || !form.title_he} onClick={save} className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50">
                  {busy ? "שומר..." : (editing ? "שמור" : "צור")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
