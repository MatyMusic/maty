"use client";

import * as React from "react";
import { ShieldCheck, LogIn, LogOut } from "lucide-react";

export default function AdminBypassClient() {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function refresh() {
    try {
      const r = await fetch("/api/admin/bypass", { cache: "no-store" });
      const j = await r.json().catch(() => null);
      setActive(!!j?.active);
    } catch {}
  }

  React.useEffect(() => {
    refresh();
  }, []);

  async function login() {
    const password = prompt("סיסמת מנהל:");
    if (!password) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "שגיאה בהתחברות");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setErr(null);
    try {
      await fetch("/api/admin/bypass", { method: "DELETE" });
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "שגיאה ביציאה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="fixed bottom-4 left-4 z-[1100] text-[13px]"
      style={{ pointerEvents: "auto" }}
    >
      {/* תג מצב קטן */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`h-9 px-3 rounded-full border shadow-sm inline-flex items-center gap-2 ${
          active
            ? "bg-emerald-600 text-white"
            : "bg-white/90 dark:bg-neutral-900/90 text-current"
        }`}
        title={active ? "מצב מנהל פעיל" : "כניסת מנהל"}
        type="button"
      >
        <ShieldCheck className="h-4 w-4" />
        {active ? "מנהל: פעיל" : "מנהל"}
      </button>

      {/* לוחון */}
      {open && (
        <div className="mt-2 w-[260px] rounded-2xl border bg-white/95 dark:bg-neutral-900/95 shadow-xl p-3">
          <div className="font-bold text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            מצב מנהל
          </div>
          <div className="mt-1 text-xs opacity-75">
            עקיפת תשלום לכפתורי צ׳אט/וידאו לצורך בדיקות.
          </div>

          {err && (
            <div className="mt-2 text-xs text-rose-700 dark:text-rose-300">
              {err}
            </div>
          )}

          <div className="mt-3 grid gap-2">
            {!active ? (
              <button
                disabled={busy}
                onClick={login}
                className="h-9 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 inline-flex items-center justify-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                {busy ? "מתחבר…" : "כניסת מנהל"}
              </button>
            ) : (
              <button
                disabled={busy}
                onClick={logout}
                className="h-9 rounded-full border inline-flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {busy ? "יוצא…" : "ניתוק עקיפה"}
              </button>
            )}

            <button
              onClick={() => setOpen(false)}
              className="h-9 rounded-full border"
            >
              סגור
            </button>
          </div>

          <div className="mt-2 text-[11px] opacity-60">
            טיפ: אחרי הפעלה/כיבוי תרענן את הדף אם לא רואים שינוי.
          </div>
        </div>
      )}
    </div>
  );
}
