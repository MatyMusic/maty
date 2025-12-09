"use client";
import * as React from "react";

export default function PresenceBadge({
  className = "",
}: {
  className?: string;
}) {
  const [count, setCount] = React.useState<number | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  // Heartbeat + קריאה למספר אונליין
  React.useEffect(() => {
    let stop = false;

    async function ping() {
      try {
        await fetch("/api/presence/ping", {
          method: "POST",
          cache: "no-store",
        });
      } catch {}
    }
    async function read() {
      try {
        const r = await fetch("/api/presence/count", { cache: "no-store" });
        const j = await r.json();
        if (!stop) setCount(j?.online ?? 0);
      } catch (e: any) {
        if (!stop) setErr("—");
      }
    }

    ping();
    read();
    const h1 = setInterval(ping, 30_000);
    const h2 = setInterval(read, 20_000);
    return () => {
      stop = true;
      clearInterval(h1);
      clearInterval(h2);
    };
  }, []);

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
        "bg-white/70 dark:bg-neutral-900/70 backdrop-blur",
        "border-emerald-300/60 dark:border-emerald-500/40",
        className,
      ].join(" ")}
      title="משתמשים פעילים כעת (דקה אחרונה)"
    >
      <span className="relative inline-flex">
        <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-500/60 opacity-75 animate-ping" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
      </span>
      <b className="font-semibold">{count ?? err ?? "…"}</b>
      <span>אונליין</span>
    </span>
  );
}
