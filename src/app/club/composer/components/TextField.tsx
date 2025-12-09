"use client";
import * as React from "react";

export function TextField({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
}) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <textarea
        className="mm-textarea input-rtl w-full"
        placeholder="כתוב משהו חמוד…"
        rows={3}
        maxLength={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-1 text-xs text-slate-500">
        {value.length}/{max}
      </div>
    </div>
  );
}
