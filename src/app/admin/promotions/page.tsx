// // src/app/admin/promotions/page.tsx
// "use client";
// import React from "react";

// type Promo = {
//   _id?: string;
//   title: string;
//   body?: string;
//   imageUrl?: string;
//   ctaText?: string;
//   link?: string;
//   couponCode?: string;
//   placements: string[];
//   audience?: { countries?: string[]; genres?: string[] };
//   startsAt?: string | null;
//   endsAt?: string | null;
//   createdAt?: string;
//   updatedAt?: string;
// };

// const PLACEMENTS = [
//   "feed_top",
//   "banner",
//   "interstitial",
//   "sidebar",
//   "shorts",
//   "profile",
// ];

// function cn(...xs: Array<string | false | null | undefined>) {
//   return xs.filter(Boolean).join(" ");
// }

// function isActive(p: Promo) {
//   const now = new Date().getTime();
//   const s = p.startsAt ? new Date(p.startsAt).getTime() : -Infinity;
//   const e = p.endsAt ? new Date(p.endsAt).getTime() : Infinity;
//   return now >= s && now <= e;
// }

// function PreviewCard({ p }: { p: Promo }) {
//   return (
//     <div className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70">
//       {p.imageUrl && (
//         <img src={p.imageUrl} alt="" className="w-full max-h-56 object-cover" />
//       )}
//       <div className="p-3">
//         <div className="font-bold">{p.title || "כותרת"}</div>
//         {p.body && <div className="mt-1 text-sm opacity-80">{p.body}</div>}
//         <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
//           {p.ctaText && (
//             <span className="rounded-full bg-violet-100 text-violet-800 px-2 py-0.5 dark:bg-violet-500/15 dark:text-violet-300">
//               {p.ctaText}
//             </span>
//           )}
//           {p.couponCode && (
//             <button
//               onClick={() => navigator.clipboard.writeText(p.couponCode || "")}
//               className="rounded-full border px-2 py-0.5 hover:bg-black/5 dark:hover:bg-white/5"
//               title="העתק קופון"
//             >
//               קופון: {p.couponCode}
//             </button>
//           )}
//           <span
//             className={cn(
//               "ms-auto rounded-full px-2 py-0.5",
//               isActive(p)
//                 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
//                 : "bg-black/5 dark:bg-white/5",
//             )}
//           >
//             {isActive(p) ? "פעיל" : "כבוי"}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function AdminPromotionsPage() {
//   const [items, setItems] = React.useState<Promo[]>([]);
//   const [loading, setLoading] = React.useState(true);
//   const [q, setQ] = React.useState("");
//   const [placement, setPlacement] = React.useState<string>("");
//   const [onlyActive, setOnlyActive] = React.useState(true);
//   const [sel, setSel] = React.useState<Promo | null>(null);
//   const [saving, setSaving] = React.useState(false);
//   const [error, setError] = React.useState<string | null>(null);

//   async function load() {
//     setLoading(true);
//     setError(null);
//     try {
//       const params = new URLSearchParams();
//       if (q) params.set("q", q);
//       if (placement) params.set("placement", placement);
//       if (onlyActive) params.set("active", "1");
//       params.set("limit", "120");
//       const r = await fetch(`/api/admin/promotions?${params.toString()}`, {
//         cache: "no-store",
//         headers: { "x-maty-admin": "1" },
//       });
//       const j = await r.json();
//       if (!j?.ok) throw new Error(j?.error || "load_error");
//       setItems(j.items || []);
//     } catch (e: any) {
//       setError(e?.message || "שגיאה");
//     } finally {
//       setLoading(false);
//     }
//   }

//   React.useEffect(() => {
//     load(); /* eslint-disable-next-line */
//   }, []);
//   React.useEffect(() => {
//     const id = setTimeout(load, 300);
//     return () => clearTimeout(id);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [q, placement, onlyActive]);

//   function newPromo(): Promo {
//     return {
//       title: "",
//       body: "",
//       placements: ["feed_top"],
//       imageUrl: "",
//       ctaText: "",
//       link: "",
//       couponCode: "",
//       startsAt: null,
//       endsAt: null,
//     };
//   }

