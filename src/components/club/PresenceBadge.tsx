// src/components/club/PresenceBadge.tsx
"use client";
import * as React from "react";

export default function PresenceBadge() {
  const [online, setOnline] = React.useState<number | null>(null);

  const ping = React.useCallback(async () => {
    try {
      const res = await fetch("/api/club/presence", { method: "POST" });
      const j = await res.json();
      if (j?.ok) setOnline(j.online || 0);
    } catch {}
  }, []);

  React.useEffect(() => {
    ping();
    const id = setInterval(ping, 60000);
    return () => clearInterval(id);
  }, [ping]);

  if (online === null) return null;
  return (
    <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border">
      <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
      אונליין: {online}
    </span>
  );
}
