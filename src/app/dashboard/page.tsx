// // src/app/dashboard/page.tsx
// import { auth } from "@/auth";
// import { redirect } from "next/navigation";
// import Link from "next/link";

// type UserSession = {
//   name?: string | null;
//   email?: string | null;
//   id?: string | null;
//   role?: string | null;
//   image?: string | null;
// };

// export default async function DashboardPage() {
//   const session = await auth();
//   const u = (session?.user as UserSession) || null;

//   // לא מחובר → שלח למסך התחברות עם חזרה לדשבורד
//   if (!u) {
//     redirect("/auth/signin?callbackUrl=/dashboard");
//   }

//   // לא אדמין → שלח הביתה (או תחליף ל־/403 אם בנית עמוד 403)
//   if ((u.role ?? "user") !== "admin") {
//     redirect("/");
//   }

//   return (
//     <main className="container-section section-padding">
//       <div className="flex items-center gap-3 mb-4">
//         {u.image ? (
//           <img
//             src={u.image}
//             alt={u.name ?? "user"}
//             className="h-12 w-12 rounded-full object-cover border"
//           />
//         ) : (
//           <div className="h-12 w-12 rounded-full bg-gray-300" />
//         )}
//         <div>
//           <h1 className="text-2xl font-extrabold">שלום {u.name || u.email} 👋</h1>
//           <p className="text-sm opacity-70">תפקיד: מנהל • גישה מלאה</p>
//         </div>
//       </div>

//       <div className="grid gap-3 max-w-2xl">
//         <div className="card p-4">
//           <div><b>שם:</b> {u.name || "—"}</div>
//           <div><b>אימייל:</b> {u.email || "—"}</div>
//           <div><b>מזהה:</b> {u.id || "—"}</div>
//           <div><b>Role:</b> {u.role || "—"}</div>
//         </div>

//         <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
//           <Link href="/admin/users" className="btn">משתמשים</Link>
//           <Link href="/admin/songs" className="btn">שירים</Link>
//           <Link href="/admin/events" className="btn">אירועים</Link>
//           <Link href="/admin/stats" className="btn">סטטיסטיקות</Link>
//           <Link href="/admin/settings" className="btn">הגדרות</Link>
//         </div>
//       </div>

//       <div className="mt-6">
//         <Link href="/api/auth/signout?callbackUrl=/" className="btn">התנתק</Link>
//       </div>
//     </main>
//   );
// }
// src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

/* =============================================================
   DASHBOARD — Deluxe client version
   - מחליף את ה־RSC redirect בסייד־קליינט כדי לאפשר אינטראקציות כבדות
   - כולל: סטטיסטיקות, גרפים SVG בלי תלות, טבלת הזמנות, יצוא CSV/XLSX/PDF,
            הורדת קבלה, לוג פעילות, קיצורי דרך, וידג׳טים קטנים
   ============================================================= */

type OrderStatus = "paid" | "refunded" | "pending" | "failed" | "hold";

type OrderRow = {
  id: string; // מס׳ הזמנה פנימי (UUID / רץ)
  receiptNo?: string | null; // מס׳ קבלה לצורך הורדות
  date: string; // YYYY-MM-DD
  title: string; // תיאור
  amount: number; // בשקלים
  currency?: string; // ברירת מחדל ILS
  status: OrderStatus;
  channel?: "site" | "club" | "date" | "admin" | "pos";
};

