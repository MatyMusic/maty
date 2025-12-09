// src/app/songs/page.tsx
export const dynamic = "force-dynamic";

export default async function SongsPage(){
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/tracks?limit=100`, { cache:"no-store" });
  const j = await r.json().catch(()=>({}));
  const rows = Array.isArray(j?.rows)? j.rows : [];

  return (
    <div className="container-section section-padding" dir="rtl">
      <h1 className="text-2xl font-extrabold mb-4">שירים</h1>
      {rows.length===0 && <div className="mm-card p-6">אין שירים עדיין.</div>}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((t:any)=>(
          <div key={t.audioUrl} className="card p-3">
            <div className="font-semibold">{t.title}</div>
            <div className="text-xs opacity-70">{t.artist||""}</div>
            <audio src={t.audioUrl} controls className="w-full mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
