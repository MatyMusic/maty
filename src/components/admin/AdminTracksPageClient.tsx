// src/components/admin/AdminTracksPageClient.tsx
"use client";

import CloudinaryUploadButton from "@/components/admin/CloudinaryUploadButton";
import type { TrackCategory } from "@/types/music";
import { useEffect, useState } from "react";

type AdminTrack = {
  _id: string;
  title: string;
  artist: string;
  category: TrackCategory;
  duration?: number;
  audioUrl: string;
  coverUrl?: string;
  mediaPublicId?: string;
  published?: boolean;
  featured?: boolean;
  order?: number;
  tags?: string[];
  createdAt?: string;
};

type ApiListResponse = {
  ok: boolean;
  rows?: AdminTrack[];
  total?: number;
};

const CAT_OPTIONS: { value: TrackCategory; label: string }[] = [
  { value: "chabad", label: "חסידי (חב״ד)" },
  { value: "mizrahi", label: "מזרחי" },
  { value: "soft", label: "שקט" },
  { value: "fun", label: "מקפיץ" },
];

type CloudinaryDoc = {
  kind: "image" | "video" | "audio";
  title?: string;
  publicId: string;
  url: string;
  thumbUrl?: string;
  format?: string;
  tags?: string[];
};

export default function AdminTracksPageClient() {
  const [category, setCategory] = useState<TrackCategory>("chabad");
  const [tracks, setTracks] = useState<AdminTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // טופס יצירת/עדכון שיר
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("Maty Music");
  const [audioUrl, setAudioUrl] = useState("");
  const [mediaPublicId, setMediaPublicId] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTracks = async (cat: TrackCategory) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("category", cat);
      params.set("pageSize", "200");

      const res = await fetch(`/api/admin/tracks?${params.toString()}`, {
        cache: "no-store",
      });

      if (res.status === 403) {
        setError("אין הרשאת אדמין לדף הזה.");
        setTracks([]);
        return;
      }

      if (!res.ok) throw new Error("tracks " + res.status);
      const data: ApiListResponse = await res.json().catch(() => ({
        ok: false,
      }));
      if (!data.ok) throw new Error("response_not_ok");

      setTracks(data.rows || []);
    } catch (err: any) {
      console.error("[AdminTracksPageClient] load error:", err);
      setError("שגיאה בטעינת השירים. נסה לרענן.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracks(category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !audioUrl.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        artist: artist.trim() || "Maty Music",
        category,
        audioUrl: audioUrl.trim(),
        coverUrl: coverUrl.trim() || "/assets/logo/maty-music-wordmark.svg",
        mediaPublicId: (mediaPublicId || audioUrl).trim(),
        duration: 0,
        published: true,
        featured: false,
        order: 0,
        tags,
      };

      const res = await fetch("/api/admin/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data?.error || res.statusText);
      }

      // ריענון הרשימה
      await loadTracks(category);

      // איפוס טופס
      setTitle("");
      setArtist("Maty Music");
      setAudioUrl("");
      setMediaPublicId("");
      setCoverUrl("");
      setTagsInput("");
    } catch (err: any) {
      console.error("[AdminTracksPageClient] save error:", err);
      setError("לא הצלחתי לשמור את השיר. " + (err?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const currentCatLabel =
    CAT_OPTIONS.find((c) => c.value === category)?.label || category;

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50"
      dir="rtl"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:py-10">
        {/* כותרת */}
        <header className="space-y-1 text-right">
          <h1 className="text-2xl font-extrabold md:text-3xl">
            ניהול שירים · אדמין
          </h1>
          <p className="text-sm md:text-base opacity-75">
            הדף הזה שומר שירים בקולקציה{" "}
            <code className="rounded bg-black/40 px-1 text-xs">tracks</code> –
            ומשם /api/music מושך לנגנים של האתר.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)] md:items-start">
          {/* טופס הוספת שיר */}
          <section className="rounded-3xl border border-amber-300/40 bg-amber-50/10 p-4 text-right shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <h2 className="text-sm font-bold text-amber-100 md:text-base">
              הוספת שיר חדש
            </h2>
            <p className="mt-1 text-[11px] text-amber-50 opacity-80">
              בחר קטגוריה, העלה אודיו ל־Cloudinary או הדבק URL, ושמור. השיר יהיה
              זמין מיד ב־/genre/{category}.
            </p>

            {/* בחירת קטגוריה */}
            <div className="mt-3 space-y-1 text-[11px]">
              <label className="mb-1 block opacity-80">קטגוריה</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TrackCategory)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-2 py-1.5 text-xs outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/60"
              >
                {CAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-4 space-y-3 text-[11px]"
            >
              <div>
                <label className="mb-1 block opacity-80">שם השיר *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-2 py-1.5 text-xs outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/60"
                  placeholder="ניגון שמחה לחתונה"
                />
              </div>

              <div>
                <label className="mb-1 block opacity-80">אמן / קרדיט</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-2 py-1.5 text-xs outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/60"
                  placeholder="Maty Music"
                />
              </div>

              <div>
                <label className="mb-1 block opacity-80">
                  קישור לאודיו (audioUrl) *
                </label>
                <input
                  type="text"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-2 py-1.5 text-xs outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/60"
                  placeholder="https://res.cloudinary.com/.../track.mp3"
                />
                <div className="mt-1 text-[10px] opacity-70">
                  אפשר להדביק ידנית, או להשתמש בכפתור ההעלאה למטה כדי לייצר URL
                  אוטומטית + mediaPublicId.
                </div>
              </div>

              {/* Cloudinary – אודיו */}
              <div>
                <label className="mb-1 block opacity-80">
                  העלאת קובץ אודיו ל־Cloudinary
                </label>
                <CloudinaryUploadButton
                  label={
                    audioUrl
                      ? "העלה אודיו נוסף (Cloudinary)"
                      : "העלה קובץ אודיו"
                  }
                  multiple={false}
                  folder={`maty-music/audio/${category}`}
                  tags={["audio", category]}
                  onSuccess={(doc: CloudinaryDoc) => {
                    if (doc.kind === "audio") {
                      setAudioUrl(doc.url);
                      setMediaPublicId(doc.publicId);
                      if (!title) {
                        setTitle(doc.title || "");
                      }
                    }
                  }}
                  onUploaded={() => {}}
                  className="mm-btn mm-pressable"
                />
                {audioUrl && (
                  <div className="mt-1 text-[10px] text-emerald-300">
                    ✅ audioUrl מוכן (וגם mediaPublicId).
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block opacity-80">
                  קישור לתמונת עטיפה (coverUrl)
                </label>
                <input
                  type="text"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-2 py-1.5 text-xs outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/60"
                  placeholder="/assets/images/... או https://res.cloudinary.com/..."
                />
                <div className="mt-1">
                  <CloudinaryUploadButton
                    label={
                      coverUrl
                        ? "העלה עטיפה חדשה (Cloudinary)"
                        : "העלה תמונת עטיפה"
                    }
                    multiple={false}
                    folder={`maty-music/covers/${category}`}
                    tags={["cover", category]}
                    onSuccess={(doc: CloudinaryDoc) => {
                      if (doc.kind === "image") {
                        setCoverUrl(doc.url);
                      }
                    }}
                    onUploaded={() => {}}
                    className="mm-btn mm-pressable mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block opacity-80">
                  תגיות (מופרדות בפסיקים)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-2 py-1.5 text-xs outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/60"
                  placeholder="chabad, wedding, nigun"
                />
              </div>

              <button
                type="submit"
                disabled={!title.trim() || !audioUrl.trim() || saving}
                className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-amber-400 px-3 py-2 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-50"
              >
                {saving ? "שומר..." : "➕ שמור שיר ל־DB"}
              </button>

              <p className="mt-2 text-[10px] opacity-75 text-amber-50">
                השיר נשמר בקולקציה <code>tracks</code> בבסיס הנתונים{" "}
                <code>maty-music</code>. /api/music ימשוך אותו לפי הקטגוריה{" "}
                <code>{category}</code>.
              </p>
            </form>
          </section>

          {/* רשימת שירים קיימים */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4 text-right shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold md:text-base">
                שירים קיימים ({currentCatLabel})
              </h2>
              <button
                type="button"
                onClick={() => loadTracks(category)}
                className="rounded-xl border border-white/20 bg-black/30 px-3 py-1 text-[11px] hover:border-emerald-300/70 hover:text-emerald-200"
              >
                רענן רשימה
              </button>
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center text-sm opacity-70">
                טוען שירים...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-400/50 bg-red-900/40 p-3 text-[11px] text-red-100">
                {error}
              </div>
            ) : !tracks.length ? (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-xs opacity-70">
                אין שירים לקטגוריה הזו עדיין.
              </div>
            ) : (
              <ul className="space-y-2 text-[11px]">
                {tracks.map((t) => (
                  <li
                    key={t._id}
                    className="flex items-start justify-between rounded-2xl border border-white/10 bg-black/40 px-3 py-2"
                  >
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">
                          {t.title || "(ללא שם)"}
                        </span>
                        {t.published === false && (
                          <span className="rounded-full bg-red-900/60 px-2 py-[2px] text-[9px] text-red-100">
                            לא מפורסם
                          </span>
                        )}
                      </div>
                      <div className="opacity-75">
                        אמן: {t.artist || "Maty Music"}
                      </div>
                      <div className="truncate text-[10px] opacity-60">
                        audioUrl: {t.audioUrl}
                      </div>
                      {t.tags?.length ? (
                        <div className="mt-0.5 flex flex-wrap gap-1 text-[9px] text-emerald-200">
                          {t.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-emerald-900/40 px-2 py-[1px]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