/* ====================== עזרי פורמט ====================== */
function money(n: number, currency = "ILS") {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

function cls(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function statusPill(s: OrderStatus) {
  const base =
    "inline-flex items-center h-7 px-2.5 rounded-full text-xs border font-medium";
  if (s === "paid")
    return (
      base +
      " bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/20"
    );
  if (s === "refunded")
    return (
      base + " bg-sky-600/10 text-sky-700 dark:text-sky-300 border-sky-600/20"
    );
  if (s === "pending")
    return (
      base +
      " bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
    );
  if (s === "hold")
    return (
      base +
      " bg-fuchsia-600/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-600/20"
    );
  return (
    base + " bg-rose-600/10 text-rose-700 dark:text-rose-300 border-rose-600/20"
  ); // failed
}

/* ====================== נתוני דמו (פולבק) ====================== */
const FALLBACK_ORDERS: OrderRow[] = [
  {
    id: "B-2024-1189",
    receiptNo: "R-79351",
    date: "2025-08-12",
    title: "בר מצווה – נתניה",
    amount: 4200,
    status: "paid",
    channel: "site",
  },
  {
    id: "B-2024-1191",
    receiptNo: "R-79373",
    date: "2025-08-21",
    title: "חתונה – ירושלים",
    amount: 9600,
    status: "hold",
    channel: "admin",
  },
  {
    id: "B-2024-1198",
    receiptNo: "R-79428",
    date: "2025-09-01",
    title: "אירוע קהילה – חיפה",
    amount: 6500,
    status: "pending",
    channel: "site",
  },
  {
    id: "B-2024-1204",
    receiptNo: "R-79502",
    date: "2025-09-10",
    title: "בת מצווה – תל אביב",
    amount: 5400,
    status: "paid",
    channel: "club",
  },
  {
    id: "B-2024-1211",
    receiptNo: "R-79547",
    date: "2025-09-18",
    title: "אירוע חברה – מרכז",
    amount: 12500,
    status: "refunded",
    channel: "admin",
  },
  {
    id: "B-2024-1220",
    receiptNo: null,
    date: "2025-10-02",
    title: "מסיבת סוכות – אשדוד",
    amount: 3800,
    status: "failed",
    channel: "site",
  },
];

/* ====================== אחזור נתונים ====================== */
function useOrders() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const r = await fetch("/api/orders?limit=100", {
          cache: "no-store",
          signal: ac.signal,
        });
        if (!r.ok) throw new Error("bad status");
        const j = await r.json().catch(() => null);
        const arr = (j?.orders as OrderRow[]) || [];
        if (!Array.isArray(arr) || !arr.length) throw new Error("empty");
        setRows(arr);
      } catch (e) {
        // נפילה → דמו
        setRows(FALLBACK_ORDERS);
        setError("fallback");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  return { loading, rows, error };
}

/* ====================== מיני גרפים (SVG ללא תלות) ====================== */
function Sparkline({
  values,
  height = 36,
}: {
  values: number[];
  height?: number;
}) {
  const w = Math.max(60, values.length * 10);
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [
    (i / Math.max(1, values.length - 1)) * (w - 6) + 3,
    height - (v / max) * (height - 6) - 3,
  ]);
  const d = pts
    .map((p, i) => (i === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`))
    .join(" ");
  return (
    <svg
      width={w}
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      className="block"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.9"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={1.8} />
      ))}
    </svg>
  );
}

function TinyBar({
  values,
  height = 48,
}: {
  values: number[];
  height?: number;
}) {
  const w = Math.max(80, values.length * 12);
  const max = Math.max(1, ...values);
  const bw = (w - 8) / values.length;
  return (
    <svg
      width={w}
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      className="block"
    >
      {values.map((v, i) => {
        const h = (v / max) * (height - 8);
        return (
          <rect
            key={i}
            x={4 + i * bw + 1}
            y={height - h - 4}
            width={Math.max(4, bw - 2)}
            height={h}
            rx={2}
            ry={2}
          />
        );
      })}
    </svg>
  );
}

/* ====================== יצוא קבצים ====================== */
function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function exportCSV(rows: OrderRow[]) {
  const cols = [
    "id",
    "date",
    "title",
    "amount",
    "currency",
    "status",
    "receiptNo",
    "channel",
  ];
  const head = cols.join(",");
  const lines = rows.map((r) =>
    [
      r.id,
      r.date,
      '"' + (r.title?.replaceAll('"', '""') || "") + '"',
      r.amount,
      r.currency || "ILS",
      r.status,
      r.receiptNo || "",
      r.channel || "",
    ].join(","),
  );
  const csv = [head, ...lines].join("\n");
  downloadBlob(
    `orders_${Date.now()}.csv`,
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
}

async function exportXLSX(rows: OrderRow[]) {
  try {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    downloadBlob(
      `orders_${Date.now()}.xlsx`,
      new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
  } catch (e) {
    alert('XLSX לא מותקן. התקן את "xlsx" בפרויקט או השתמש ב-CSV');
    exportCSV(rows);
  }
}

async function exportPDF(rows: OrderRow[]) {
  // ניסיון עם jsPDF; אם לא ניתן — נשתמש ב-window.print על HTML דינמי
  try {
    const [{ jsPDF }] = await Promise.all([
      import("jspdf"),
      new Promise((r) => setTimeout(r, 60)),
    ]);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const left = 40;
    let top = 48;
    doc.setFontSize(16);
    doc.text("דוח הזמנות", left, top);
    top += 20;
    doc.setFontSize(10);
    doc.text(new Date().toLocaleString("he-IL"), left, top);
    top += 24;

    doc.setFontSize(12);
    const headers = ["#", "תאריך", "כותרת", "סכום", "מצב", "קבלה"];
    const colX = [
      left,
      left + 60,
      left + 140,
      left + 390,
      left + 460,
      left + 520,
    ];
    headers.forEach((h, i) => doc.text(String(h), colX[i], top));
    top += 10;
    doc.setLineWidth(0.5);
    doc.line(left, top, 555, top);
    top += 12;

    doc.setFontSize(11);
    for (const r of rows) {
      if (top > 770) {
        doc.addPage();
        top = 48;
      }
      const cells = [
        r.id,
        r.date,
        r.title,
        money(r.amount, r.currency || "ILS"),
        r.status,
        r.receiptNo || "-",
      ];
      cells.forEach((c, i) =>
        doc.text(String(c), colX[i], top, { maxWidth: i === 2 ? 230 : 80 }),
      );
      top += 16;
    }

    doc.save(`orders_${Date.now()}.pdf`);
  } catch (e) {
    // חלופה: הדפסת HTML
    const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"/><title>דוח הזמנות</title>
      <style>
        body{font-family: system-ui,-apple-system,'Segoe UI',Roboto,Heebo,Tahoma; padding:24px}
        h1{font-size:20px;margin:0 0 8px}
        table{border-collapse:collapse;width:100%}
        th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px}
        th{background:#fafafa}
      </style>
    </head><body>
      <h1>דוח הזמנות</h1>
      <div>${new Date().toLocaleString("he-IL")}</div>
      <table>
        <thead>
          <tr><th>#</th><th>תאריך</th><th>כותרת</th><th>סכום</th><th>מצב</th><th>קבלה</th></tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) =>
                `<tr><td>${r.id}</td><td>${r.date}</td><td>${r.title}</td><td>${money(
                  r.amount,
                  r.currency || "ILS",
                )}</td><td>${r.status}</td><td>${r.receiptNo || "-"}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <script>window.onload=()=>{window.print(); setTimeout(()=>window.close(), 300)}</script>
    </body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    window.open(url, "_blank", "noreferrer,width=980,height=800");
  }
}

/* ====================== הורדת קבלה ====================== */
async function downloadReceipt(receiptNo: string, row?: OrderRow) {
  try {
    // אם יש לך API אמיתי:
    // const r = await fetch(`/api/receipts/${encodeURIComponent(receiptNo)}`);
    // const blob = await r.blob();
    // downloadBlob(`${receiptNo}.pdf`, blob);
    // return;

    // דמו PDF באמצעות jsPDF
    const [{ jsPDF }] = await Promise.all([
      import("jspdf"),
      new Promise((r) => setTimeout(r, 60)),
    ]);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const left = 48;
    let top = 64;
    doc.setFontSize(18);
    doc.text("קבלה", left, top);
    top += 28;
    doc.setFontSize(12);
    doc.text(`מס׳ קבלה: ${receiptNo}`, left, top);
    top += 16;
    if (row) {
      doc.text(`מס׳ הזמנה: ${row.id}`, left, top);
      top += 16;
      doc.text(`תיאור: ${row.title}`, left, top, { maxWidth: 480 });
      top += 16;
      doc.text(`תאריך: ${row.date}`, left, top);
      top += 16;
      doc.text(`סכום: ${money(row.amount, row.currency || "ILS")}`, left, top);
      top += 24;
    }
    doc.setLineWidth(0.6);
    doc.line(left, top, 550, top);
    top += 18;
    doc.text("תודה שבחרתם ב‑MATY MUSIC", left, top);
    doc.save(`${receiptNo}.pdf`);
  } catch {
    alert("לא מצליח ליצור PDF במצב דמו. ודא שתלויות כמו jsPDF מותקנות.");
  }
}

/* ====================== ווידג׳טים ====================== */
function StatCard({
  title,
  value,
  hint,
  trend,
}: {
  title: string;
  value: string;
  hint?: string;
  trend?: number[];
}) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 p-4 shadow-sm overflow-hidden relative">
      <div className="text-sm font-semibold mb-1">{title}</div>
      <div className="text-2xl font-extrabold tracking-tight">{value}</div>
      {hint && <div className="text-xs opacity-70 mt-1">{hint}</div>}
      {trend && (
        <div className="absolute left-3 bottom-2 text-slate-400 dark:text-slate-500">
          <Sparkline values={trend} />
        </div>
      )}
    </div>
  );
}

