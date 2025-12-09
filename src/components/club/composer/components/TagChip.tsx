"use client";
import * as React from "react";
import { X } from "lucide-react";

export function TagChip({
  text,
  onRemove,
}: {
  text: string;
  onRemove?: () => void;
}) {
  return (
    <span className="mm-badge bg-white/70 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 text-xs">
      <span className="truncate max-w-[14ch]">{text}</span>
      {onRemove && (
        <button
          type="button"
          className="ml-1 rounded-full w-4 h-4 grid place-items-center hover:bg-black/10 dark:hover:bg-white/10"
          onClick={onRemove}
          aria-label={`הסר תג ${text}`}
          title="הסר תג"
        >
          <X className="h-3 w-3 opacity-70" />
        </button>
      )}
    </span>
  );
}
