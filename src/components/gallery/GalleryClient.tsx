// src/components/gallery/GalleryClient.tsx
"use client";

import CloudinaryUploadButton from "@/components/admin/CloudinaryUploadButton";
import type { FC } from "react";
import React, { useEffect, useMemo, useRef, useState } from "react";

type MediaKind = "image" | "video" | "audio";

export type GalleryItem = {
  id: string;
  publicId?: string;
  kind: MediaKind;
  title: string;
  url: string;
  thumbUrl?: string;
  createdAt?: string;
  tags?: string[];
  likes?: number;
  comments?: number;
};

type Props = {
  isAdmin?: boolean;
};

type ItemState = GalleryItem & {
  likes: number;
  commentsCount: number;
  localComments: string[];
};

type CommentView = {
  id: string;
  text: string;
  userName?: string;
  createdAt?: string;
  parentId?: string | null;
};

function isBrowserAdmin(): boolean {
  if (typeof window === "undefined") return false;
  const html = document.documentElement;
  if (html.dataset.admin === "1") return true;
  if ((window as any).__MM_IS_ADMIN__ === true) return true;
  return false;
}

// זיהוי לפי סיומת URL – כדי לוודא ש־mp3/wav מוגדרים כ־audio
function detectAudioFromUrl(url: string): boolean {
  try {
    const clean = url.split("?")[0];
    const ext = clean.split(".").pop()?.toLowerCase();
    if (!ext) return false;
    return ["mp3", "wav", "m4a", "ogg", "aac"].includes(ext);
  } catch {
    return false;
  }
}

