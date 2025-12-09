"use client";

import * as React from "react";

type Row = {
  _id: string;
  slug: string;
  title: string;
  city?: string | null;
  sports: string[];
  level?: string | null;
  ownerId: string;
  members: string[];
  visibility: "public" | "private";
  status: "pending" | "approved" | "rejected" | "blocked";
  createdAt?: string;
  updatedAt?: string;
};

export default function AdminFitGroupsPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [q, setQ] = React.useState("");
  const [tab, setTab] = React.useState<
    "pending" | "approved" | "rejected" | "blocked"
  >("pending");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  async function load() {
    setErr("");
    const u = new URL("/api/admin/fit/groups", window.location.origin);
    u.searchParams.set("status", tab);
    if (q.trim()) u.searchParams.set("q", q.trim());
    const r = await fetch(u.toString(), { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j?.ok) {
      setErr(j?.error || "שגיאה בטעינת קבוצות");
      return;
    }
    setRows(j.items || []);
  }

  React.useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function changeStatus(slug: string, status: Row["status"]) {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch(
        `/api/admin/fit/groups/${encodeURIComponent(slug)}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || "failed");
      await load();
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        {(["pending", "approved", "rejected", "blocked"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-xl border px-3 py-1.5 text-sm ${tab === k ? "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700" : ""}`}
          >
            {k === "pending"
              ? "ממתינות"
              : k === "approved"
                ? "מאושרות"
                : k === "rejected"
                  ? "נדחו"
                  : "חסומות"}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="חיפוש (שם/סלאג/עיר)"
          className="mm-input ml-auto max-w-[240px]"
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button onClick={load} className="mm-btn">
          רענן
        </button>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/10">
            <tr>
              <th className="text-right p-2">שם</th>
              <th className="text-right p-2">סלאג</th>
              <th className="text-right p-2">עיר</th>
              <th className="text-right p-2">ספורט</th>
              <th className="text-right p-2">רמה</th>
              <th className="text-right p-2">חברים</th>
              <th className="text-right p-2">נראות</th>
              <th className="text-right p-2">סטטוס</th>
              <th className="text-right p-2">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="p-2 font-medium">{r.title}</td>
                <td className="p-2 ltr text-xs opacity-80">{r.slug}</td>
                <td className="p-2">{r.city || "—"}</td>
                <td className="p-2">{r.sports?.join(", ")}</td>
                <td className="p-2">{r.level || "—"}</td>
                <td className="p-2">{r.members?.length ?? 0}</td>
                <td className="p-2">
                  {r.visibility === "public" ? "ציבורית" : "פרטית"}
                </td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <button
                      disabled={busy}
                      onClick={() => changeStatus(r.slug, "approved")}
                      className="mm-btn"
                    >
                      אישור
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => changeStatus(r.slug, "rejected")}
                      className="mm-btn"
                    >
                      דחייה
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => changeStatus(r.slug, "blocked")}
                      className="mm-btn"
                    >
                      חסימה
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  className="p-4 text-center text-muted-foreground"
                  colSpan={9}
                >
                  אין פריטים לתצוגה בלשונית זו.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
