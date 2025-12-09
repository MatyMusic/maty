"use client";
import * as React from "react";

export default function PaywallModal({
  feature,
  onClose,
}: {
  feature: "chat" | "video";
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm grid place-items-center">
      <div className="w-[min(96vw,560px)] rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-5 text-right animate-[fadeIn_.15s_ease-out]">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">נדרש שדרוג</div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            ✕
          </button>
        </div>
        <p className="mt-2 opacity-80 text-sm leading-6">
          {feature === "chat"
            ? "כדי לפתוח צ׳אט צריך מסלול PRO או VIP."
            : "כדי לפתוח שיחת וידאו צריך מסלול PRO או VIP."}
        </p>
        <div className="mt-4 flex gap-2 justify-end">
          <a
            href={`/date/upgrade?src=gate&feature=${feature}`}
            className="h-10 px-5 rounded-full bg-rose-600 text-white inline-flex items-center justify-center"
          >
            לשדרוג המסלול
          </a>
          <button onClick={onClose} className="h-10 px-5 rounded-full border">
            לא עכשיו
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
