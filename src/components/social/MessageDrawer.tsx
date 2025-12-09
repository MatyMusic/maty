"use client";
import * as React from "react";
import { X, Send } from "lucide-react";

export default function MessageDrawer({
  toUserId,
  toName,
  open,
  onClose,
}: {
  toUserId: string;
  toName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [text, setText] = React.useState("");

  async function send() {
    if (!text.trim()) return;
    const res = await fetch("/api/social/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId, text }),
    });
    const j = await res.json();
    if (j.ok) {
      setText("");
      window.dispatchEvent(
        new CustomEvent("mm:toast", {
          detail: { type: "success", text: "נשלח!" },
        }),
      );
      onClose();
    } else {
      window.dispatchEvent(
        new CustomEvent("mm:toast", {
          detail: { type: "error", text: j.error || "שגיאה בשליחה" },
        }),
      );
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-4"
      aria-modal
      role="dialog"
    >
      <div className="w-full max-w-md rounded-2xl border bg-white p-4 shadow-xl dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="font-semibold">הודעה אל {toName}</div>
          <button
            className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10"
            onClick={onClose}
            aria-label="סגור"
          >
            <X size={16} />
          </button>
        </div>
        <textarea
          rows={4}
          className="mt-3 w-full rounded-xl border bg-transparent p-2"
          placeholder="כתוב/כתבי הודעה נעימה…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={send}
            className="inline-flex items-center gap-1 rounded-xl border bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
          >
            <Send size={14} /> שלח
          </button>
        </div>
      </div>
    </div>
  );
}