function Shortcuts({ isAdmin }: { isAdmin: boolean }) {
  const items = [
    { href: "/book", label: "הזמנה חדשה", emoji: "📝" },
    { href: "/maty-date", label: "MATY-DATE", emoji: "💞" },
    { href: "/profile", label: "הפרופיל שלי", emoji: "👤" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", emoji: "🛠" }] : []),
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 p-3 text-sm hover:bg-white dark:hover:bg-neutral-800/80 transition shadow-sm text-center"
        >
          <div className="text-2xl mb-1">{it.emoji}</div>
          {it.label}
        </Link>
      ))}
    </div>
  );
}

function ContactPanel() {
  const subject = encodeURIComponent("פנייה דרך הדשבורד");
  const body = encodeURIComponent("שלום MATY MUSIC,\n\nאשמח לעזרה בנושא: ");
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 p-4 shadow-sm">
      <div className="text-sm font-semibold mb-2">יצירת קשר</div>
      <div className="grid sm:grid-cols-3 gap-2 text-sm">
        <a className="btn-mm" href="/contact">
          טופס יצירת קשר
        </a>
        <a
          className="btn-mm"
          href={`mailto:hello@matymusic.com?subject=${subject}&body=${body}`}
        >
          מייל ישיר
        </a>
        <a
          className="btn-mm"
          href="https://wa.me/9720000000000"
          target="_blank"
          rel="noreferrer"
        >
          וואטסאפ
        </a>
      </div>
    </div>
  );
}

