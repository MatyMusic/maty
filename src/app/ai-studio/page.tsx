// src/app/ai-studio/page.tsx
"use client";

import { useState } from "react";
import { AIGenInput, AITrack } from "@/types/ai";

function field<T extends keyof AIGenInput>(k: T, v: any) {
  return { [k]: v } as Partial<AIGenInput>;
}

export default function AIStudioPage() {
  const [inp, setInp] = useState<AIGenInput>({
    genre: "chabad",
    prompt: "ניגון שמח בסגנון חסידי, מקצב הורא",
    bpm: 128,
    key: "Am",
    durationSec: 30,
  });
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AITrack[]>([]);

  async function onGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inp),
      });
      const trk: AITrack = await res.json();
      setItems((prev) => [trk, ...prev]);
    } finally {
      setLoading(false);
    }
  }

  async function refresh(id: string) {
    const r = await fetch(`/api/ai/status?id=${id}`);
    const trk: AITrack = await r.json();
    setItems((prev) => prev.map((x) => (x._id === id ? trk : x)));
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI Studio — יצירת ניגונים</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm">סגנון</label>
          <select
            className="w-full rounded border p-2"
            value={inp.genre}
            onChange={(e) =>
              setInp({ ...inp, ...field("genre", e.target.value) })
            }
          >
            <option value="chabad">חב״ד</option>
            <option value="mizrahi">מזרחי</option>
            <option value="soft">שקט</option>
            <option value="fun">מקפיץ</option>
          </select>

          <label className="block text-sm mt-3">אווירה / תיאור קצר</label>
          <textarea
            className="w-full rounded border p-2"
            rows={3}
            value={inp.prompt}
            onChange={(e) => setInp({ ...inp, prompt: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <label className="block text-sm">BPM</label>
              <input
                type="number"
                className="w-full rounded border p-2"
                value={inp.bpm ?? 120}
                onChange={(e) =>
                  setInp({ ...inp, bpm: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-sm">סולם</label>
              <input
                className="w-full rounded border p-2"
                placeholder="Am"
                value={inp.key ?? ""}
                onChange={(e) => setInp({ ...inp, key: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm">אורך (ש׳׳)</label>
              <input
                type="number"
                min={5}
                max={90}
                className="w-full rounded border p-2"
                value={inp.durationSec}
                onChange={(e) =>
                  setInp({ ...inp, durationSec: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <input
              type="number"
              className="w-28 rounded border p-2"
              placeholder="Seed (אופציונלי)"
              value={inp.seed ?? ""}
              onChange={(e) =>
                setInp({
                  ...inp,
                  seed: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            <button
              onClick={onGenerate}
              disabled={loading}
              className="rounded bg-black text-white px-4 py-2 disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {loading ? "יוצר..." : "צור ניגון"}
            </button>
          </div>
        </div>

        <div className="rounded border p-3 text-sm leading-6">
          <b>כללים:</b>
          <ul className="list-disc ms-5">
            <li>יוצרים מוזיקה מקורית בלבד — אין להעלות/להזין שיר מוגן.</li>
            <li>תוצרי AI זמינים לשימוש רק אם אתה בעל הזכויות עליהם.</li>
            <li>שמור יצירה טובה לספרייה שלך ותייג אותה.</li>
          </ul>
        </div>
      </div>

      <hr className="my-4" />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">היצירות האחרונות</h2>
        {items.map((it) => (
          <div key={it._id} className="rounded border p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{it.title || "AI Nigun"}</div>
                <div className="text-xs opacity-70">{it.status}</div>
              </div>
              <button
                onClick={() => refresh(it._id!)}
                className="text-sm underline"
              >
                רענן
              </button>
            </div>
            {it.audioUrl && (
              <audio
                controls
                preload="auto"
                crossOrigin="anonymous"
                src={`/api/proxy?u=${encodeURIComponent(it.audioUrl)}`}
                className="mt-2 w-full"
              />
            )}
            {it.error && (
              <div className="text-red-600 text-sm mt-2">{it.error}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
