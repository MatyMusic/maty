// src/components/AdminBypassButton.tsx
"use client";

import React, { useEffect, useState } from "react";

type ApiOk = { ok: true; active: boolean };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

async function getStatus(): Promise<boolean> {
  try {
    const r = await fetch("/api/admin/bypass", { cache: "no-store" });
    const j: ApiResp = await r.json();
    return !!(r.ok && j.ok && j.active);
  } catch {
    return false;
  }
}

async function loginAdmin(password: string) {
  const res = await fetch("/api/admin/bypass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ password }),
  });
  return res;
}

async function logoutAdmin() {
  try {
    await fetch("/api/admin/bypass", { method: "DELETE" });
  } catch {}
}

export default function AdminBypassButton() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    (async () => setActive(await getStatus()))();
  }, []);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await loginAdmin(pwd.trim());
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) {
        setErr(j?.error === "invalid_password" ? "סיסמה שגויה" : "שגיאה");
        setActive(false);
        return;
      }
      setActive(true);
      setPwd("");
      setOpen(false);
    } catch {
      setErr("שגיאה");
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    setBusy(true);
    setErr(null);
    await logoutAdmin();
    setActive(false);
    setOpen(false);
    setBusy(false);
  }

  if (!mounted) return null;

  return (
    <div className="relative" dir="rtl">
      <button
        type="button"
        className={`mm-admin-btn ${active ? "mm-admin-active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title={active ? "מצב אדמין פעיל" : "כניסת אדמין"}
      >
        {active ? "Admin ✓" : "Admin"}
      </button>

      {open && (
        <div className="mm-pop shadow-2xl">
          {active ? (
            <div className="grid gap-2">
              <div className="text-sm">מצב אדמין פעיל.</div>
              <button
                type="button"
                onClick={onLogout}
                disabled={busy}
                className="h-9 rounded-full bg-rose-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                יציאה
              </button>
            </div>
          ) : (
            <form onSubmit={onLogin} className="grid gap-2">
              <label className="text-sm">סיסמת אדמין</label>
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoFocus
                className="h-10 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
                placeholder="••••••••"
              />
              {err && (
                <div className="text-xs text-rose-600 bg-rose-50/70 dark:bg-rose-500/10 border border-rose-200/40 dark:border-rose-400/20 rounded-lg px-2 py-1">
                  {err}
                </div>
              )}
              <button
                type="submit"
                disabled={busy || !pwd.trim()}
                className="h-9 rounded-full bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                כניסה
              </button>
            </form>
          )}
        </div>
      )}

      {/* styles */}
      <style jsx>{`
        .mm-admin-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(5px);
          transition:
            transform 0.15s ease,
            box-shadow 0.2s ease,
            opacity 0.2s,
            background 0.2s;
          box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.12);
          font-size: 13px;
          font-weight: 700;
        }
        :global(html.dark) .mm-admin-btn {
          background: rgba(15, 15, 15, 0.72);
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.1);
        }
        .mm-admin-btn:hover {
          background: rgba(255, 255, 255, 0.82);
        }
        :global(html.dark) .mm-admin-btn:hover {
          background: rgba(22, 22, 22, 0.78);
        }
        .mm-admin-btn:active {
          transform: translateY(0.5px);
        }

        .mm-admin-active {
          color: #065f46;
          border-color: rgba(16, 185, 129, 0.35);
          background: linear-gradient(
            90deg,
            rgba(16, 185, 129, 0.12),
            rgba(6, 95, 70, 0.05)
          );
          animation: mmPulse 2.2s ease-in-out infinite;
        }
        :global(html.dark) .mm-admin-active {
          color: #34d399;
          border-color: rgba(16, 185, 129, 0.28);
          background: linear-gradient(
            90deg,
            rgba(16, 185, 129, 0.12),
            rgba(16, 185, 129, 0.06)
          );
        }

        .mm-pop {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          z-index: 500;
          width: 260px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(8px);
          padding: 12px;
          animation: mmMenu 0.14s ease-out;
        }
        :global(html.dark) .mm-pop {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(15, 15, 15, 0.94);
        }

        @keyframes mmPulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.35);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
          }
        }
        @keyframes mmMenu {
          0% {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mm-admin-active {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
