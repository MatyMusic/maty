// "use client";
// import { useEffect, useState } from "react";

// const empty = {
//   fullName: "", email:"", phone:"",
//   address: { street:"", city:"", region:"", zip:"", country:"IL" },
//   status: "lead", notes: "", tags: [], source:""
// };

// export default function CustomerEditor({ params }: { params: { id: string } }) {
//   const isNew = params.id === "new";
//   const [data, setData] = useState<any>(empty);
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     if (isNew) return;
//     fetch(`/api/admin/customers/${params.id}`).then(r=>r.json()).then(setData);
//   }, [isNew, params.id]);

//   const save = async () => {
//     setSaving(true);
//     const method = isNew ? "POST" : "PATCH";
//     const url = isNew ? "/api/admin/customers" : `/api/admin/customers/${params.id}`;
//     const res = await fetch(url, { method, headers: { "Content-Type":"application/json" }, body: JSON.stringify(data) });
//     setSaving(false);
//     if (!res.ok) return alert("שגיאה בשמירה");
//     window.location.href = "/admin/customers";
//   };

//   const del = async () => {
//     if (isNew) return;
//     if (!confirm("למחוק את הלקוח?")) return;
//     const res = await fetch(`/api/admin/customers/${params.id}`, { method:"DELETE" });
//     if (res.ok) window.location.href = "/admin/customers";
//   };

//   return (
//     <div className="space-y-4">
//       <h2 className="text-xl font-bold">{isNew ? "לקוח חדש" : "עריכת לקוח"}</h2>

//       <div className="grid sm:grid-cols-2 gap-3">
//         <input className="input" placeholder="שם מלא" value={data.fullName} onChange={e=>setData({...data, fullName:e.target.value})}/>
//         <input className="input" placeholder="אימייל" value={data.email} onChange={e=>setData({...data, email:e.target.value})}/>
//         <input className="input" placeholder="טלפון" value={data.phone} onChange={e=>setData({...data, phone:e.target.value})}/>
//         <select className="input" value={data.status} onChange={e=>setData({...data, status:e.target.value})}>
//           {["lead","contacted","qualified","booked","archived"].map(s => <option key={s} value={s}>{s}</option>)}
//         </select>

//         <input className="input" placeholder="רחוב" value={data.address.street} onChange={e=>setData({...data, address:{...data.address, street:e.target.value}})}/>
//         <input className="input" placeholder="עיר"   value={data.address.city}   onChange={e=>setData({...data, address:{...data.address, city:e.target.value}})}/>
//         <input className="input" placeholder="אזור/מחוז" value={data.address.region} onChange={e=>setData({...data, address:{...data.address, region:e.target.value}})}/>
//         <input className="input" placeholder="מיקוד" value={data.address.zip} onChange={e=>setData({...data, address:{...data.address, zip:e.target.value}})}/>
//       </div>

//       <textarea className="input h-28" placeholder="הערות" value={data.notes} onChange={e=>setData({...data, notes:e.target.value})}/>
//       <input className="input" placeholder="תגיות מופרדות בפסיקים" value={data.tags?.join(", ")} onChange={e=>setData({...data, tags:e.target.value.split(",").map((s)=>s.trim()).filter(Boolean)})}/>
//       <input className="input" placeholder="מקור (Facebook/Google/הפניה)" value={data.source} onChange={e=>setData({...data, source:e.target.value})}/>

//       <div className="flex gap-2">
//         <button className="btn bg-emerald-600 text-white" onClick={save} disabled={saving}>{saving ? "שומר…" : "שמור"}</button>
//         {!isNew && <button className="btn bg-red-600 text-white" onClick={del}>מחק</button>}
//         <a className="btn" href="/admin/customers">חזרה</a>
//       </div>
//     </div>
//   );
// }

// src/app/admin/customers/[id]/page.tsx
import type { Metadata } from "next";

type PageParams = {
  id: string;
};

// ב-Next 15 עם typedRoutes: params הוא Promise<PageParams>
type PageProps = {
  params: Promise<PageParams>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `פרטי לקוח #${id} — אדמין | MATY`,
  };
}

export default async function AdminCustomerPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <main dir="rtl" className="mx-auto max-w-4xl p-4 grid gap-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">פרטי לקוח</h1>
        <a
          href="/admin/customers"
          className="rounded-full h-10 px-4 grid place-items-center text-sm font-semibold bg-white/80 dark:bg-neutral-900/80 border border-black/10 dark:border-white/10"
        >
          חזרה לרשימת הלקוחות
        </a>
      </header>

      <section className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/80 dark:bg-neutral-900/70">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          זהו דף פרטי לקוח בסיסי עבור לקוח עם מזהה:
        </p>
        <p className="mt-2 font-mono text-base break-all">{id}</p>

        {/*
          כאן בהמשך אפשר:
          - להביא נתוני לקוח מ-DB
          - להציג תשלומים, סטטוס, מנויים וכו'
        */}
      </section>
    </main>
  );
}
