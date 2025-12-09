"use client";
import * as React from "react";

export function StatusText({
  status,
  idle = "—",
  bad = "נדרש קישור תקין",
  ok = "✓ תקין",
}: {
  status: "idle" | "bad" | "ok";
  idle?: string;
  bad?: string;
  ok?: string;
}) {
  const map = {
    idle: { text: idle, cls: "text-slate-500" },
    bad: { text: bad, cls: "text-red-600" },
    ok: { text: ok, cls: "text-emerald-600" },
  } as const;
  return (
    <div className={`text-xs mt-1 ${map[status].cls}`}>{map[status].text}</div>
  );
}
