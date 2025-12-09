// src/components/club/ConsentGate.tsx
"use client";
import React, { useEffect, useState } from "react";

type ConsentState = { chatOk: boolean; videoOk: boolean };

export function ConsentGate({ peerId }: { peerId: string }) {
  const [st, setSt] = useState<ConsentState | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const r = await fetch(
        `/api/club/consents?peer=${encodeURIComponent(peerId)}`,
        { cache: "no-store" },
      );
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "consent_error");
      setSt({ chatOk: !!j.chatOk, videoOk: !!j.videoOk });
    } catch (e: any) {
      setErr(e?.message || "שגיאה");
    }
  }

  useEffect(() => {
    load();
  }, [peerId]);

  async function toggle(type: "chat" | "video", on: boolean) {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/club/consents`, {
        method: on ? "POST" : "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ peer: peerId, type }),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "consent_toggle_error");
      await load();
    } catch (e: any) {
      setErr(e?.message || "שגיאה");
    } finally {
      setBusy(false);
    }
  }

  if (!st) return <div className="text-sm opacity-70">טוען הרשאות…</div>;

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 bg-white/70 dark:bg-neutral-900/70">
      <div className="mb-2 font-bold">הרשאות הדדיות</div>
      {err && <div className="mb-2 text-xs text-rose-600">{err}</div>}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={st.chatOk}
            onChange={(e) => toggle("chat", e.target.checked)}
            disabled={busy}
          />
          צ׳אט בהסכמה
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={st.videoOk}
            onChange={(e) => toggle("video", e.target.checked)}
            disabled={busy}
          />
          וידאו בהסכמה
        </label>
      </div>
      <div className="mt-2 text-xs opacity-70">
        רק כאשר שני הצדדים מאשרים — ייפתח צ׳אט/וידאו. אין סובלנות להטרדות.
      </div>
    </div>
  );
}
