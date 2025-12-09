// src/components/live/PresenceBadge.tsx
"use client";

import * as React from "react";
import { Users2 } from "lucide-react";

function ensureUid(): string {
  if (typeof window === "undefined") return "anon";
  const key = "mm_uid";
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem(key, uid);
  }
  return uid;
}

export default function PresenceBadge({
  className = "",
}: {
  className?: string;
}) {
  const [online, setOnline] = React.useState<number>(0);
  const uidRef = React.useRef<string>("");

  // Heartbeat כל ~25 שניות
  React.useEffect(() => {
    uidRef.current = ensureUid();

    let stop = false;
    async function beat() {
      try {
        await fetch("/api/presence/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: uidRef.current }),
          cache: "no-store",
        })
          .then((r) => r.json())
          .then((j) => {
            if (j?.online != null) setOnline(j.online);
          })
          .catch(() => {});
      } finally {
        if (!stop) setTimeout(beat, 25_000);
      }
    }
    beat();
    return () => {
      stop = true;
    };
  }, []);

  // SSE לעדכוני “און ליין”
  React.useEffect(() => {
    const es = new EventSource("/api/presence/stream");
    es.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data);
        if (d?.online != null) setOnline(d.online);
      } catch {}
    };
    es.onerror = () => {
      es.close();
      // יתחבר שוב אוטומטית בלבבות
    };
    return () => es.close();
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-white/70 dark:bg-neutral-950/70 ${className}`}
      title="כמה משתמשים מחוברים כרגע"
    >
      <Users2 className="w-4 h-4" />
      <span>מחוברים עכשיו: {online}</span>
    </div>
  );
}
