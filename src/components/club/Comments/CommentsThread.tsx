// src/components/club/Comments/CommentsThread.tsx
"use client";
import * as React from "react";
import CommentComposer from "./CommentComposer";
import CommentItem from "./CommentItem";

type Comment = {
  _id: string;
  authorId: string;
  authorName?: string | null;
  authorAvatar?: string | null;
  text: string;
  createdAt: string;
  likes?: number;
  parentId?: string | null;
};

type Props = { postId: string };

export default function CommentsThread({ postId }: Props) {
  const [items, setItems] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [total, setTotal] = React.useState<number>(0);
  const [replyTo, setReplyTo] = React.useState<Comment | null>(null);

  const load = React.useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set("postId", postId);
        qs.set("parentId", "null"); // top-level
        if (!reset && cursor) qs.set("after", cursor);
        const res = await fetch(`/api/club/comments?${qs.toString()}`, {
          cache: "no-store",
        });
        const j = await res.json();
        if (j?.ok) {
          setTotal(j.total || 0);
          setItems((prev) => (reset ? j.items : [...prev, ...j.items]));
          setCursor(j.nextCursor);
        }
      } finally {
        setLoading(false);
      }
    },
    [postId, cursor],
  );

  React.useEffect(() => {
    setItems([]);
    setCursor(null);
    load(true);
  }, [postId]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/club/comments/${id}`, { method: "DELETE" });
    const j = await res.json();
    if (j?.ok) {
      setItems((prev) => prev.filter((x) => String(x._id) != id));
      setTotal((t) => Math.max(0, t - 1));
    }
  }

  async function handleLike(id: string) {
    const res = await fetch(`/api/club/comments/${id}?action=like`, {
      method: "POST",
    });
    const j = await res.json();
    if (j?.ok?.toString() || j?.item) {
      setItems((prev) =>
        prev.map((x) =>
          String(x._id) === id ? { ...x, likes: (x.likes || 0) + 1 } : x,
        ),
      );
    }
  }

  return (
    <div className="w-full" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <b>תגובות ({total})</b>
        {cursor && (
          <button onClick={() => load(false)} className="text-xs underline">
            טען עוד
          </button>
        )}
      </div>

      <CommentComposer
        postId={postId}
        onSubmitted={(ok, item) => {
          if (ok && item) {
            setItems((prev) => [item, ...prev]);
            setTotal((t) => t + 1);
          }
          setReplyTo(null);
        }}
      />

      <div className="mt-4 divide-y">
        {items.map((c) => (
          <CommentItem
            key={String(c._id)}
            item={{ ...c, createdAt: c.createdAt }}
            onDelete={handleDelete}
            onLike={handleLike}
            onReply={(it) => setReplyTo(it as any)}
          />
        ))}
        {!items.length && !loading && (
          <div className="py-6 text-sm opacity-70">
            אין תגובות עדיין. היה הראשון להגיב!
          </div>
        )}
      </div>

      {loading && <div className="py-4 text-sm opacity-70">טוען…</div>}
    </div>
  );
}
