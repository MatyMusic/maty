"use client";
import { useEffect } from "react";

export function useKeyboardShortcuts({
  disabled,
  onSubmit,
  onEsc,
}: {
  disabled?: boolean;
  onSubmit: () => void;
  onEsc: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (disabled) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") {
        e.preventDefault();
        onSubmit();
      }
      if (e.key === "Escape") onEsc();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, onSubmit, onEsc]);
}
