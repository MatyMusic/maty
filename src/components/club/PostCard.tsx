// src/components/club/PostCard.tsx
"use client";

import type { Post as PostItem } from "@/lib/club/types";
import Link from "next/link";
import * as React from "react";

/* ───────── Utils ───────── */
const n = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const MAX_FILES = 3;
const ALLOWED_KINDS = ["image/", "video/"] as const;

// מפתחות ל-localStorage
const LS_POST_LIKES_KEY = "mm:club:liked_posts";
const LS_COMMENT_LIKES_KEY = "mm:club:liked_comments";

function timeAgo(ts?: string | number | Date) {
  if (!ts) return "";
  const d = new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "לפני רגע";
  if (diff < 3600) return `${Math.floor(diff / 60)} ד׳`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ש׳`;
  return d.toLocaleString("he-IL");
}

function getPostId(p: any): string | null {
  const raw =
    p?._id ??
    p?.id ??
    p?.postId ??
    (typeof p?.toString === "function" ? p.toString() : null);
  if (raw && typeof raw === "object" && "toString" in raw) {
    try {
      return (raw as any).toString();
    } catch {}
  }
  return raw ? String(raw) : null;
}

/* ───────── Comments types + API ───────── */
export type ClubComment = {
  _id: string;
  postId: string;
  parentId?: string | null;
  userId?: string | null;
  userName?: string | null;
  userImage?: string | null;

  text?: string;
  body?: string;

  attachments?: Array<
    | {
        url: string;
        type: "image" | "video";
        width?: number;
        height?: number;
        thumbUrl?: string | null;
      }
    | null
    | undefined
  >;
  createdAt?: string;
  likeCount?: number;
  liked?: boolean;
  pending?: boolean;
  failed?: boolean;
};

async function fetchComments(postId: string): Promise<ClubComment[]> {
  try {
    const r = await fetch(
      `/api/club/comments?postId=${encodeURIComponent(postId)}&limit=100`,
      { cache: "no-store" },
    );
    const j = await r.json().catch(() => null);
    if (!j?.ok || !Array.isArray(j.items)) return [];
    return (j.items as ClubComment[]).map((c) => ({
      ...c,
      text:
        typeof c.text === "string"
          ? c.text
          : typeof c.body === "string"
            ? c.body
            : "",
      attachments: Array.isArray(c.attachments)
        ? c.attachments
            .filter(
              (a): a is NonNullable<ClubComment["attachments"][number]> =>
                !!a && typeof a.url === "string" && a.url.length > 0,
            )
            .map((a) => ({
              ...a,
              type: a.type === "video" ? "video" : "image",
            }))
        : [],
    }));
  } catch {
    return [];
  }
}

async function postCommentForm(fd: FormData): Promise<ClubComment | null> {
  try {
    const r = await fetch(`/api/club/comments`, { method: "POST", body: fd });
    if (r.status === 401) {
      alert("צריך להתחבר כדי להגיב.");
      return null;
    }
    const j = await r.json().catch(() => null);
    if (!j?.ok || !j.item) return null;
    const c = j.item as ClubComment;
    return {
      ...c,
      attachments: Array.isArray(c.attachments)
        ? c.attachments
            .filter(
              (a): a is NonNullable<ClubComment["attachments"][number]> =>
                !!a && typeof a.url === "string" && a.url.length > 0,
            )
            .map((a) => ({
              ...a,
              type: a.type === "video" ? "video" : "image",
            }))
        : [],
    };
  } catch {
    return null;
  }
}

async function likeComment(commentId: string, on: boolean) {
  try {
    const r = await fetch(`/api/club/comments/like`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ commentId, on }),
    });
    if (r.status === 401) {
      alert("צריך להתחבר כדי לעשות לייק.");
      return false;
    }
    const j = await r.json().catch(() => null);
    return !!j?.ok;
  } catch {
    return false;
  }
}

/* ───────── LocalStorage helpers ───────── */
function readLsArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as string[]) : [];
  } catch {
    return [];
  }
}

function writeLsArray(key: string, arr: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(arr));
  } catch {}
}

/* ───────── build tree ───────── */
type CommentNode = ClubComment & { children: CommentNode[] };

function buildTree(list: ClubComment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const cleaned: ClubComment[] = [];

  for (const c of list) {
    if (!c || !c._id) continue;
    cleaned.push(c);
  }

  cleaned.forEach((c) => map.set(c._id, { ...c, children: [] }));

  const roots: CommentNode[] = [];

  cleaned.forEach((c) => {
    const node = map.get(c._id);
    if (!node) return;
    const pid = c.parentId || null;
    if (pid && map.has(pid)) {
      map.get(pid)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortLevel = (arr: CommentNode[]) => {
    arr.sort(
      (a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0),
    );
    arr.forEach((n) => sortLevel(n.children));
  };

  sortLevel(roots);
  return roots;
}

/* ───────── file pick helpers ───────── */
type PickedFile = { file: File; url: string; kind: "image" | "video" };

function pickFilesFromInput(input: HTMLInputElement): PickedFile[] {
  const out: PickedFile[] = [];
  const files = input.files ? Array.from(input.files) : [];

  for (const f of files.slice(0, MAX_FILES)) {
    const type = f.type || "";
    const ok = ALLOWED_KINDS.some((p) => type.startsWith(p));
    if (!ok) continue;

    const url = URL.createObjectURL(f);
    out.push({
      file: f,
      url,
      kind: type.startsWith("image/") ? "image" : "video",
    });
  }

  return out;
}

/* ───────── Single comment item with reply ───────── */
function CommentItem({
  node,
  onToggleLike,
  onReplySubmit,
}: {
  node: CommentNode;
  onToggleLike: (c: ClubComment) => void;
  onReplySubmit: (
    parentId: string,
    text: string,
    files: File[],
  ) => Promise<void>;
}) {
  const c = node;

  const commentText: string = String(c.text ?? c.body ?? "").trim();
  const long = commentText.length > 280;
  const [expanded, setExpanded] = React.useState(false);
  const [openReply, setOpenReply] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [picked, setPicked] = React.useState<PickedFile[]>([]);

  const body =
    long && !expanded ? commentText.slice(0, 280) + "…" : commentText;

  const safeAttachments = React.useMemo(
    () =>
      (c.attachments ?? [])
        .filter(
          (a): a is NonNullable<ClubComment["attachments"][number]> =>
            !!a && typeof a.url === "string" && a.url.length > 0,
        )
        .slice(0, MAX_FILES),
    [c.attachments],
  );

  React.useEffect(() => {
    return () => {
      picked.forEach((p) => {
        try {
          URL.revokeObjectURL(p.url);
        } catch {}
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const next = pickFilesFromInput(e.currentTarget);
    setPicked((x) => [...x, ...next].slice(0, MAX_FILES));
    e.currentTarget.value = "";
  }

  function removePicked(i: number) {
    setPicked((arr) => {
      const el = arr[i];
      if (el?.url) {
        try {
          URL.revokeObjectURL(el.url);
        } catch {}
      }
      return arr.filter((_, idx) => idx !== i);
    });
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    const hasMedia = picked.length > 0;
    let t = replyText.trim();
    if (!t && hasMedia) t = "מדיה מצורפת";
    if (!t && !hasMedia) return;

    await onReplySubmit(
      c._id,
      t,
      picked.map((p) => p.file),
    );

    setReplyText("");
    picked.forEach((p) => {
      try {
        URL.revokeObjectURL(p.url);
      } catch {}
    });
    setPicked([]);
    setOpenReply(false);
  }

  return (
    <li
      className={[
        "rounded-xl border border-black/10 dark:border-white/10 p-2",
        c.failed
          ? "bg-rose-50/70 dark:bg-rose-900/20"
          : "bg-white/80 dark:bg-neutral-900/70",
        c.pending ? "opacity-70" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <img
          src={c.userImage || "/assets/images/avatar-soft.png"}
          alt={c.userName || ""}
          className="h-7 w-7 rounded-full object-cover border border-black/10 dark:border-white/10"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            img.onerror = null;
            img.src = "/assets/images/avatar-soft.png";
          }}
        />
        <div className="min-w-0">
          <div className="text-xs font-semibold truncate">
            {c.userId ? (
              <Link
                href={`/date/u/${encodeURIComponent(c.userId)}`}
                className="hover:underline"
                title="צפייה בפרופיל המשתמש"
              >
                {c.userName || "משתמש"}
              </Link>
            ) : (
              c.userName || "משתמש"
            )}
            {c.pending && <span className="ms-1 opacity-60">(שולח…)</span>}
            {c.failed && (
              <span className="ms-1 text-rose-600">שגיאה בשליחה</span>
            )}
          </div>
          {c.createdAt && (
            <div className="text-[11px] opacity-60">{timeAgo(c.createdAt)}</div>
          )}
        </div>
        <div className="ms-auto flex items-center gap-1">
          <button
            onClick={() => onToggleLike(c)}
            className="rounded-lg border px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/5"
            title="לייק לתגובה"
          >
            {c.liked ? "❤️" : "🤍"} {n(c.likeCount)}
          </button>
          <button
            onClick={() => setOpenReply((o) => !o)}
            className="rounded-lg border px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/5"
            title="השב/י"
          >
            השב/י
          </button>
        </div>
      </div>

      {commentText && (
        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed">
          {body}
        </p>
      )}

      {safeAttachments.length > 0 && (
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {safeAttachments.map((a, i) =>
            a.type === "image" ? (
              <img
                key={`${a.url}-${i}`}
                src={a.thumbUrl || a.url}
                alt=""
                className="w-full rounded-lg object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  img.classList.add("hidden");
                }}
              />
            ) : (
              <video
                key={`${a.url}-${i}`}
                src={a.url}
                controls
                className="w-full rounded-lg max-h-56 object-cover"
                preload="metadata"
                onError={(e) => {
                  const v = e.currentTarget as HTMLVideoElement;
                  v.onerror = null;
                  v.classList.add("hidden");
                }}
              />
            ),
          )}
        </div>
      )}

      {long && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-[12px] underline underline-offset-2 opacity-80 hover:opacity-100"
        >
          {expanded ? "פחות" : "עוד"}
        </button>
      )}

      {openReply && (
        <form onSubmit={submitReply} className="mt-3 ms-8 grid gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="כתבו תגובה לתגובה…"
            className="w-full rounded-xl border px-3 py-2 text-sm bg-white/90 dark:bg-neutral-900/90"
          />
          {picked.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {picked.map((p, i) => (
                <div key={i} className="relative">
                  {p.kind === "image" ? (
                    <img
                      src={p.url}
                      className="rounded-lg object-cover w-full h-20"
                      alt=""
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.onerror = null;
                        img.classList.add("hidden");
                      }}
                    />
                  ) : (
                    <video
                      src={p.url}
                      className="rounded-lg w-full h-20 object-cover"
                      preload="metadata"
                      onError={(e) => {
                        const v = e.currentTarget as HTMLVideoElement;
                        v.onerror = null;
                        v.classList.add("hidden");
                      }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removePicked(i)}
                    className="absolute top-1 left-1 rounded-md bg-black/60 text-white text-[11px] px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <label className="cursor-pointer text-xs rounded-lg border px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5">
              צירוף מדיה
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*"
                multiple
                onChange={onPickFiles}
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-white bg-emerald-600 hover:opacity-95 shadow-sm disabled:opacity-50"
              disabled={!replyText.trim() && picked.length === 0}
            >
              פרסום תגובה
            </button>
          </div>
        </form>
      )}

      {node.children.length > 0 && (
        <ul className="mt-3 ms-6 grid gap-2">
          {node.children.map((child) => (
            <CommentItem
              key={child._id}
              node={child}
              onToggleLike={onToggleLike}
              onReplySubmit={onReplySubmit}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ───────── Thread with replies + media ───────── */
function CommentsThread({ postId }: { postId: string | null }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [list, setList] = React.useState<ClubComment[]>([]);
  const [text, setText] = React.useState("");
  const [picked, setPicked] = React.useState<PickedFile[]>([]);
  const [more, setMore] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const loadedRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      picked.forEach((p) => {
        try {
          URL.revokeObjectURL(p.url);
        } catch {}
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!postId || !rootRef.current) return;
    const target = rootRef.current;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadedRef.current) {
          loadedRef.current = true;
          setLoading(true);
          fetchComments(postId)
            .then((items) => {
              const likedIds = new Set(readLsArray(LS_COMMENT_LIKES_KEY));
              const withLiked = items.map((c) => ({
                ...c,
                liked: likedIds.has(c._id),
              }));
              setList(withLiked);
            })
            .finally(() => setLoading(false));
        }
      },
      { rootMargin: "240px 0px" },
    );

    obs.observe(target);

    return () => {
      obs.disconnect();
    };
  }, [postId]);

  function onPickRoot(e: React.ChangeEvent<HTMLInputElement>) {
    const next = pickFilesFromInput(e.currentTarget);
    setPicked((x) => [...x, ...next].slice(0, MAX_FILES));
    e.currentTarget.value = "";
  }

  function removePickedRoot(i: number) {
    setPicked((arr) => {
      const el = arr[i];
      if (el?.url) {
        try {
          URL.revokeObjectURL(el.url);
        } catch {}
      }
      return arr.filter((_, idx) => idx !== i);
    });
  }

  function toggleLike(c: ClubComment) {
    const want = !c.liked;
    setList((arr) =>
      arr.map((x) =>
        x._id === c._id
          ? {
              ...x,
              liked: want,
              likeCount: Math.max(0, n(x.likeCount) + (want ? 1 : -1)),
            }
          : x,
      ),
    );

    const likedIds = new Set(readLsArray(LS_COMMENT_LIKES_KEY));
    if (want) likedIds.add(c._id);
    else likedIds.delete(c._id);
    writeLsArray(LS_COMMENT_LIKES_KEY, Array.from(likedIds));

    likeComment(c._id, want).then((ok) => {
      if (!ok) {
        setList((arr) =>
          arr.map((x) =>
            x._id === c._id
              ? {
                  ...x,
                  liked: !want,
                  likeCount: Math.max(0, n(x.likeCount) + (want ? -1 : +1)),
                }
              : x,
          ),
        );
        const ids = new Set(readLsArray(LS_COMMENT_LIKES_KEY));
        if (want) ids.delete(c._id);
        else ids.add(c._id);
        writeLsArray(LS_COMMENT_LIKES_KEY, Array.from(ids));
      }
    });
  }

  async function submitRoot(e: React.FormEvent) {
    e.preventDefault();
    if (!postId) return;
    const hasMedia = picked.length > 0;
    let t = text.trim();
    if (!t && hasMedia) t = "מדיה מצורפת";
    if (!t && !hasMedia) return;

    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const temp: ClubComment = {
      _id: tempId,
      postId,
      text: t,
      body: t,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      liked: false,
      pending: true,
      attachments: picked.map((p) => ({
        url: p.url,
        type: p.kind,
      })),
    };

    setList((arr) => [temp, ...arr]);
    setText("");

    const fd = new FormData();
    fd.append("postId", postId);
    fd.append("text", t);
    fd.append("body", t);
    picked.forEach((f) => {
      fd.append("files", f.file);
      fd.append("media", f.file);
    });

    const saved = await postCommentForm(fd);

    picked.forEach((p) => {
      try {
        URL.revokeObjectURL(p.url);
      } catch {}
    });
    setPicked([]);

    if (saved) {
      setList((arr) =>
        arr.map((x) =>
          x._id === tempId
            ? {
                ...saved,
                attachments:
                  saved.attachments && saved.attachments.length > 0
                    ? saved.attachments
                    : temp.attachments,
                pending: false,
              }
            : x,
        ),
      );
    } else {
      setList((arr) =>
        arr.map((x) =>
          x._id === tempId ? { ...x, pending: false, failed: true } : x,
        ),
      );
    }
  }

  async function submitReply(parentId: string, text: string, files: File[]) {
    if (!postId) return;
    const hasMedia = files.length > 0;
    let t = text.trim();
    if (!t && hasMedia) t = "מדיה מצורפת";
    if (!t && !hasMedia) return;

    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const blobUrls: string[] = [];

    const temp: ClubComment = {
      _id: tempId,
      postId,
      parentId,
      text: t,
      body: t,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      liked: false,
      pending: true,
      attachments: files.map((f) => {
        const url = URL.createObjectURL(f);
        blobUrls.push(url);
        return {
          url,
          type: f.type.startsWith("image/") ? "image" : "video",
        };
      }),
    };

    setList((arr) => [temp, ...arr]);

    const fd = new FormData();
    fd.append("postId", postId);
    fd.append("parentId", parentId);
    fd.append("text", t);
    fd.append("body", t);
    files.forEach((f) => {
      fd.append("files", f);
      fd.append("media", f);
    });

    const saved = await postCommentForm(fd);

    if (saved) {
      blobUrls.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
      setList((arr) =>
        arr.map((x) =>
          x._id === tempId
            ? {
                ...saved,
                attachments:
                  saved.attachments && saved.attachments.length > 0
                    ? saved.attachments
                    : temp.attachments,
                pending: false,
              }
            : x,
        ),
      );
    } else {
      setList((arr) =>
        arr.map((x) =>
          x._id === tempId ? { ...x, pending: false, failed: true } : x,
        ),
      );
    }
  }

  const tree = buildTree(list);
  const flatCount = list.length;
  const rootsShown = more ? tree : tree.slice(0, 5);

  return (
    <div ref={rootRef} dir="rtl" className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
        aria-expanded={open}
        disabled={!postId}
      >
        💬 תגובות {flatCount > 0 ? `(${flatCount})` : ""}
      </button>

      {open && (
        <div className="mt-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-3">
          <form onSubmit={submitRoot} className="grid gap-2">
            <label
              className="text-xs opacity-70"
              htmlFor={`comment_${postId || "x"}`}
            >
              כתוב/כתבי תגובה
            </label>
            <textarea
              id={`comment_${postId || "x"}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              minLength={0}
              maxLength={1000}
              rows={3}
              placeholder={postId ? "מה דעתך?" : "מזהה פוסט חסר"}
              disabled={!postId}
              className="w-full rounded-xl border px-3 py-2 text-sm bg-white/90 dark:bg-neutral-900/90"
            />

            {picked.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {picked.map((p, i) => (
                  <div key={i} className="relative">
                    {p.kind === "image" ? (
                      <img
                        src={p.url}
                        className="rounded-lg object-cover w-full h-24"
                        alt=""
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null;
                          img.classList.add("hidden");
                        }}
                      />
                    ) : (
                      <video
                        src={p.url}
                        className="rounded-lg w-full h-24 object-cover"
                        preload="metadata"
                        onError={(e) => {
                          const v = e.currentTarget as HTMLVideoElement;
                          v.onerror = null;
                          v.classList.add("hidden");
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removePickedRoot(i)}
                      className="absolute top-1 left-1 rounded-md bg-black/60 text-white text-[11px] px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-xs rounded-lg border px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5">
                צירוף מדיה
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  multiple
                  onChange={onPickRoot}
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-white bg-emerald-600 hover:opacity-95 shadow-sm disabled:opacity-50"
                disabled={!postId || (!text.trim() && picked.length === 0)}
              >
                שלח/י
              </button>
            </div>
          </form>

          {loading && (
            <div className="mt-3 text-sm opacity-70">טוען תגובות…</div>
          )}
          {!loading && flatCount === 0 && (
            <div className="mt-3 text-sm opacity-70">עוד אין תגובות 🙂</div>
          )}

          {rootsShown.length > 0 && (
            <ul className="mt-3 grid gap-2">
              {rootsShown.map((node) => (
                <CommentItem
                  key={node._id}
                  node={node}
                  onToggleLike={toggleLike}
                  onReplySubmit={submitReply}
                />
              ))}
            </ul>
          )}

          {tree.length > 5 && (
            <div className="mt-2 text-center">
              <button
                onClick={() => setMore((v) => !v)}
                className="rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
              >
                {more ? "הצג פחות" : "הצג את כל השרשור"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────── PostCard ───────── */
export default function PostCard({ post }: { post: PostItem }) {
  const postId = React.useMemo(() => getPostId(post), [post]);

  const [liked, setLiked] = React.useState<boolean>(false);
  const [likeCount, setLikeCount] = React.useState<number>(
    n((post as any).likeCount ?? (post as any).likes),
  );
  const [saved, setSaved] = React.useState(false);
  const [likeBusy, setLikeBusy] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("mm:club:saved");
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      if (postId) setSaved(arr.includes(postId));
    } catch {}
  }, [postId]);

  function flipSaved() {
    if (!postId) return;
    try {
      const raw = localStorage.getItem("mm:club:saved");
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      const found = arr.includes(postId);
      const next = found ? arr.filter((x) => x !== postId) : [...arr, postId];
      localStorage.setItem("mm:club:saved", JSON.stringify(next));
      setSaved(!found);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mm:track", {
            detail: { kind: "club_save", id: postId, on: !found },
          }),
        );
      }
    } catch {}
  }

  React.useEffect(() => {
    if (!postId) {
      setLiked(false);
      return;
    }
    const likedIds = new Set(readLsArray(LS_POST_LIKES_KEY));
    setLiked(likedIds.has(postId));
  }, [postId]);

  async function toggleLike() {
    if (!postId || likeBusy) return;
    const wantOn = !liked;
    setLikeBusy(true);

    setLiked(wantOn);
    setLikeCount((x) => Math.max(0, x + (wantOn ? +1 : -1)));

    const ids = new Set(readLsArray(LS_POST_LIKES_KEY));
    if (wantOn) ids.add(postId);
    else ids.delete(postId);
    writeLsArray(LS_POST_LIKES_KEY, Array.from(ids));

    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mm:track", {
            detail: { kind: "club_like", id: postId, on: wantOn },
          }),
        );
      }
    } finally {
      setLikeBusy(false);
    }
  }

  function share() {
    if (typeof window === "undefined") return;
    const url = postId
      ? `${location.origin}/club?post=${encodeURIComponent(postId)}`
      : location.href;
    const title = "פוסט מ־MATY-CLUB";
    const text = (post as any).text?.slice(0, 140) || title;
    if (navigator.share) {
      navigator
        .share({ title, text, url })
        .catch(() => navigator.clipboard.writeText(url));
    } else {
      navigator.clipboard.writeText(url);
      alert("קישור לפוסט הועתק");
    }
    if (postId) {
      window.dispatchEvent(
        new CustomEvent("mm:track", {
          detail: { kind: "club_share", id: postId },
        }),
      );
    }
  }

  async function report() {
    if (!postId) return alert("מזהה פוסט חסר");
    const reason =
      prompt("לכתוב סיבה קצרה לדיווח (עד 300 תווים):")?.slice(0, 300) || "";
    if (!reason) return;
    try {
      const r = await fetch("/api/club/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postId, reason }),
      });
      const j = await r.json().catch(() => null);
      alert(j?.ok ? "תודה! נבדוק את זה." : "שגיאה בשליחת הדיווח");
    } catch {
      alert("שגיאת רשת");
    }
  }

  const hasVideo = !!(post as any).videoUrl;
  const hasImage = !!(post as any).coverUrl;

  return (
    <article
      dir="rtl"
      className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 overflow-hidden"
    >
      {hasVideo ? (
        <div className="bg-black">
          <video
            src={(post as any).videoUrl!}
            poster={(post as any).coverUrl || undefined}
            controls
            playsInline
            preload="metadata"
            className="w-full h-auto max-h-[70vh]"
            onError={(e) => {
              const v = e.currentTarget as HTMLVideoElement;
              v.onerror = null;
              v.classList.add("hidden");
            }}
          />
        </div>
      ) : hasImage ? (
        <div className="w-full aspect-video bg-neutral-200/60 dark:bg-neutral-800/50">
          <img
            src={(post as any).coverUrl!}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.onerror = null;
              img.src = "/assets/images/fallback-cover.jpg";
            }}
          />
        </div>
      ) : null}

      <div className="p-3">
        <div className="flex flex-wrap items-center gap-2 text-xs opacity-70">
          <span>
            מאת: {String((post as any).authorId || "").slice(0, 8) || "—"}
          </span>
          {(post as any).genre && <span>• ז׳אנר: {(post as any).genre}</span>}
          {Array.isArray((post as any).tags) &&
            (post as any).tags.length > 0 && (
              <span className="truncate">
                • תגיות: {(post as any).tags.slice(0, 5).join(", ")}
                {(post as any).tags.length > 5 ? "…" : ""}
              </span>
            )}
          <span className="ms-auto">
            {(post as any).createdAt
              ? new Date((post as any).createdAt).toLocaleString("he-IL")
              : ""}
          </span>
        </div>

        {(post as any).text && (
          <p className="mt-2 whitespace-pre-wrap leading-relaxed">
            {(post as any).text}
          </p>
        )}

        {(post as any).trackUrl && (
          <audio
            src={(post as any).trackUrl}
            controls
            preload="none"
            className="mt-3 w-full"
          />
        )}

        <div className="mt-3 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 text-sm">
          <button
            onClick={toggleLike}
            disabled={!postId || likeBusy}
            className="rounded-xl border px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            title="לייק"
          >
            {liked ? "❤️" : "🤍"} {likeCount}
          </button>
          <button
            onClick={flipSaved}
            className="rounded-xl border px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5"
            title={saved ? "מחק מהשמורים" : "שמור למאוחר יותר"}
          >
            {saved ? "✅ שמור" : "⭐ שמור"}
          </button>
          <button
            onClick={share}
            className="rounded-xl border px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5"
          >
            שיתוף
          </button>
          <button
            onClick={report}
            className="rounded-xl border px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5"
          >
            דיווח
          </button>
        </div>

        <CommentsThread postId={postId} />
      </div>
    </article>
  );
}