const GalleryClient: FC<Props> = ({ isAdmin }) => {
  const [items, setItems] = useState<ItemState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterKind, setFilterKind] = useState<"all" | MediaKind>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [finalIsAdmin, setFinalIsAdmin] = useState<boolean>(!!isAdmin);

  useEffect(() => {
    setFinalIsAdmin(Boolean(isAdmin) || isBrowserAdmin());
  }, [isAdmin]);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gallery", { cache: "no-store" });
      if (!res.ok) throw new Error("שגיאה בטעינת הגלריה");

      const data = await res.json();
      const rows: any[] = data.items || data.rows || [];

      const mapped: ItemState[] = rows.map((r) => {
        let kind: MediaKind = "image";
        const k = String(r.kind || "").toLowerCase();

        if (k === "video") kind = "video";
        else if (k === "audio") kind = "audio";

        const url: string = String(r.url);

        // אם לפי kind זה לא audio, אבל הסיומת מצביעה על קובץ שמע – נגדיר כ־audio
        if (detectAudioFromUrl(url)) {
          kind = "audio";
        }

        return {
          id: String(r.id || r._id || r.publicId || r.url),
          publicId: r.publicId ? String(r.publicId) : undefined,
          kind,
          title: String(r.title || ""),
          url,
          thumbUrl: r.thumbUrl || url,
          createdAt: r.createdAt || r.created_at || undefined,
          tags: Array.isArray(r.tags) ? r.tags : [],
          likes: Number(r.likes || 0),
          commentsCount: Number(r.comments || r.commentsCount || 0),
          localComments: [],
        };
      });

      setItems(mapped);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "שגיאה לא צפויה");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    if (filterKind === "all") return items;
    return items.filter((it) => it.kind === filterKind);
  }, [items, filterKind]);

  const selectedIndex = useMemo(
    () =>
      selectedId ? filteredItems.findIndex((it) => it.id === selectedId) : -1,
    [filteredItems, selectedId],
  );

  const selectedItem = useMemo(
    () =>
      selectedIndex >= 0 && selectedIndex < filteredItems.length
        ? filteredItems[selectedIndex]
        : null,
    [filteredItems, selectedIndex],
  );

  const hasPrev = selectedIndex > 0;
  const hasNext =
    selectedIndex >= 0 && selectedIndex < filteredItems.length - 1;

  const goPrev = () => {
    if (!hasPrev) return;
    const prev = filteredItems[selectedIndex - 1];
    if (prev) setSelectedId(prev.id);
  };

  const goNext = () => {
    if (!hasNext) return;
    const next = filteredItems[selectedIndex + 1];
    if (next) setSelectedId(next.id);
  };

  const handleLike = async (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, likes: it.likes + 1 } : it)),
    );

    try {
      const res = await fetch("/api/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: id }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.likes === "number") {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, likes: data.likes } : it)),
        );
      }
    } catch (e) {
      console.error("like error", e);
    }
  };

  const handleAddComment = async (
    mediaId: string,
    text: string,
    parentId?: string,
  ) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setItems((prev) =>
      prev.map((it) =>
        it.id === mediaId
          ? {
              ...it,
              commentsCount: it.commentsCount + 1,
              localComments: parentId
                ? it.localComments
                : [...it.localComments, trimmed],
            }
          : it,
      ),
    );

    try {
      await fetch("/api/gallery/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, text: trimmed, parentId }),
      });
    } catch (e) {
      console.error("comment error", e);
    }
  };

  const handleShare = async (item: ItemState) => {
    const url = item.url;
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: item.title || "MATY-MUSIC gallery",
          text: "פריט מתוך הגלריה של MATY-MUSIC",
          url,
        });
        return;
      }
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert("קישור הועתק.");
        return;
      }
    } catch (e) {
      console.error(e);
    }
    alert("אי אפשר לשתף אוטומטי בדפדפן הזה. אפשר להעתיק את הקישור מהכתובת.");
  };

  const handleUploaded = () => {
    void loadItems();
  };

  const handleAdminMetaUpdate = (
    id: string,
    patch: Partial<Pick<ItemState, "title" | "tags">>,
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );
  };

  const handleAdminDelete = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setSelectedId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {finalIsAdmin && (
        <div className="card border border-amber-400/60 bg-slate-900/70 text-slate-100 p-4 backdrop-blur-sm shadow-lg text-right">
          <h2 className="text-lg font-semibold mb-1">ניהול גלריה</h2>
          <p className="text-sm opacity-80 mb-3">
            כאדמין אתה יכול להעלות תמונות, וידאו ושירים לגלריה הראשית.
          </p>
          <CloudinaryUploadButton
            label="העלה תמונות / וידאו / שירים"
            folder="maty-music/gallery"
            tags={["gallery", "site"]}
            multiple
            onUploaded={handleUploaded}
          />
          <p className="text-xs opacity-70 mt-2">
            ההעלאה מתבצעת דרך Cloudinary ונשמרת באוסף המדיה עם תגית{" "}
            <code className="px-1 rounded bg-black/40">gallery</code>.
          </p>
        </div>
      )}

      {/* סרגל סינון + סטטוס */}
      <div className="card bg-slate-900/70 text-slate-100 border border-slate-700 p-3 flex flex-wrap items-center justify-between gap-3 text-right backdrop-blur-sm shadow">
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={filterKind === "all"}
            label="הכל"
            onClick={() => setFilterKind("all")}
          />
          <FilterChip
            active={filterKind === "image"}
            label="תמונות"
            onClick={() => setFilterKind("image")}
          />
          <FilterChip
            active={filterKind === "video"}
            label="וידאו"
            onClick={() => setFilterKind("video")}
          />
          <FilterChip
            active={filterKind === "audio"}
            label="שירים"
            onClick={() => setFilterKind("audio")}
          />
        </div>

        <div className="text-xs opacity-80">
          {loading
            ? "טוען גלריה…"
            : filteredItems.length === 0
              ? "לא נמצאו פריטים לתצוגה."
              : `${filteredItems.length} פריטים מוצגים (סה״כ ${items.length})`}
        </div>
      </div>

      {error && (
        <div className="card border border-red-400/70 bg-red-900/40 text-red-50 text-sm p-3 text-right">
          שגיאה בטעינת הגלריה: {error}
        </div>
      )}

      {!loading && !error && filteredItems.length === 0 && (
        <div className="card text-center p-10 bg-slate-900/70 text-slate-100 border border-slate-700 backdrop-blur-sm">
          <p className="opacity-80 text-sm">עדיין אין פריטים בגלריה.</p>
          {finalIsAdmin && (
            <p className="mt-2 text-xs opacity-70">
              תתחיל בהעלאה ראשונה דרך אזור ניהול הגלריה למעלה.
            </p>
          )}
        </div>
      )}

      {/* רשת הגלריה */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
            onClick={() => setSelectedId(item.id)}
          >
            {item.kind === "image" && (
              <img
                src={item.thumbUrl || item.url}
                alt={item.title || "פריט גלריה"}
                className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            )}

            {item.kind === "video" && (
              <div className="w-full aspect-[4/3] flex items-center justify-center bg-black/70 text-white text-sm relative">
                <span className="inline-flex items-center gap-2 z-10">
                  <span className="inline-flex items-center justify-center rounded-full border border-white/60 px-2 py-0.5 text-[0.7rem] bg-black/60">
                    ▶ וידאו
                  </span>
                  <span className="opacity-80 truncate max-w-[120px]">
                    {item.title || "וידאו"}
                  </span>
                </span>
              </div>
            )}

            {item.kind === "audio" && (
              <div className="w-full aspect-[4/3] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-50 relative overflow-hidden">
                {/* "Equalizer" רוטט */}
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((b) => (
                    <div
                      key={b}
                      className="w-1.5 rounded-full bg-violet-400 animate-pulse"
                      style={{
                        animationDelay: `${b * 80}ms`,
                        height: `${6 + b * 4}px`,
                      }}
                    />
                  ))}
                </div>
                <div className="text-xs font-semibold truncate max-w-[150px]">
                  {item.title || "שיר"}
                </div>
                <div className="text-[0.7rem] opacity-80">
                  לחץ לפתוח נגן שירים
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
              <div className="text-xs font-semibold truncate mb-1">
                {item.title ||
                  (item.kind === "image"
                    ? "תמונה"
                    : item.kind === "video"
                      ? "וידאו"
                      : "שיר")}
              </div>
              <div className="flex items-center justify-between gap-2 text-[0.7rem]">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <span>❤️</span>
                    <span>{item.likes}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span>💬</span>
                    <span>{item.commentsCount}</span>
                  </span>
                </div>
                <span className="opacity-80">לחץ לפתיחה</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* לייטבוקס / מודל גדול */}
      {selectedItem && (
        <GalleryLightbox
          item={selectedItem}
          isAdmin={finalIsAdmin}
          index={selectedIndex + 1}
          total={filteredItems.length}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrev={goPrev}
          onNext={goNext}
          onClose={() => setSelectedId(null)}
          onLike={() => handleLike(selectedItem.id)}
          onAddComment={(text, parentId) =>
            handleAddComment(selectedItem.id, text, parentId)
          }
          onShare={() => handleShare(selectedItem)}
          onAdminMetaUpdate={handleAdminMetaUpdate}
          onAdminDelete={handleAdminDelete}
        />
      )}
    </div>
  );
};

