// src/components/club/PostComments.tsx
"use client";

import * as React from "react";

type CommentItem = {
  _id: string;
  postId: string;
  user?: { id?: string; name?: string; image?: string };
  text: string;
  createdAt: string;
};

export default function PostComments({ postId }: { postId: string }) {
  const [items, setItems] = React.useState<CommentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(
          `/api/club/comments?postId=${encodeURIComponent(postId)}`,
          {
            cache: "no-store",
          },
        );
        const j = await r.json().catch(() => null);
        if (!dead && j?.ok && Array.isArray(j.items)) setItems(j.items);
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, [postId]);

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setSending(true);
    // אופטימי
    const temp: CommentItem = {
      _id: `tmp-${Date.now()}`,
      postId,
      text: t,
      createdAt: new Date().toISOString(),
      user: { name: "אתה", image: "/assets/images/avatar-soft.png" },
    };
    setItems((prev) => [temp, ...prev]);
    setText("");
    try {
      const r = await fetch("/api/club/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postId, text: t }),
      });
      const j = await r.json().catch(() => null);
      if (!j?.ok || !j.item) throw new Error("fail");
      // החלפת ה־temp בהודעה אמיתית
      setItems((prev) => {
        const copy = prev.slice();
        const idx = copy.findIndex((c) => c._id === temp._id);
        if (idx >= 0) copy[idx] = j.item;
        return copy;
      });
    } catch {
      // ביטול אופטימי
      setItems((prev) => prev.filter((c) => c._id !== temp._id));
      alert("לא הצלחנו לפרסם תגובה. נסה שוב.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="mt-3 rounded-2xl border border-black/10 dark:border-white/10 p-3 bg-white/70 dark:bg-neutral-900/60"
    >
      <div className="text-sm font-semibold mb-2">תגובות</div>

      <form onSubmit={addComment} className="flex items-center gap-2 mb-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="כתוב תגובה…"
          className="flex-1 rounded-xl border px-3 py-2 bg-white/90 dark:bg-neutral-900/80"
          maxLength={600}
        />
        <button
          disabled={sending || !text.trim()}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
        >
          פרסם
        </button>
      </form>

      {loading ? (
        <div className="text-sm opacity-70">טוען תגובות…</div>
      ) : items.length === 0 ? (
        <div className="text-sm opacity-70">עדיין אין תגובות. היה הראשון!</div>
      ) : (
        <ul className="grid gap-2">
          {items.map((c) => (
            <li
              key={c._id}
              className="flex items-start gap-2 rounded-xl border border-black/10 dark:border-white/10 p-2"
            >
              <img
                src={c.user?.image || "/assets/images/avatar-soft.png"}
                alt={c.user?.name || ""}
                className="h-8 w-8 rounded-full object-cover border border-black/10 dark:border-white/10"
                onError={(e) =>
                  ((e.currentTarget as HTMLImageElement).src =
                    "/assets/images/avatar-soft.png")
                }
              />
              <div className="min-w-0">
                <div className="text-xs opacity-70 flex items-center gap-2">
                  <b className="truncate max-w-[160px]">
                    {c.user?.name || "משתמש"}
                  </b>
                  <span>•</span>
                  <span>
                    {new Date(c.createdAt).toLocaleString("he-IL", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <div className="text-sm whitespace-pre-wrap mt-1">{c.text}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
