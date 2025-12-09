// src/components/club/CommentForm.tsx
"use client";
import * as React from "react";
import { commentCreate } from "@/lib/club/api";

export default function CommentForm({ postId }: { postId: string }) {
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      await commentCreate(postId, text.trim());
      setText("");
      // TODO: רענון רשימת תגובות או invalidate
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg === "unauthorized" || msg.includes("401")) {
        const { signIn }: any = await import("next-auth/react");
        signIn?.();
      } else {
        setErr("אירעה שגיאה בשליחת התגובה.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} dir="rtl" className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="כתוב תגובה…"
        className="input input-bordered flex-1"
        disabled={loading}
      />
      <button className="btn btn-primary" disabled={loading || !text.trim()}>
        שלח
      </button>
      {err ? <span className="text-sm text-red-500">{err}</span> : null}
    </form>
  );
}
