"use client";
import * as React from "react";
import { Music2, Clapperboard } from "lucide-react";

type Mode = "post" | "short";

export function ModeToggle({
  mode,
  onMode,
}: {
  mode: Mode;
  onMode: (m: Mode) => void;
}) {
  return (
    <div className="inline-flex gap-2">
      <button
        type="button"
        className={`mm-chip mm-pressable ${
          mode === "post" ? "ring-2 ring-brand" : ""
        }`}
        onClick={() => onMode("post")}
        aria-pressed={mode === "post"}
      >
        <Music2 className="h-4 w-4 ml-1" />
        פוסט רגיל (אודיו)
      </button>
      <button
        type="button"
        className={`mm-chip mm-pressable ${
          mode === "short" ? "ring-2 ring-brand" : ""
        }`}
        onClick={() => onMode("short")}
        aria-pressed={mode === "short"}
      >
        <Clapperboard className="h-4 w-4 ml-1" />
        Short (וידאו)
      </button>
    </div>
  );
}