//   async function save() {
//     if (!sel) return;
//     setSaving(true);
//     setError(null);
//     const payload: any = { ...sel };
//     // תאריכים כ־ISO או null
//     if (payload.startsAt === "") payload.startsAt = null;
//     if (payload.endsAt === "") payload.endsAt = null;
//     try {
//       const isEdit = !!sel._id;
//       const url = isEdit
//         ? `/api/admin/promotions/${sel._id}`
//         : `/api/admin/promotions`;
//       const method = isEdit ? "PUT" : "POST";
//       const r = await fetch(url, {
//         method,
//         headers: { "content-type": "application/json", "x-maty-admin": "1" },
//         body: JSON.stringify(payload),
//       });
//       const j = await r.json();
//       if (!j?.ok) throw new Error(j?.error || "save_error");
//       setSel(null);
//       await load();
//     } catch (e: any) {
//       setError(e?.message || "שגיאה בשמירה");
//     } finally {
//       setSaving(false);
//     }
//   }

//   async function del(id: string) {
//     if (!confirm("למחוק פרומו זה?")) return;
//     try {
//       const r = await fetch(`/api/admin/promotions/${id}`, {
//         method: "DELETE",
//         headers: { "x-maty-admin": "1" },
//       });
//       const j = await r.json();
//       if (!j?.ok) throw new Error(j?.error || "delete_error");
//       await load();
//     } catch (e: any) {
//       alert(e?.message || "שגיאה במחיקה");
//     }
//   }

//   function exportCSV() {
//     const head = [
//       "_id",
//       "title",
//       "ctaText",
//       "couponCode",
//       "placements",
//       "startsAt",
//       "endsAt",
//       "link",
//       "imageUrl",
//       "createdAt",
//       "updatedAt",
//     ];
//     const rows = items.map((p) => [
//       p._id || "",
//       p.title || "",
//       p.ctaText || "",
//       p.couponCode || "",
//       (p.placements || []).join("|"),
//       p.startsAt || "",
//       p.endsAt || "",
//       p.link || "",
//       p.imageUrl || "",
//       p.createdAt || "",
//       p.updatedAt || "",
//     ]);
//     const csv = [
//       head.join(","),
//       ...rows.map((r) => r.map((x) => JSON.stringify(x)).join(",")),
//     ].join("\n");
//     const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `promotions-${Date.now()}.csv`;
//     a.click();
//     URL.revokeObjectURL(url);
//   }

//   return (
//     <main className="mx-auto max-w-6xl px-4 py-6" dir="rtl">
//       <header className="mb-4">
//         <h1 className="text-3xl font-extrabold">ניהול פרומואים (MATY-CLUB)</h1>
//         <p className="opacity-70">
//           הוספה/עריכה/מחיקה · פילטרים · ייצוא CSV · תצוגה מקדימה
//         </p>
//       </header>

//       <div className="mb-3 flex flex-wrap items-center gap-2">
//         <div className="relative">
//           <input
//             value={q}
//             onChange={(e) => setQ(e.target.value)}
//             placeholder="חיפוש (כותרת/טקסט/קופון)…"
//             className="h-9 w-72 rounded-xl border bg-transparent px-3 text-sm"
//           />
//           <span className="absolute end-2 top-1.5 opacity-60">🔎</span>
//         </div>

//         <select
//           className="h-9 rounded-xl border bg-transparent px-2 text-sm"
//           value={placement}
//           onChange={(e) => setPlacement(e.target.value)}
//         >
//           <option value="">כל המיקומים</option>
//           {PLACEMENTS.map((p) => (
//             <option key={p} value={p}>
//               {p}
//             </option>
//           ))}
//         </select>

//         <label className="ms-2 flex items-center gap-2 text-sm">
//           <input
//             type="checkbox"
//             checked={onlyActive}
//             onChange={(e) => setOnlyActive(e.target.checked)}
//           />
//           להציג רק פעילים
//         </label>

//         <button
//           onClick={() => setSel(newPromo())}
//           className="ms-auto rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
//         >
//           + פרומו חדש
//         </button>
//         <button
//           onClick={exportCSV}
//           className="rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
//         >
//           ייצוא CSV
//         </button>
//       </div>