/* ───────────── כפתורי פילטר ───────────── */

const FilterChip: FC<{
  active: boolean;
  label: string;
  onClick: () => void;
}> = ({ active, label, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1 rounded-full text-xs font-medium transition-all",
        "border",
        active
          ? "bg-violet-600 text-white border-violet-500 shadow-sm"
          : "bg-slate-800/70 text-slate-200 border-slate-600 hover:bg-slate-700",
      ].join(" ")}
    >
      {label}
    </button>
  );
};

/* ───────────── לייטבוקס ───────────── */

type LightboxProps = {
  item: ItemState;
  isAdmin?: boolean;
  index: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onLike: () => void;
  onAddComment: (text: string, parentId?: string) => void;
  onShare: () => void;
  onAdminMetaUpdate: (
    id: string,
    patch: Partial<Pick<ItemState, "title" | "tags">>,
  ) => void;
  onAdminDelete: (id: string) => void;
};

const GalleryLightbox: FC<LightboxProps> = ({
  item,
  isAdmin,
  index,
  total,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
  onLike,
  onAddComment,
  onShare,
  onAdminMetaUpdate,
  onAdminDelete,
}) => {
  const [commentText, setCommentText] = useState("");
  const [serverComments, setServerComments] = useState<CommentView[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToPreview, setReplyToPreview] = useState<string | null>(null);

  const [editingMeta, setEditingMeta] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title || "");
  const [editTags, setEditTags] = useState((item.tags || []).join(", "));
  const [savingMeta, setSavingMeta] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // אודיו – שליטה בווליום
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setEditTitle(item.title || "");
    setEditTags((item.tags || []).join(", "));
    setVolume(1);
    setMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = 1;
      audioRef.current.muted = false;
    }
  }, [item.id, item.title, item.tags]);

  // ESC + חצים
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (hasNext) onNext();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (hasPrev) onPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setCommentsLoading(true);
        const res = await fetch(
          `/api/gallery/comment?mediaId=${encodeURIComponent(item.id)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          const rows: any[] = data.comments || [];
          const mapped: CommentView[] = rows.map((c) => ({
            id: String(c.id || c._id),
            text: String(c.text || ""),
            userName: c.userName || undefined,
            createdAt: c.createdAt,
            parentId: c.parentId || null,
          }));
          setServerComments(mapped);
        }
      } catch (e) {
        console.error("load comments error", e);
      } finally {
        if (!cancelled) setCommentsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [item.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;
    onAddComment(trimmed, replyToId || undefined);

    setServerComments((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        text: trimmed,
        createdAt: new Date().toISOString(),
        parentId: replyToId,
      },
    ]);

    setCommentText("");
    setReplyToId(null);
    setReplyToPreview(null);
  };

  const handleReplyClick = (c: CommentView) => {
    setReplyToId(c.id);
    setReplyToPreview(c.text.slice(0, 40));
  };

  const cancelReply = () => {
    setReplyToId(null);
    setReplyToPreview(null);
  };

  const rootComments = serverComments.filter((c) => !c.parentId);
  const repliesByParent: Record<string, CommentView[]> = {};
  serverComments.forEach((c) => {
    if (c.parentId) {
      if (!repliesByParent[c.parentId]) repliesByParent[c.parentId] = [];
      repliesByParent[c.parentId].push(c);
    }
  });

  const allSimpleLocal = item.localComments.map((text, idx) => ({
    id: `local-root-${idx}`,
    text,
    parentId: null,
  }));

  const handleSaveMeta = async () => {
    if (!isAdmin) return;
    const publicId = item.publicId || item.id;
    const cleanTitle = editTitle.trim();
    const tagsArr = editTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setSavingMeta(true);
    try {
      const res = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId,
          patch: {
            title: cleanTitle,
            tags: tagsArr,
          },
        }),
      });
      if (!res.ok) {
        console.error("admin meta patch failed");
      } else {
        onAdminMetaUpdate(item.id, {
          title: cleanTitle,
          tags: tagsArr,
        });
        setEditingMeta(false);
      }
    } catch (e) {
      console.error("admin meta patch error", e);
    } finally {
      setSavingMeta(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    if (
      !confirm(
        "למחוק את הפריט הזה מהגלריה? (הקובץ ב-Cloudinary לא בהכרח יימחק)",
      )
    ) {
      return;
    }
    const publicId = item.publicId || item.id;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/media?publicId=${encodeURIComponent(publicId)}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        console.error("admin delete failed");
      } else {
        onAdminDelete(item.id);
      }
    } catch (e) {
      console.error("admin delete error", e);
    } finally {
      setDeleting(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
      if (v > 0 && muted) {
        audioRef.current.muted = false;
        setMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !muted;
    setMuted(next);
    audioRef.current.muted = next;
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="max-w-6xl w-full relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950/95 text-slate-100 flex flex-col md:flex-row">
        {/* חצים (דסקטופ) */}
        {hasPrev && (
          <button
            type="button"
            onClick={onPrev}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-black/60 border border-slate-700 text-slate-100 hover:bg-black/80 transition"
            aria-label="הקודם"
          >
            ‹
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            onClick={onNext}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-black/60 border border-slate-700 text-slate-100 hover:bg-black/80 transition"
            aria-label="הבא"
          >
            ›
          </button>
        )}

        {/* צד המדיה */}
        <div className="md:w-2/3 bg-black/80 flex items-center justify-center p-3">
          {item.kind === "image" && (
            <img
              src={item.url}
              alt={item.title || "פריט גלריה"}
              className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-lg"
            />
          )}

          {item.kind === "video" && (
            <video
              src={item.url}
              controls
              className="max-h-[85vh] w-full rounded-2xl shadow-lg"
            />
          )}

          {item.kind === "audio" && (
            <div className="w-full flex flex-col items-center justify-center gap-4">
              {/* כותרת האלבום/שיר */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-600/20 border border-violet-500/60 text-xs mb-2">
                  <span className="text-lg">🎧</span>
                  <span>נגן שירים — MATY MUSIC</span>
                </div>
                <h2 className="text-base md:text-lg font-semibold mt-1">
                  {item.title || "שיר"}
                </h2>
              </div>

              {/* דיסק מסתובב */}
              <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 flex items-center justify-center shadow-2xl animate-spin-slow">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-slate-950 flex items-center justify-center border border-white/20">
                  <span className="text-2xl md:text-3xl">🎵</span>
                </div>
              </div>

              {/* נגן אודיו + ווליום */}
              <div className="w-full max-w-md space-y-3">
                <audio
                  ref={audioRef}
                  src={item.url}
                  controls
                  className="w-full rounded-xl bg-slate-900/90"
                  preload="metadata"
                />

                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center gap-1"
                  >
                    <span>{muted || volume === 0 ? "🔇" : "🔊"}</span>
                    <span>{muted || volume === 0 ? "השתק" : "ווליום"}</span>
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="flex-1 accent-violet-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* צד המידע/תגובות */}
        <div className="md:w-1/3 flex flex-col border-r border-slate-800 bg-slate-950/90">
          {/* כותרת + כפתור סגירה */}
          <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1 border-b border-slate-800">
            <div className="flex flex-col gap-1 text-right">
              {editingMeta ? (
                <input
                  type="text"
                  className="text-xs md:text-sm rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="כותרת לתמונה / וידאו / שיר"
                />
              ) : (
                <h2 className="font-semibold text-sm md:text-base truncate max-w-[220px]">
                  {item.title ||
                    (item.kind === "image"
                      ? "תמונה"
                      : item.kind === "video"
                        ? "וידאו"
                        : "שיר")}
                </h2>
              )}
              <div className="flex items-center gap-2 text-[0.7rem] opacity-60">
                {item.createdAt && (
                  <span>
                    הועלה: {new Date(item.createdAt).toLocaleString("he-IL")}
                  </span>
                )}
                <span className="ml-auto">
                  {index} / {total}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-2 py-1 rounded-full bg-slate-800 hover:bg-slate-700 transition"
            >
              ✕ סגור
            </button>
          </div>

          {/* פס אדמין */}
          {isAdmin && (
            <div className="px-4 pt-2 pb-1 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 text-[0.75rem]">
              <div className="flex flex-wrap gap-2">
                {!editingMeta ? (
                  <button
                    type="button"
                    onClick={() => setEditingMeta(true)}
                    className="px-2 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600"
                  >
                    ✎ עריכת פרטים
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={savingMeta}
                      onClick={handleSaveMeta}
                      className="px-2 py-1 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60"
                    >
                      {savingMeta ? "שומר…" : "שמירה"}
                    </button>
                    <button
                      type="button"
                      disabled={savingMeta}
                      onClick={() => {
                        setEditingMeta(false);
                        setEditTitle(item.title || "");
                        setEditTags((item.tags || []).join(", "));
                      }}
                      className="px-2 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600"
                    >
                      ביטול
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="px-2 py-1 rounded-full bg-red-700 hover:bg-red-600 border border-red-500 disabled:opacity-60"
                >
                  {deleting ? "מוחק…" : "מחק פריט"}
                </button>
              </div>
              {item.publicId && (
                <div className="opacity-60 truncate max-w-[120px] text-left">
                  <span className="hidden md:inline">publicId: </span>
                  {item.publicId}
                </div>
              )}
            </div>
          )}

          {/* תגיות + לייק/שיתוף */}
          <div className="px-4 pt-2 pb-1 flex flex-col gap-2 text-right">
            {editingMeta && (
              <div className="flex flex-col gap-1 text-[0.7rem]">
                <label className="opacity-80">תגיות (מופרדות בפסיק):</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500 text-[0.7rem]"
                  placeholder="למשל: gallery, live, maty-music"
                />
              </div>
            )}

            {!editingMeta && item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 text-[0.7rem]">
                {item.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-100 border border-slate-700"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs mt-1">
              <button
                type="button"
                onClick={onLike}
                className="px-3 py-1 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1 transition"
              >
                <span>❤️</span>
                <span>לייק ({item.likes})</span>
              </button>
              <button
                type="button"
                onClick={onShare}
                className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs transition"
              >
                ↗ שיתוף
              </button>
            </div>
          </div>

          {/* אזור תגובות */}
          <div className="flex-1 flex flex-col border-t border-slate-800 mt-2">
            <div className="flex items-center justify-between px-4 pt-2 pb-1 text-xs">
              <span className="font-semibold">
                תגובות ({item.commentsCount})
              </span>
              {commentsLoading && (
                <span className="text-[0.7rem] opacity-60">טוען…</span>
              )}
            </div>

            <div className="flex-1 min-h-[90px] max-h-64 overflow-y-auto px-4 pb-2 space-y-2 text-xs">
              {rootComments.length === 0 && allSimpleLocal.length === 0 ? (
                <div className="opacity-60 mt-2">
                  עדיין אין תגובות. תהיה הראשון להגיב.
                </div>
              ) : (
                <>
                  {rootComments.map((c) => (
                    <div key={c.id} className="space-y-1">
                      <div className="px-3 py-2 rounded-2xl bg-slate-900 text-slate-100 border border-slate-700">
                        {c.userName && (
                          <span className="font-semibold ml-1">
                            {c.userName}:
                          </span>
                        )}
                        <span>{c.text}</span>
                        <div className="flex items-center justify-between mt-1 text-[0.7rem] opacity-70">
                          {c.createdAt && (
                            <span>
                              {new Date(c.createdAt).toLocaleString("he-IL")}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleReplyClick(c)}
                            className="underline underline-offset-2"
                          >
                            השב
                          </button>
                        </div>
                      </div>

                      {repliesByParent[c.id] && (
                        <div className="mr-3 border-r border-slate-700/60 space-y-1 pr-2">
                          {repliesByParent[c.id].map((r) => (
                            <div
                              key={r.id}
                              className="px-3 py-2 rounded-2xl bg-slate-900/70 text-slate-50 border border-slate-800"
                            >
                              {r.userName && (
                                <span className="font-semibold ml-1">
                                  {r.userName}:
                                </span>
                              )}
                              <span>{r.text}</span>
                              {r.createdAt && (
                                <div className="text-[0.7rem] opacity-60 mt-0.5">
                                  {new Date(r.createdAt).toLocaleString(
                                    "he-IL",
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {allSimpleLocal.map((c) => (
                    <div
                      key={c.id}
                      className="px-3 py-2 rounded-2xl bg-slate-900 text-slate-100 border border-slate-700"
                    >
                      {c.text}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* טופס תגובה */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-800 px-4 py-2 flex flex-col gap-1"
            >
              {replyToId && (
                <div className="flex items-center justify-between text-[0.7rem] bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 mb-1">
                  <span className="opacity-80">
                    מגיב כעת לתגובה:{" "}
                    <span className="font-semibold">
                      {replyToPreview || "תגובה"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={cancelReply}
                    className="text-red-400"
                  >
                    ביטול
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={
                    replyToId ? "כתוב תשובה לתגובה…" : "כתוב תגובה חדשה…"
                  }
                  className="flex-1 text-xs rounded-xl border border-slate-700 bg-slate-900 px-3 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs transition"
                >
                  שלח
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryClient;
