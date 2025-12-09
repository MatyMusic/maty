"use client";
import * as React from "react";
import { useToast } from "@/components/ui/Toast";

export function ReportBlock({
  targetUser,
  postId,
}: {
  targetUser: string;
  postId?: string;
}) {
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  async function report() {
    if (!reason.trim()) return toast("כתוב סיבה קצרה");
    const r = await fetch("/api/club/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUser, postId, reason }),
    });
    if (r.ok) {
      toast("דיווח נשלח. תודה 🙏");
      setOpen(false);
      setReason("");
    } else toast("שגיאה בשליחה");
  }

  async function block() {
    const r = await fetch("/api/club/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: targetUser }),
    });
    toast(r.ok ? "המשתמש נחסם" : "שגיאה בחסימה");
  }

  return (
    <div className="flex gap-2">
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen((v) => !v)}
      >
        דיווח/חסימה
      </button>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-[1200]"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-4 top-4 w-[min(92vw,420px)] rounded-2xl bg-white dark:bg-neutral-900 p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-bold mb-2">דיווח על משתמש</div>
            <textarea
              className="w-full rounded-lg border p-2 text-sm"
              rows={3}
              placeholder="ספר/י מה קרה"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex justify-between mt-3">
              <button className="btn btn-outline btn-sm" onClick={block}>
                חסום
              </button>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setOpen(false)}
                >
                  בטל
                </button>
                <button className="btn btn-primary btn-sm" onClick={report}>
                  שליחת דיווח
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
