"use client";
import * as React from "react";

export function DragOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-20 grid place-items-center rounded-2xl bg-brand/10 backdrop-blur-sm border-2 border-dashed border-brand text-brand">
      שחרר/י כאן קבצי וידאו/אודיו/תמונה
    </div>
  );
}
