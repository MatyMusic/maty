"use client";
import * as React from "react";

type Mode = "post" | "short";

export function ActionsBar({
  loading,
  mode,
  isValid,
  onSubmit,
}: {
  loading: boolean;
  mode: Mode;
  isValid: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <button
        className="mm-btn mm-btn-primary mm-pressable order-2 sm:order-1"
        disabled={loading || !isValid}
        title="Ctrl/Cmd+Enter = שליחה"
        onClick={onSubmit}
      >
        {loading ? "שומר…" : mode === "short" ? "שמור Short" : "שמור פוסט"}
      </button>

      <div className="flex-1 order-1 sm:order-2" />

      <div className="text-[11px] opacity-60 order-3 text-right">
        • שמור בשם טיוטה אוטומטית • רספונסיבי מלא • גישה מקלדתית
      </div>
    </div>
  );
}
