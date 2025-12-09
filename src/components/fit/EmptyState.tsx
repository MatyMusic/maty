// src/components/fit/EmptyState.tsx
"use client";
import * as React from "react";

export default function EmptyState({
  text = "לא נמצאו תרגילים תואמים.",
}: {
  text?: string;
}) {
  return (
    <div className="text-center py-16 opacity-70">
      <div className="text-5xl mb-2">🧘‍♀️</div>
      <p>{text}</p>
    </div>
  );
}
