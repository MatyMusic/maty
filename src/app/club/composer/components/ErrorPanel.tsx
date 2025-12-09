"use client";
import * as React from "react";
import { AlertCircle, X } from "lucide-react";

export function ErrorPanel({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2 flex items-start gap-2"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-4 w-4 mt-0.5" />
      <div className="flex-1">{message}</div>
      <button
        type="button"
        onClick={onClose}
        title="סגור"
        className="opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
