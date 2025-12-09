"use client";

import * as React from "react";
import { useParams } from "next/navigation";

type G = {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  city?: string | null;
  sports: string[];
  level?: string | null;
  members: string[];
};

export default function FitGroupViewPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "";
  const [g, setG] = React.useState<G | null>(null);
  const [err, setErr] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function load() {
    setErr("");
    setMsg("");
    const r = await fetch(
      `/api/fit/groups/${encodeURIComponent(String(slug))}`,
      { cache: "no-store" },
    );
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j?.ok) {
      setErr(j?.error || "לא נמצאה קבוצה או שלא אושרה");
      return;
    }
    setG(j.item);
  }
  React.useEffect(() => {
    if (slug) load().catch(() => {});
  }, [slug]);

  async function act(kind: "join" | "leave") {
    if (!g) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const r = await fetch(
        `/api/fit/groups/${encodeURIComponent(g.slug)}/${kind}`,
        { method: "POST" },
      );
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || "פעולה נכשלה");
      setMsg(kind === "join" ? "הצטרפת לקבוצה" : "עזבת את הקבוצה");
      await load();
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8 rtl" dir="rtl">
      {!g && !err && <div className="text-sm">טוען…</div>}
      {err && <div className="text-red-600 text-sm">{err}</div>}
      {g && (
        <div className="mm-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">{g.title}</h1>
              <div className="text-sm opacity-70">
                {g.city || "ללא עיר"} • {g.sports?.join(" • ")}{" "}
                {g.level ? `• ${g.level}` : ""}
              </div>
            </div>
            <div className="text-sm opacity-70 ltr">/{g.slug}</div>
          </div>
          {g.description && (
            <p className="whitespace-pre-wrap leading-relaxed">
              {g.description}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              disabled={busy}
              onClick={() => act("join")}
              className="mm-btn"
            >
              הצטרפות
            </button>
            <button
              disabled={busy}
              onClick={() => act("leave")}
              className="mm-btn"
            >
              עזיבה
            </button>
            {msg && <div className="text-green-700 text-sm">{msg}</div>}
            {err && <div className="text-red-600 text-sm">{err}</div>}
          </div>
          <div className="text-sm opacity-70">
            חברים: {g.members?.length ?? 0}
          </div>
        </div>
      )}
    </main>
  );
}