//       {error && (
//         <div className="mb-3 rounded-xl border border-rose-300/40 bg-rose-100/80 dark:bg-rose-500/10 p-2 text-rose-800 dark:text-rose-300">
//           {error}
//         </div>
//       )}

//       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//         {loading
//           ? Array.from({ length: 6 }).map((_, i) => (
//               <div
//                 key={i}
//                 className="h-44 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5"
//               />
//             ))
//           : items.map((p) => (
//               <div
//                 key={p._id}
//                 className="flex flex-col rounded-2xl border border-black/10 dark:border-white/10 p-3 bg-white/70 dark:bg-neutral-900/70"
//               >
//                 <PreviewCard p={p} />
//                 <div className="mt-2 flex items-center gap-2 text-xs">
//                   <span className="rounded-full bg-black/5 px-2 py-0.5 dark:bg-white/5">
//                     {(p.placements || []).join(", ") || "—"}
//                   </span>
//                   <span className="ms-auto opacity-70">{p._id?.slice(-8)}</span>
//                 </div>
//                 <div className="mt-2 flex items-center gap-2">
//                   <button
//                     onClick={() => setSel(p)}
//                     className="rounded-xl border px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/5"
//                   >
//                     עריכה
//                   </button>
//                   <button
//                     onClick={() => del(p._id!)}
//                     className="rounded-xl border px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/5"
//                   >
//                     מחיקה
//                   </button>
//                   {p.link && (
//                     <a
//                       href={p.link}
//                       target="_blank"
//                       className="ms-auto rounded-xl border px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/5"
//                     >
//                       פתיחה
//                     </a>
//                   )}
//                 </div>
//               </div>
//             ))}
//       </div>

//       {/* טופס עריכה/הוספה */}
//       {sel && (
//         <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
//           <div className="w-full max-w-2xl rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4">
//             <div className="mb-2 flex items-center">
//               <div className="text-xl font-bold">
//                 {sel._id ? "עריכת פרומו" : "פרומו חדש"}
//               </div>
//               <button
//                 onClick={() => setSel(null)}
//                 className="ms-auto rounded-xl border px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/5"
//               >
//                 סגור
//               </button>
//             </div>

//             <div className="grid gap-3 md:grid-cols-2">
//               <label className="grid gap-1 text-sm">
//                 כותרת
//                 <input
//                   className="rounded-xl border bg-transparent px-3 py-2"
//                   value={sel.title}
//                   onChange={(e) => setSel({ ...sel, title: e.target.value })}
//                 />
//               </label>
//               <label className="grid gap-1 text-sm">
//                 טקסט
//                 <input
//                   className="rounded-xl border bg-transparent px-3 py-2"
//                   value={sel.body || ""}
//                   onChange={(e) => setSel({ ...sel, body: e.target.value })}
//                 />
//               </label>
//               <label className="grid gap-1 text-sm">
//                 CTA
//                 <input
//                   className="rounded-xl border bg-transparent px-3 py-2"
//                   value={sel.ctaText || ""}
//                   onChange={(e) => setSel({ ...sel, ctaText: e.target.value })}
//                 />
//               </label>
//               <label className="grid gap-1 text-sm">
//                 לינק
//                 <input
//                   className="rounded-xl border bg-transparent px-3 py-2"
//                   value={sel.link || ""}
//                   onChange={(e) => setSel({ ...sel, link: e.target.value })}
//                 />
//               </label>
//               <label className="grid gap-1 text-sm">
//                 תמונה (URL)
//                 <input
//                   className="rounded-xl border bg-transparent px-3 py-2"
//                   value={sel.imageUrl || ""}
//                   onChange={(e) => setSel({ ...sel, imageUrl: e.target.value })}
//                 />
//               </label>
//               <label className="grid gap-1 text-sm">
//                 קוד קופון
//                 <input
//                   className="rounded-xl border bg-transparent px-3 py-2"
//                   value={sel.couponCode || ""}
//                   onChange={(e) =>
//                     setSel({ ...sel, couponCode: e.target.value })
//                   }
//                 />
//               </label>
//               <label className="grid gap-1 text-sm">
//                 מתחיל ב־
//                 <input
//                   type="datetime-local"
//                   className="rounded-xl border bg-transparent px-3 py-2"
//                   value={sel.startsAt ? sel.startsAt.slice(0, 16) : ""}
//                   onChange={(e) =>
//                     setSel({
//                       ...sel,
//                       startsAt: e.target.value
//                         ? new Date(e.target.value).toISOString()
//                         : null,
//                     })
//                   }
//                 />
//               </label>
//               <label className="grid gap-1 text-sm">
//                 מסתיים ב־
//                 <input
//                   type="datetime-local"
//                   className="rounded-xl border bg-transparent px-3 py-2"
//                   value={sel.endsAt ? sel.endsAt.slice(0, 16) : ""}
//                   onChange={(e) =>
//                     setSel({
//                       ...sel,
//                       endsAt: e.target.value
//                         ? new Date(e.target.value).toISOString()
//                         : null,
//                     })
//                   }
//                 />
//               </label>

