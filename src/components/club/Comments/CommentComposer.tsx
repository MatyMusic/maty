// src/components/club/Comments/CommentComposer.tsx
"use client";
import * as React from "react";

type Props = {
  postId: string;
  parentId?: string | null;
  onSubmitted?: (ok: boolean, item?: any) => void;
};

export default function CommentComposer({
  postId,
  parentId = null,
  onSubmitted,
}: Props) {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    const body = { postId, text: text.trim(), parentId };
    if (!body.text) return;
    setBusy(true);
    try {
      const res = await fetch("/api/club/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (j?.ok) {
        setText("");
        onSubmitted?.(true, j.item);
      } else {
        onSubmitted?.(false);
      }
    } catch {
      onSubmitted?.(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full border rounded-2xl p-3 bg-background">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="כתוב תגובה..."
        dir="rtl"
        className="w-full min-h-[72px] resize-y rounded-xl p-3 outline-none bg-background border"
      />
      <div className="flex items-center justify-between mt-2 gap-3">
        <span className="text-xs opacity-70">{text.length}/500</span>
        <button
          onClick={submit}
          disabled={busy || !text.trim() || text.length > 500}
          className="px-4 py-2 rounded-xl border hover:shadow disabled:opacity-50"
        >
          פרסם
        </button>
      </div>
    </div>
  );
}