function ActivityLog({ rows }: { rows: OrderRow[] }) {
  const items = useMemo(() => {
    const latest = [...rows]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 8);
    return latest.map((r) => ({
      title: r.title,
      time: r.date,
      icon:
        r.status === "paid"
          ? "✅"
          : r.status === "pending"
            ? "⏳"
            : r.status === "refunded"
              ? "↩"
              : r.status === "hold"
                ? "⛔"
                : "⚠",
      color:
        r.status === "paid"
          ? "text-emerald-600"
          : r.status === "pending"
            ? "text-amber-600"
            : r.status === "refunded"
              ? "text-sky-600"
              : r.status === "hold"
                ? "text-fuchsia-600"
                : "text-rose-600",
    }));
  }, [rows]);

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 p-4 shadow-sm">
      <div className="text-sm font-semibold mb-2">פעילות אחרונה</div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className={cls(it.color, "text-lg")}>{it.icon}</span>
            <span className="flex-1 truncate">{it.title}</span>
            <span className="opacity-60 text-xs">{it.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExportPanel({ rows }: { rows: OrderRow[] }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 p-4 shadow-sm">
      <div className="text-sm font-semibold mb-2">ייצוא דוחות</div>
      <div className="grid sm:grid-cols-3 gap-2 text-sm">
        <button className="btn-mm" onClick={() => exportCSV(rows)}>
          CSV
        </button>
        <button className="btn-mm" onClick={() => exportXLSX(rows)}>
          XLSX
        </button>
        <button className="btn-mm" onClick={() => exportPDF(rows)}>
          PDF
        </button>
      </div>
      <div className="text-xs opacity-60 mt-2">
        * אם ספריות חסרות, המערכת תשתמש בפולבקים (למשל CSV או הדפסה).
      </div>
    </div>
  );
}