//               <div className="md:col-span-2">
//                 <div className="text-sm mb-1">מיקומים</div>
//                 <div className="flex flex-wrap gap-2">
//                   {PLACEMENTS.map((pl) => {
//                     const on = sel.placements?.includes(pl);
//                     return (
//                       <button
//                         key={pl}
//                         onClick={() => {
//                           const set = new Set(sel.placements || []);
//                           on ? set.delete(pl) : set.add(pl);
//                           setSel({ ...sel, placements: Array.from(set) });
//                         }}
//                         className={cn(
//                           "rounded-full border px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/5",
//                           on && "bg-black/5 dark:bg-white/5 font-bold",
//                         )}
//                       >
//                         {pl}
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>

//               <div className="md:col-span-2">
//                 <div className="text-sm mb-1">תצוגה מקדימה</div>
//                 <PreviewCard p={sel} />
//               </div>
//             </div>

//             <div className="mt-3 flex items-center gap-2">
//               <button
//                 onClick={save}
//                 disabled={saving || !sel.title}
//                 className="rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
//               >
//                 שמירה
//               </button>
//               <button
//                 onClick={() => setSel(null)}
//                 className="rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
//               >
//                 ביטול
//               </button>
//               <span className="ms-auto text-xs opacity-70">
//                 {sel._id ? `ID: ${sel._id}` : "חדש"}
//               </span>
//             </div>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }

// src/app/admin/club/promotions/page.tsx
"use client";

import * as React from "react";

type Item = {
  _id: string;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  ctaText?: string | null;
  link?: string | null;
  couponCode?: string | null;
  placement:
    | "feed_top"
    | "feed_middle"
    | "feed_bottom"
    | "sidebar"
    | "interstitial";
  weight?: number;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  impressions?: number;
  clicks?: number;
  createdAt?: string;
  updatedAt?: string | null;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try {
      const j = await r.json();
      if (j?.error) msg = String(j.error);
    } catch {}
    throw new Error(msg);
  }
  return r.json() as any;
}

