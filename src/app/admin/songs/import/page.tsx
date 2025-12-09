// src/app/admin/songs/import/page.tsx
"use client";
import { useState } from "react";

export default function ImportSongsPage() {
  const [csv, setCsv] = useState("");
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function onImport() {
    setLoading(true);
    const r = await fetch("/api/songs/bulk", { method: "POST", body: csv, headers: { "Content-Type": "text/plain;charset=utf-8" }});
    const j = await r.json();
    setRes(j);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">ייבוא ניגוני חב״ד (CSV)</h1>
      <textarea className="w-full h-64 border rounded p-3 font-mono" value={csv} onChange={(e)=>setCsv(e.target.value)} placeholder="הדבק כאן CSV" />
      <button onClick={onImport} disabled={loading} className="px-4 py-2 rounded bg-violet-600 text-white disabled:opacity-50">
        {loading ? "מייבא..." : "ייבוא"}
      </button>
      {res && <pre className="bg-slate-950/80 text-white p-3 rounded overflow-auto">{JSON.stringify(res, null, 2)}</pre>}
    </div>
  );
}
