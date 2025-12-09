// src/app/admin/login/page.tsx
"use client";
import * as React from "react";

export default function AdminLogin() {
  const [key, setKey] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const r = await fetch("/api/admin/bypass", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setMsg("אושר ✅ מעביר לפאנל…");
      setTimeout(() => (window.location.href = "/admin"), 600);
    } catch (e: any) {
      setMsg(e?.message || "שגיאה");
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-dvh grid place-items-center bg-gradient-to-br from-violet-50 to-pink-50 dark:from-neutral-950 dark:to-neutral-900"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-5 space-y-3"
      >
        <h1 className="text-xl font-bold">כניסת מנהל</h1>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin Bypass Key"
          className="w-full h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
        />
        <button className="w-full h-11 rounded-xl bg-violet-600 text-white font-semibold">
          כניסה
        </button>
        {msg && <div className="text-sm opacity-80">{msg}</div>}
        <div className="text-xs opacity-70">
          טיפ: ניתן גם לכבות ב־<code>/api/admin/unbypass</code>.
        </div>
      </form>
    </main>
  );
}