export default function AdminClubPromotionsPage() {
  const [rows, setRows] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Partial<Item> | null>(null);

  async function load() {
    try {
      setLoading(true);
      const data = await api<{ ok: boolean; items: Item[] }>(
        "/api/club/promotions?limit=100",
      );
      setRows(data.items || []);
      setErr(null);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }
  React.useEffect(() => {
    load();
  }, []);

  async function onSave() {
    if (!draft) return;
    const payload: Partial<Item> = {
      title: draft.title?.trim() || "",
      body: draft.body ?? "",
      imageUrl: draft.imageUrl ?? "",
      ctaText: draft.ctaText ?? "",
      link: draft.link ?? "",
      couponCode: draft.couponCode ?? "",
      placement: (draft.placement as any) || "feed_top",
      weight: Number.isFinite(draft.weight as number)
        ? Number(draft.weight)
        : 1,
      active: !!draft.active,
      startsAt: draft.startsAt || null,
      endsAt: draft.endsAt || null,
    };

    try {
      if (draft._id) {
        await api(`/api/club/promotions/${draft._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/api/club/promotions`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setDraft(null);
      await load();
    } catch (e: any) {
      alert(String(e?.message || e));
    }
  }

  async function onDelete(id: string) {
    if (!confirm("למחוק פרסום?")) return;
    await api(`/api/club/promotions/${id}`, { method: "DELETE" });
    await load();
  }

  async function onToggle(id: string, active: boolean) {
    await api(`/api/club/promotions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    });
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, active } : r)));
  }

  async function onBumpWeight(id: string, delta: number) {
    const row = rows.find((x) => x._id === id);
    if (!row) return;
    const next = Math.max(1, (row.weight || 1) + delta);
    await api(`/api/club/promotions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ weight: next }),
    });
    // עדכון לוקלי מהיר + רענון קל כדי לקבל מיון חדש מהשרת
    setRows((prev) =>
      prev
        .map((r) => (r._id === id ? { ...r, weight: next } : r))
        .sort(
          (a, b) =>
            (b.active ? 1 : 0) - (a.active ? 1 : 0) ||
            (b.weight || 0) - (a.weight || 0),
        ),
    );
  }

  function fmtDate(d?: string | null) {
    return d ? new Date(d).toLocaleString() : "—";
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">פרסומי MATY-CLUB</h1>
        <button
          className="rounded-xl px-3 py-2 text-sm border hover:bg-black/5 dark:hover:bg-white/10"
          onClick={() =>
            setDraft({
              title: "",
              placement: "feed_top",
              active: true,
              weight: 1,
            })
          }
        >
          + פרסום חדש
        </button>
      </div>

      {loading ? (
        <div>טוען…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm border-separate border-spacing-y-1">
            <thead>
              <tr className="text-right opacity-70">
                <th className="px-2">כותרת</th>
                <th className="px-2">מיקום</th>
                <th className="px-2">תמונה</th>
                <th className="px-2">CTA</th>
                <th className="px-2">קישור</th>
                <th className="px-2">משקל</th>
                <th className="px-2">פעיל</th>
                <th className="px-2">מתאריך</th>
                <th className="px-2">עד</th>
                <th className="px-2">Impr.</th>
                <th className="px-2">Clicks</th>
                <th className="px-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r._id}
                  className="bg-white/80 dark:bg-neutral-900/60 backdrop-blur border rounded-xl"
                >
                  <td className="px-2 py-2 font-medium">{r.title}</td>
                  <td className="px-2">{r.placement}</td>
                  <td className="px-2">
                    {r.imageUrl ? (
                      <img
                        src={r.imageUrl}
                        alt=""
                        className="w-16 h-10 object-cover rounded"
                      />
                    ) : (
                      <span className="opacity-50">—</span>
                    )}
                  </td>
                  <td className="px-2">
                    {r.ctaText || <span className="opacity-50">—</span>}
                  </td>
                  <td className="px-2">
                    {r.link ? (
                      <a
                        className="text-blue-600 underline"
                        href={r.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        קישור
                      </a>
                    ) : (
                      <span className="opacity-50">—</span>
                    )}
                  </td>
                  <td className="px-2">
                    <div className="inline-flex items-center gap-1">
                      <button
                        className="px-2 py-1 rounded border hover:bg-black/5 dark:hover:bg-white/10"
                        title="הורד משקל"
                        onClick={() => onBumpWeight(r._id, -1)}
                      >
                        −
                      </button>
                      <span className="px-2 tabular-nums">{r.weight ?? 1}</span>
                      <button
                        className="px-2 py-1 rounded border hover:bg-black/5 dark:hover:bg-white/10"
                        title="העלה משקל"
                        onClick={() => onBumpWeight(r._id, +1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-2">
                    <button
                      className={
                        "px-2 py-1 rounded border " +
                        (r.active
                          ? "bg-emerald-600 text-white"
                          : "hover:bg-black/5 dark:hover:bg-white/10")
                      }
                      onClick={() => onToggle(r._id, !r.active)}
                    >
                      {r.active ? "פעיל" : "כבוי"}
                    </button>
                  </td>
                  <td className="px-2">{fmtDate(r.startsAt)}</td>
                  <td className="px-2">{fmtDate(r.endsAt)}</td>
                  <td className="px-2 tabular-nums">{r.impressions ?? 0}</td>
                  <td className="px-2 tabular-nums">{r.clicks ?? 0}</td>
                  <td className="px-2">
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 rounded border hover:bg-black/5 dark:hover:bg-white/10"
                        onClick={() => setDraft(r)}
                      >
                        ערוך
                      </button>
                      <button
                        className="px-2 py-1 rounded border text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => onDelete(r._id)}
                      >
                        מחק
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-3 py-8 text-center opacity-70">
                    אין פרסומים עדיין.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* מודאל יצירה/עריכה */}
      {draft && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[4000]">
          <div className="w-[760px] max-w-[92vw] rounded-2xl bg-white dark:bg-neutral-950 border p-4">
            <h2 className="text-lg font-semibold mb-3">
              {draft._id ? "עריכת פרסום" : "פרסום חדש"}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                כותרת *
                <input
                  className="w-full mt-1 px-2 py-1.5 rounded border bg-transparent"
                  value={draft.title || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  maxLength={140}
                />
              </label>

              <label className="text-sm">
                CTA
                <input
                  className="w-full mt-1 px-2 py-1.5 rounded border bg-transparent"
                  value={draft.ctaText || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, ctaText: e.target.value })
                  }
                  maxLength={60}
                />
              </label>

              <label className="text-sm col-span-2">
                תיאור
                <textarea
                  className="w-full mt-1 px-2 py-1.5 rounded border bg-transparent min-h-20"
                  value={draft.body || ""}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  maxLength={1000}
                />
              </label>

              <label className="text-sm">
                תמונה (URL)
                <input
                  className="w-full mt-1 px-2 py-1.5 rounded border bg-transparent"
                  value={draft.imageUrl || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, imageUrl: e.target.value })
                  }
                />
              </label>

              <label className="text-sm">
                קישור (URL)
                <input
                  className="w-full mt-1 px-2 py-1.5 rounded border bg-transparent"
                  value={draft.link || ""}
                  onChange={(e) => setDraft({ ...draft, link: e.target.value })}
                />
              </label>

              <label className="text-sm">
                קופון
                <input
                  className="w-full mt-1 px-2 py-1.5 rounded border bg-transparent"
                  value={draft.couponCode || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, couponCode: e.target.value })
                  }
                  maxLength={60}
                />
              </label>

              <label className="text-sm">
                מיקום
                <select
                  className="w-full mt-1 px-2 py-1.5 rounded border bg-transparent"
                  value={(draft.placement as any) || "feed_top"}
                  onChange={(e) =>
                    setDraft({ ...draft, placement: e.target.value as any })
                  }
                >
                  <option value="feed_top">ראש הפיד</option>
                  <option value="feed_middle">אמצע הפיד</option>
                  <option value="feed_bottom">סוף הפיד</option>
                  <option value="sidebar">סיידבר</option>
                  <option value="interstitial">מסך ביניים</option>
                </select>
              </label>

              <label className="text-sm">
                משקל
                <input
                  type="number"
                  min={1}
                  max={99}
                  className="w-full mt-1 px-2 py-1.5 rounded border bg-transparent"
                  value={Number(draft.weight ?? 1)}
                  onChange={(e) =>
                    setDraft({ ...draft, weight: Number(e.target.value || 1) })
                  }
                />
              </label>

              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!draft.active}
                  onChange={(e) =>
                    setDraft({ ...draft, active: e.target.checked })
                  }
                />
                פעיל
              </label>

              <label className="text-sm">
                התחלה (אופציונלי)
                <input
                  type="datetime-local"
                  className="w-full mt-1 px-2 py-1.5 rounded border bg-transparent"
                  value={draft.startsAt ? draft.startsAt.slice(0, 16) : ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      startsAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                />
              </label>

              <label className="text-sm">
                סיום (אופציונלי)
                <input
                  type="datetime-local"
                  className="w-full mt-1 px-2 py-1.5 rounded border bg-transparent"
                  value={draft.endsAt ? draft.endsAt.slice(0, 16) : ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      endsAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-3 py-1.5 rounded border hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => setDraft(null)}
              >
                ביטול
              </button>
              <button
                disabled={!draft.title?.trim()}
                className="px-3 py-1.5 rounded border bg-emerald-600 text-white disabled:opacity-50"
                onClick={onSave}
              >
                שמירה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
