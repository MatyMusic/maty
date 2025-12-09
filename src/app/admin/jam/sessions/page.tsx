// src/app/admin/jam/sessions/page.tsx
"use client";
import { useEffect, useState } from "react";

type JamSession = {
  _id: string;
  title: string;
  host?: string;
  status?: "pending" | "approved" | "rejected";
  createdAt?: string;
};

export default function JamSessionsPage() {
  const [rows, setRows] = useState<JamSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/admin/jam/sessions?limit=50", {
          cache: "no-store",
        });
        const j = await r.json().catch(() => ({}));
        setRows(j?.items || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-4" dir="rtl">
      <h2 className="text-xl font-bold">סשני JAM</h2>
      <p className="opacity-70 text-sm">ניהול/אישור/דחייה.</p>

      <div className="mt-4 rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="p-2 text-start">כותרת</th>
              <th className="p-2 text-start">מארח</th>
              <th className="p-2 text-start">סטטוס</th>
              <th className="p-2 text-start">נוצר</th>
              <th className="p-2 text-start">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center opacity-70">
                  אין נתונים
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="p-2">{r.title}</td>
                <td className="p-2">{r.host || "—"}</td>
                <td className="p-2">{r.status || "pending"}</td>
                <td className="p-2">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button className="mm-btn mm-pressable">אשר</button>
                    <button className="mm-btn mm-pressable">דחה</button>
                    <button className="mm-btn mm-pressable">פתח</button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={5} className="p-4">
                  טוען…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
