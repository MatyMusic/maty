"use client";

import { useEffect, useRef, useState } from "react";
import SongAudioUpload from "./SongAudioUpload";
import SongCoverUpload from "./SongCoverUpload";

type NewSong = {
  title: string;
  artist: string;
  genre: string;
  mood: string;
  bpm: number;
  key: string;
  audioUrl?: string;
  audioPublicId?: string;
  coverUrl?: string;
  coverPublicId?: string;
  duration?: number;
  format?: string;
  tags: string[];
  status: "draft" | "published";
};

export default function SongForm({ onSaved }: { onSaved: () => void }) {
  const [v, setV] = useState<NewSong>({
    title: "",
    artist: "Maty Music",
    genre: "",
    mood: "",
    bpm: 0,
    key: "",
    tags: [],
    status: "draft",
  });
  const [saving, setSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  function set<K extends keyof NewSong>(k: K, val: NewSong[K]) {
    setV((p) => ({ ...p, [k]: val }));
  }

  async function save() {
    if (!v.title) return alert("חסר כותרת");
    if (!v.audioUrl || !v.audioPublicId) return alert("חסר קובץ אודיו");
    setSaving(true);
    try {
      const r = await fetch("/api/admin/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      onSaved();
      // איפוס הטופס אך משאיר את האמן/תגיות נוחות לזרימה
      setV((p) => ({
        ...p,
        title: "",
        audioUrl: undefined,
        audioPublicId: undefined,
        coverUrl: undefined,
        coverPublicId: undefined,
        duration: undefined,
        format: undefined,
        status: "draft",
      }));
      if (audioRef.current) audioRef.current.src = "";
    } catch (e:any) {
      alert(e?.message || "שמירה נכשלה");
    } finally {
      setSaving(false);
    }
  }

  // הצגת waveform בסיסית? נשאיר פשוט: אלמנט אודיו + משך
  useEffect(() => {
    if (!audioRef.current || !v.audioUrl) return;
    audioRef.current.src = v.audioUrl;
  }, [v.audioUrl]);

  return (
    <div className="mm-card p-4 grid gap-3" dir="rtl">
      <div className="grid md:grid-cols-3 gap-3">
        <div className="grid gap-2">
          <label className="text-sm">כותרת*</label>
          <input className="mm-input input-rtl" value={v.title} onChange={e=>set("title", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">אמן</label>
          <input className="mm-input input-rtl" value={v.artist} onChange={e=>set("artist", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">ז׳אנר</label>
          <input className="mm-input input-rtl" value={v.genre} onChange={e=>set("genre", e.target.value)} />
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <div className="grid gap-2">
          <label className="text-sm">מצב</label>
          <select className="mm-select" value={v.status} onChange={e=>set("status", e.target.value as any)}>
            <option value="draft">טיוטה</option>
            <option value="published">מפורסם</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm">אווירה</label>
          <input className="mm-input input-rtl" value={v.mood} onChange={e=>set("mood", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">BPM</label>
          <input className="mm-input" type="number" value={v.bpm} onChange={e=>set("bpm", Number(e.target.value||0))} />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">סולם</label>
          <input className="mm-input input-rtl" value={v.key} onChange={e=>set("key", e.target.value)} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="grid gap-2">
          <label className="text-sm">קובץ אודיו*</label>
          {v.audioUrl ? (
            <div className="grid gap-2">
              <audio ref={audioRef} controls className="w-full" />
              <div className="text-xs opacity-70">
                פורמט: {v.format || "—"} • משך: {v.duration ? Math.round(v.duration) + "s" : "—"}
              </div>
              <div className="flex gap-2">
                <button className="mm-btn mm-pressable" onClick={() => set("audioUrl", undefined)}>
                  החלף קובץ
                </button>
                <a className="mm-btn mm-pressable" href={v.audioUrl} target="_blank">פתח</a>
              </div>
            </div>
          ) : (
            <SongAudioUpload
              tags={["song"]}
              onUploaded={(f) => {
                set("audioUrl", f.audioUrl);
                set("audioPublicId", f.audioPublicId);
                set("duration", f.duration || 0);
                set("format", f.format || "");
              }}
            />
          )}
        </div>

        <div className="grid gap-2">
          <label className="text-sm">עטיפת שיר (רשות)</label>
          {v.coverUrl ? (
            <div className="grid gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.coverUrl} alt="cover" className="h-40 w-40 object-cover rounded-lg border" />
              <div className="flex gap-2">
                <button className="mm-btn mm-pressable" onClick={() => set("coverUrl", undefined)}>
                  החלף עטיפה
                </button>
                <a className="mm-btn mm-pressable" href={v.coverUrl} target="_blank">פתח</a>
              </div>
            </div>
          ) : (
            <SongCoverUpload
              tags={["song-cover"]}
              onUploaded={(f) => {
                set("coverUrl", f.coverUrl);
                set("coverPublicId", f.coverPublicId);
              }}
            />
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm">תגיות (מופרד בפסיק)</label>
        <input
          className="mm-input input-rtl"
          value={v.tags.join(", ")}
          onChange={(e) => set("tags", e.target.value.split(",").map(s=>s.trim()).filter(Boolean))}
        />
      </div>

      <div className="flex gap-2">
        <button className="mm-btn mm-pressable" onClick={save} disabled={saving}>
          {saving ? "שומר…" : "שמור שיר"}
        </button>
      </div>
    </div>
  );
}
