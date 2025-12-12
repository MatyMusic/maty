// src/components/about/VideoDemosSection.tsx
"use client";

import { useIsAdmin } from "@/hooks/useIsAdmin";
import Image from "next/image";
import * as React from "react";

type VideoDemo = {
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string; // יכול להיות וידאו או (בהיסטוריה) תמונה
  coverUrl?: string; // תמונה לתצוגה
  likes?: number;
};

function isProbablyVideo(url?: string | null): boolean {
  if (!url) return false;
  // בדיקה פשוטה לפי סיומת
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url);
}

export default function VideoDemosSection() {
  const [videos, setVideos] = React.useState<VideoDemo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // הימנעות מקריסה אם ה-hook מחזיר null
  const adminState = useIsAdmin() as any;
  const isAdmin: boolean = !!adminState?.isAdmin;
  const adminLoading: boolean = !!adminState?.loading;

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const videoRefs = React.useRef<Record<string, HTMLVideoElement | null>>({});

  // טעינת וידאוים מה-API
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/about/videos");
        if (!res.ok) {
          throw new Error("שגיאה בטעינת הווידאוים (status " + res.status + ")");
        }
        const data = (await res.json()) as { items?: VideoDemo[] };
        if (!cancelled) {
          setVideos(data.items || []);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "שגיאה בטעינת הווידאוים");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // פליי/פאוז – רק וידאו אחד מנגן
  const handleTogglePlay = (id: string) => {
    const current = videoRefs.current[id];
    if (!current) return;

    if (activeId === id && !current.paused) {
      current.pause();
      setActiveId(null);
      return;
    }

    if (activeId && activeId !== id) {
      const prev = videoRefs.current[activeId];
      if (prev && !prev.paused) prev.pause();
    }

    current
      .play()
      .then(() => setActiveId(id))
      .catch(() => {
        // אם הדפדפן לא מצליח לנגן – לא מפילים את המסך
      });
  };

  // לייקים
  const handleLike = async (id: string) => {
    try {
      await fetch("/api/about/videos/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setVideos((prev) =>
        prev.map((v) =>
          v._id === id ? { ...v, likes: (v.likes || 0) + 1 } : v,
        ),
      );
    } catch {
      // אפשר להוסיף toast אחר כך
    }
  };

  // שיתוף – share או copy link
  const handleShare = (video: VideoDemo) => {
    const url = video.videoUrl || video.coverUrl;
    if (!url) return;

    if (navigator.share) {
      navigator
        .share({
          title: video.title,
          text: video.description || "וידאו / דמו מתוך MATY-MUSIC",
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
      alert("הקישור הועתק ללוח");
    }
  };

  return (
    <section className="mb-14">
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold">וידאו דמואים</h2>
          <p className="opacity-80">
            קליפים קצרים מהופעות, חופות, ריקודים והתוועדויות
          </p>
        </div>
        {isAdmin && (
          <span className="text-xs rounded-full px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/40">
            מצב אדמין • אפשר להעלות כאן קבצי דמו
          </span>
        )}
      </header>

      {loading && (
        <div className="about-card dark p-4 text-sm opacity-80">
          טוען וידאוים...
        </div>
      )}

      {error && !loading && (
        <div className="about-card dark p-4 text-sm text-red-400">{error}</div>
      )}

      {!loading && videos.length > 0 && (
        <div className="grid md:grid-cols-3 gap-5">
          {videos.map((v) => {
            const hasVideo = isProbablyVideo(v.videoUrl || "");
            // אם videoUrl הוא בעצם תמונה – נתייחס אליו כ-cover
            const effectiveCover =
              v.coverUrl || (!hasVideo && v.videoUrl) || undefined;

            return (
              <article
                key={v._id}
                className="about-card dark border dark:border-white/10 overflow-hidden flex flex-col"
              >
                <div className="relative aspect-video bg-black/60 overflow-hidden">
                  {hasVideo ? (
                    <>
                      <video
                        ref={(node) => {
                          videoRefs.current[v._id] = node;
                        }}
                        className="w-full h-full object-cover"
                        controls={false}
                        onEnded={() =>
                          setActiveId((prev) => (prev === v._id ? null : prev))
                        }
                      >
                        {v.videoUrl && <source src={v.videoUrl} />}
                      </video>

                      {/* שכבת פליי/סטופ על הווידאו */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePlay(v._id)}
                          className="rounded-full bg-black/70 text-white text-xs px-4 py-2"
                        >
                          {activeId === v._id ? "Pause" : "Play"}
                        </button>
                      </div>
                    </>
                  ) : effectiveCover ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={effectiveCover}
                        alt={v.title}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover"
                      />
                      {/* שכבה מעל תמונה – כפתור צפייה/שיתוף */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30">
                        <div className="rounded-full bg-black/75 text-white text-xs px-4 py-1">
                          דמו / תמונה
                        </div>
                        {(v.videoUrl || v.coverUrl) && (
                          <button
                            type="button"
                            onClick={() => handleShare(v)}
                            className="rounded-full bg-white/90 text-black text-xs px-4 py-1"
                          >
                            שיתוף / פתיחה
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs opacity-60">
                      אין מדיה זמינה
                    </div>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col gap-2 text-right">
                  <div className="font-semibold text-sm">{v.title}</div>
                  {v.description && (
                    <div className="text-xs opacity-75 line-clamp-2">
                      {v.description}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 text-[11px] opacity-80 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLike(v._id)}
                        className="hover:opacity-100 opacity-80"
                      >
                        ❤️ {v.likes ?? 0}
                      </button>
                      {(v.videoUrl || v.coverUrl) && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleShare(v)}
                            className="hover:opacity-100 opacity-80"
                          >
                            שיתוף
                          </button>
                          {/* הורדה – אם יש URL */}
                          <a
                            href={v.videoUrl || v.coverUrl}
                            download
                            className="hover:opacity-100 opacity-80"
                          >
                            הורדה
                          </a>
                        </>
                      )}
                    </div>
                    <div className="opacity-60">Demo</div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isAdmin && !adminLoading && (
        <AdminUploadBox
          onCreated={(item) => setVideos((prev) => [item, ...prev])}
        />
      )}
    </section>
  );
}

type AdminUploadBoxProps = {
  onCreated: (item: VideoDemo) => void;
};

function AdminUploadBox({ onCreated }: AdminUploadBoxProps) {
  const [title, setTitle] = React.useState("");
  const [videoUrl, setVideoUrl] = React.useState("");
  const [coverUrl, setCoverUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || (!videoUrl && !coverUrl)) {
      setError("חייבים לפחות כותרת ועוד URL אחד (וידאו או תמונה)");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/about/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, videoUrl, coverUrl, description }),
      });

      if (!res.ok) {
        throw new Error("שגיאה בשמירת המדיה (status " + res.status + ")");
      }

      const data = (await res.json()) as { item?: VideoDemo };
      if (data.item) {
        onCreated(data.item);
        setTitle("");
        setVideoUrl("");
        setCoverUrl("");
        setDescription("");
      }
    } catch (err: any) {
      setError(err?.message || "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-8 about-card dark border dark:border-emerald-500/40 p-4 text-right space-y-3">
      <div className="font-semibold text-sm mb-1">
        הוספת דמו חדש (וידאו / תמונה) – אדמין בלבד
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <div className="flex flex-col gap-1">
          <label>כותרת</label>
          <input
            className="w-full rounded-md border border-white/20 bg-black/40 px-2 py-1 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="לדוגמה: חופה – ניגון צמאה"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label>
            Video URL (לא חובה – mp4/webm/ogg){" "}
            <span className="opacity-60">(אם יש)</span>
          </label>
          <input
            className="w-full rounded-md border border-white/20 bg-black/40 px-2 py-1 text-sm ltr:text-left"
            dir="ltr"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://.../demo.mp4"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label>
            Cover Image URL{" "}
            <span className="opacity-60">
              (תמונה ראשית – חובה אם אין וידאו)
            </span>
          </label>
          <input
            className="w-full rounded-md border border-white/20 bg-black/40 px-2 py-1 text-sm ltr:text-left"
            dir="ltr"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://.../image.jpg"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label>תיאור (לא חובה)</label>
          <textarea
            className="w-full rounded-md border border-white/20 bg-black/40 px-2 py-1 text-sm min-h-[60px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && <div className="text-xs text-red-400">{error}</div>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn disabled:opacity-60"
          >
            {saving ? "שומר..." : "שמירת דמו"}
          </button>
        </div>
      </form>
    </div>
  );
}
