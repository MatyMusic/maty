"use client";

import { useState } from "react";

function toast(msg: string, type: "success"|"error"|"info"|"blank" = "success") {
  window.dispatchEvent(new CustomEvent("mm:toast", { detail: { type, text: msg } }));
}

export default function AdminSchedulePage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [singleDate, setSingleDate] = useState("");
  const [status, setStatus] = useState<"" | "busy" | "hold" | "free">("");
  const [expiresAt, setExpiresAt] = useState(""); // ל-HOLD
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function applyMark(e: React.FormEvent) {
    e.preventDefault();
    if (!singleDate || !status) {
      toast("בחר/י תאריך ומצב", "error");
      return;
    }
    setLoading(true);
    try {
      let url = "";
      let body: any = { date: singleDate, note: note || undefined };
      if (status === "busy") url = "/api/availability/busy";
      else if (status === "hold") { url = "/api/availability/hold"; if (expiresAt) body.expiresAt = expiresAt; }
      else if (status === "free") url = "/api/availability/free";

      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      toast("העודכן בהצלחה ✅");
    } catch (e: any) {
      toast(`שגיאה: ${e?.message || "server_error"}`, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-extrabold">לוח זמנים / זמינות</h1>

      {/* מסננים כלליים לתצוגה */}
      <div className="mm-card p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <div>
            <div className="form-label">מתאריך</div>
            <input
              type="date"
              className="mm-input mm-input-ghost"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <div className="form-label">עד תאריך</div>
            <input
              type="date"
              className="mm-input mm-input-ghost"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <div className="form-label">חיפוש (אופציונלי)</div>
            <input
              className="mm-input mm-input-ghost input-rtl"
              placeholder="הערה / תג / תאריך"
              onChange={() => {}}
            />
          </div>
          <div className="flex items-end">
            <button className="mm-btn mm-pressable w-full">רענון</button>
          </div>
        </div>
      </div>

      {/* סימון יום יחיד */}
      <form onSubmit={applyMark} className="mm-card p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <div className="form-label">תאריך</div>
            <input
              type="date"
              className="mm-input mm-input-ghost"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="form-label">מצב</div>
            <select
              className="mm-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              required
            >
              <option value="">בחר/י מצב…</option>
              <option value="busy">תפוס (BUSY)</option>
              <option value="hold">הולד (HOLD)</option>
              <option value="free">פנוי (FREE)</option>
            </select>
          </div>

          <div>
            <div className="form-label">פג תוקף (ל־HOLD)</div>
            <input
              type="datetime-local"
              className="mm-input mm-input-ghost"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={status !== "hold"}
            />
          </div>

          <div>
            <div className="form-label"> </div>
            <button type="submit" className="mm-btn mm-btn-primary mm-pressable w-full" disabled={loading}>
              {loading ? "שומר…" : "שמור"}
            </button>
          </div>
        </div>

        <div>
          <div className="form-label">הערה (אופציונלי)</div>
          <textarea
            className="mm-textarea mm-input-ghost input-rtl"
            rows={3}
            placeholder="פרטים פנימיים: מי ביקש הולד, טלפון, שעה משוערת וכו׳"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </form>

      {/* כאן אפשר להוסיף טבלת תאריכים / קלנדר מנהלי בהמשך */}
    </div>
  );
}
