// src/components/matydate/ReportUserButton.tsx
"use client";

import { useToast } from "@/contexts/toast";
import * as React from "react";

type Props = {
  userId: string;
  userName?: string;
};

export default function ReportUserButton({ userId, userName }: Props) {
  const { push } = useToast();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<
    "spam" | "abuse" | "fake" | "security" | "other"
  >("other");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (!userId) return;
    if (!message.trim()) {
      push("info", "כתוב כמה מילים למה אתה מדווח");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reportedUserId: userId,
          reportedUserName: userName,
          reason,
          message,
          contextType: "profile",
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || "report_failed");
      }
      push("success", "התלונה נשלחה לצוות MATY-DATE. תודה 🙏");
      setOpen(false);
      setMessage("");
      setReason("other");
    } catch (e: any) {
      push("error", e?.message || "שליחת תלונה נכשלה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-rose-300/70 bg-rose-50/90 px-3 py-1 text-xs font-medium text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-100 dark:hover:bg-rose-900"
      >
        🚩 דווח / תלונה
      </button>

      {open && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50">
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-950 p-4 shadow-2xl"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">
                דיווח על פרופיל {userName ? `· ${userName}` : ""}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block mb-1 font-medium">סיבה</label>
                <select
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5 text-xs"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                >
                  <option value="spam">ספאם / פרסום</option>
                  <option value="abuse">הטרדה / פגיעה</option>
                  <option value="fake">פרופיל מזויף</option>
                  <option value="security">אבטחה / רמאות</option>
                  <option value="other">אחר</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  מה קרה? (רק הצוות רואה את זה)
                </label>
                <textarea
                  className="w-full min-h-[80px] rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5 text-xs resize-vertical"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="תאר בקצרה מה הבעיה, צ׳אט בעייתי, תמונות, התנהגות…"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
              <span className="opacity-60">
                הדיווח יגיע רק לצוות MATY-DATE. הפרופיל לא יקבל על זה הודעה
                ישירה.
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={submit}
                className="rounded-xl bg-rose-500 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-400 disabled:opacity-60"
              >
                {busy ? "שולח…" : "שלח דיווח"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
