// src/components/dev/BypassSwitch.tsx
"use client";
import * as React from "react";

export default function BypassSwitch() {
  const [key, setKey] = React.useState("");
  const [busy, setBusy] = React.useState<"on" | "off" | null>(null);
  const [status, setStatus] = React.useState<string>("");

  async function on() {
    setBusy("on");
    setStatus("");
    try {
      const r = await fetch("/api/admin/bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setStatus("BYPASS פעיל ✓");
    } catch (e: any) {
      setStatus(e?.message || "שגיאה");
    } finally {
      setBusy(null);
    }
  }
  async function off() {
    setBusy("off");
    setStatus("");
    try {
      const r = await fetch("/api/admin/unbypass", {
        method: "POST",
        credentials: "include",
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setStatus("BYPASS כבוי");
    } catch (e: any) {
      setStatus(e?.message || "שגיאה");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      dir="rtl"
      className="fixed bottom-3 right-3 z-[9999] rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur p-2 shadow-lg"
    >
      <div className="text-[12px] opacity-70 mb-1">Admin BYPASS</div>
      <div className="flex gap-2">
        <input
          type="password"
          placeholder="מפתח"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="h-9 rounded-xl border px-2 bg-white/95 dark:bg-neutral-900/90 text-sm"
        />
        <button
          onClick={on}
          disabled={!key || busy !== null}
          className="h-9 px-3 rounded-xl bg-violet-600 text-white text-sm"
        >
          {busy === "on" ? "מפעיל…" : "הפעל"}
        </button>
        <button
          onClick={off}
          disabled={busy !== null}
          className="h-9 px-3 rounded-xl border text-sm"
        >
          {busy === "off" ? "מכבה…" : "כיבוי"}
        </button>
      </div>
      {!!status && <div className="mt-1 text-[12px] opacity-80">{status}</div>}
    </div>
  );
}
