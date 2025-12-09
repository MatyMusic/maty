"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { BRAND } from "@/lib/branding";

const GENRES = [
  { value: "club", label: "Club" },
  { value: "chabad", label: "Chabad" },
  { value: "mizrahi", label: "Mizrahi" },
  { value: "edm", label: "EDM" },
  { value: "hiphop", label: "HipHop" },
];

export default function ShortsComposer() {
  const r = useRouter();

  const [text, setText] = useState("");
  const [genre, setGenre] = useState("club");
  const [videoUrl, setVideoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [tags, setTags] = useState("shorts,maty,club");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!videoUrl.trim()) {
      setErr("חסר videoUrl");
      return;
    }
    try {
      const u = new URL(videoUrl);
      if (!/^https?:$/.test(u.protocol)) throw new Error("bad proto");
    } catch {
      setErr("videoUrl חייב להיות http/https תקין");
      return;
    }

    const payload = {
      text: text.trim() || undefined,
      genre,
      videoUrl: videoUrl.trim(),
      coverUrl: coverUrl.trim() || undefined,
      tags: Array.from(
        new Set(
          (tags || "shorts")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .concat(["shorts"])
        )
      ),
    };

    setLoading(true);
    try {
      const res = await fetch("/api/club/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok)
        throw new Error(j?.error?.message || BRAND.postError);
      toast.success(BRAND.postSuccess);
      r.push("/shorts");
    } catch (e: any) {
      toast.error(e?.message || BRAND.postError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mm-card p-4 space-y-4" dir="rtl">
      <div className="text-lg font-semibold">צור Short חדש</div>

      <div>
        <label className="form-label">כיתוב (אופציונלי)</label>
        <textarea
          className="mm-textarea input-rtl"
          rows={3}
          maxLength={500}
          placeholder="טקסט קצר על השורט…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">ז׳אנר</label>
          <select
            className="mm-select"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            {GENRES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">תמונת שער (coverUrl)</label>
          <input
            className="mm-input input-ltr"
            placeholder="https://…/cover.jpg"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="form-label">קישור וידאו (videoUrl) *</label>
        <input
          className="mm-input input-ltr"
          placeholder="https://…/video.mp4"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          required
        />
        <p className="text-xs text-slate-500 mt-1">MP4/WEBM ציבורי</p>
      </div>

      <div>
        <label className="form-label">תגיות (מופרדות בפסיקים)</label>
        <input
          className="mm-input input-rtl"
          placeholder="shorts,maty,club"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      {err && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <div className="flex gap-2">
        <button
          className="mm-btn mm-btn-primary mm-pressable"
          disabled={loading}
        >
          {loading ? "מפרסם…" : "פרסם Short"}
        </button>
        <button
          type="button"
          className="mm-btn mm-pressable"
          disabled={loading}
          onClick={() => {
            setText("");
            setGenre("club");
            setVideoUrl("");
            setCoverUrl("");
            setTags("shorts,maty,club");
            setErr(null);
          }}
        >
          נקה
        </button>
      </div>
    </form>
  );
}