function OrdersTable({ rows }: { rows: OrderRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      const okStatus = status === "all" || r.status === status;
      const okQ =
        !qq ||
        r.id.toLowerCase().includes(qq) ||
        r.title.toLowerCase().includes(qq) ||
        (r.receiptNo || "").toLowerCase().includes(qq);
      return okStatus && okQ;
    });
  }, [rows, q, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 p-4 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between mb-3">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש במס׳ הזמנה / כותרת / קבלה"
            className="h-10 w-[260px] max-w-full rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="h-10 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
          >
            <option value="all">כל המצבים</option>
            <option value="paid">שולם</option>
            <option value="pending">ממתין</option>
            <option value="hold">הולד</option>
            <option value="refunded">הוחזר</option>
            <option value="failed">נכשל</option>
          </select>
        </div>
        <div className="text-xs opacity-70">
          סך הכל: {filtered.length} פריטים
        </div>
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="min-w-[640px] w-full text-sm text-right mx-2">
          <thead>
            <tr className="text-xs opacity-70 border-b">
              <th className="py-2">#</th>
              <th>תאריך</th>
              <th>כותרת</th>
              <th>סכום</th>
              <th>מצב</th>
              <th>קבלה</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-black/5 dark:border-white/5"
              >
                <td className="py-2 font-mono text-[12px]">{r.id}</td>
                <td>{r.date}</td>
                <td className="max-w-[360px] truncate" title={r.title}>
                  {r.title}
                </td>
                <td className="tabular-nums">
                  {money(r.amount, r.currency || "ILS")}
                </td>
                <td>
                  <span className={statusPill(r.status)}>
                    {r.status === "paid"
                      ? "שולם"
                      : r.status === "pending"
                        ? "ממתין"
                        : r.status === "refunded"
                          ? "הוחזר"
                          : r.status === "hold"
                            ? "הולד"
                            : "נכשל"}
                  </span>
                </td>
                <td className="font-mono text-[12px]">{r.receiptNo || "-"}</td>
                <td className="text-left">
                  {r.receiptNo ? (
                    <button
                      onClick={() => downloadReceipt(r.receiptNo!, r)}
                      className="h-8 px-3 rounded-full border text-xs hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      הורד קבלה
                    </button>
                  ) : (
                    <span className="text-xs opacity-50">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* פאג׳ינציה */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="opacity-70">
          עמוד {page} מתוך {totalPages}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="h-9 px-3 rounded-full border disabled:opacity-40"
          >
            הקודם
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="h-9 px-3 rounded-full border disabled:opacity-40"
          >
            הבא
          </button>
        </div>
      </div>
    </div>
  );
}

/* ====================== קומפ׳ ראשי ====================== */
export default function DashboardPage() {
  const { status, data: session } = useSession();
  const router = useRouter();

  // אם לא מחובר — נבצע redirect קליינטי כדי לשמור על דף לקוח
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth?from=/dashboard");
    }
  }, [status, router]);

  const name =
    (session?.user?.name as string) ||
    (session?.user?.email as string) ||
    "חבר";
  const role = (session?.user as any)?.role || null;
  const isAdmin =
    role === "admin" ||
    role === "superadmin" ||
    (session as any)?.user?.isAdmin === true;

  const { loading, rows } = useOrders();

  // מספרים מהירים
  const totals = useMemo(() => {
    const paid = rows.filter((r) => r.status === "paid");
    const sumPaid = paid.reduce((s, r) => s + r.amount, 0);
    const pending = rows.filter((r) => r.status === "pending").length;
    const upcoming = rows.filter((r) => r.status === "hold").length;
    return { sumPaid, pending, upcoming };
  }, [rows]);

  // דמו טרנדים
  const trendIncome = useMemo(
    () =>
      rows.map((r) =>
        r.status === "paid"
          ? Math.max(1, Math.round(r.amount / 300))
          : Math.max(1, Math.round(r.amount / 900)),
      ),
    [rows],
  );
  const trendOrders = useMemo(
    () => rows.map((_, i) => 4 + ((i * 7) % 12)),
    [rows],
  );

  return (
    <div dir="rtl" className="mx-auto max-w-6xl p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-1 tracking-tight">
        ברוך הבא, {name}
      </h1>
      <p className="opacity-70 mb-6">
        זהו דשבורד המשתמש שלך — הכל במקום אחד: סטטיסטיקות, הזמנות, קבלות ויצוא.
      </p>

      {/* סטטיסטיקות עליונות */}
      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        <StatCard
          title="הכנסות (שולם)"
          value={money(totals.sumPaid)}
          hint="סיכום לפי הזמנות ששולמו"
          trend={trendIncome}
        />
        <StatCard
          title="ממתינים"
          value={String(totals.pending)}
          hint="הזמנות במצב המתנה"
          trend={trendOrders}
        />
        <StatCard
          title="הולד/קרוב"
          value={String(totals.upcoming)}
          hint="אירועים שבדרך"
          trend={trendOrders.slice().reverse()}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] items-start">
        {/* טבלת הזמנות */}
        <div>
          {loading ? (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 text-center opacity-70">
              טוען נתונים…
            </div>
          ) : (
            <OrdersTable rows={rows} />
          )}
        </div>

        {/* עמודת צד */}
        <div className="grid gap-4">
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">
              תצוגת ביצועים (דמו)
            </div>
            <TinyBar values={trendOrders} />
            <div className="text-xs opacity-70 mt-2">
              דוגמת ברים ללא תלות (SVG). גרסה זו עמידה ומהירה.
            </div>
          </div>

          <ExportPanel rows={rows} />
          <ContactPanel />
          <ActivityLog rows={rows} />
          <Shortcuts isAdmin={!!isAdmin} />
        </div>
      </div>

      {/* סגנונות ואנימציות עדינות */}
      <style jsx>{`
        .btn-mm {
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgb(0 0 0 / 0.1);
          background: rgba(255, 255, 255, 0.9);
        }
        :global(html[class~="dark"]) .btn-mm {
          background: rgba(17, 17, 17, 0.8);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .btn-mm:hover {
          background: white;
        }
        :global(html[class~="dark"]) .btn-mm:hover {
          background: rgba(40, 40, 40, 0.9);
        }
      `}</style>
    </div>
  );
}
