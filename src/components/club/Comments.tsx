// src/components/club/Comments.tsx
"use client";

import * as React from "react";

type Comment = {
  _id: string;
  userId: string;
  userName: string;
  body: string;
  createdAt: string;
};

export default function Comments({ postId }: { postId: string }) {
  const [items, setItems] = React.useState<Comment[]>([]);
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/club/posts/${postId}/comments`, {
        cache: "no-store",
      });
      const j = await r.json();
      setItems(j?.items || []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, [postId]);

  async function submit() {
    const body = text.trim();
    if (!body) return;
    try {
      const r = await fetch(`/api/club/posts/${postId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const j = await r.json();
      if (j?.ok) {
        setText("");
        setItems((prev) => [j.item, ...prev]);
      } else {
        alert(j?.error || "שגיאה");
      }
    } catch (e: any) {
      alert(String(e?.message || e));
    }
  }

  return (
    <div dir="rtl" className="mt-3 space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2 text-sm bg-transparent"
          placeholder="כתוב/כתבי תגובה…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button
          className="rounded-xl border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          onClick={submit}
        >
          פרסם
        </button>
      </div>

      {loading ? (
        <div className="text-xs opacity-70">טוען תגובות…</div>
      ) : items.length ? (
        <div className="space-y-2">
          {items.map((c) => (
            <div
              key={c._id}
              className="rounded-xl border px-3 py-2 bg-white/70 dark:bg-neutral-900/50 backdrop-blur"
            >
              <div className="text-xs opacity-70">
                <span className="font-medium">{c.userName}</span> •{" "}
                {new Date(c.createdAt).toLocaleString()}
              </div>
              <div className="text-sm mt-1 whitespace-pre-wrap">{c.body}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs opacity-60">אין תגובות עדיין.</div>
      )}
    </div>
  );
}
