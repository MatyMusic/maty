"use client";
import * as React from "react";
import { MessageCircle } from "lucide-react";
import type { NearbySuggestion } from "@/types/social";

export default function NearbyRail() {
  const [items, setItems] = React.useState<NearbySuggestion[]>([]);

  React.useEffect(() => {
    const lat = 0,
      lng = 0;
    const use = async (la: number, ln: number) => {
      const u = new URL("/api/social/nearby", window.location.origin);
      u.searchParams.set("lat", String(la));
      u.searchParams.set("lng", String(ln));
      u.searchParams.set("maxKm", "50");
      const res = await fetch(u.toString(), { cache: "no-store" });
      const j = await res.json();
      setItems(j.items || []);
    };
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => use(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { timeout: 2500 },
      );
    }
    // fallback: אם כבר יש לך heartbeat ל-/api/online עם lat/lng—שלוף ממנו ל-rail הזה
  }, []);

  if (!items.length) return null;

  return (
    <div className="rounded-2xl border bg-white/70 p-3 backdrop-blur dark:bg-white/10">
      <div className="mb-2 text-sm font-semibold">קרובים עכשיו</div>
      <div className="flex gap-3 overflow-auto pb-1">
        {items.map((s) => (
          <div
            key={s.user.id}
            className="min-w-[200px] rounded-xl border p-3 bg-white/80 dark:bg-zinc-900/60"
          >
            <div className="flex items-center gap-2">
              <img
                src={s.user.avatar || "/icon.svg"}
                className="h-8 w-8 rounded-full border object-cover"
                alt={s.user.name}
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {s.user.name}
                </div>
                <div className="truncate text-[11px] opacity-70">
                  {(s.user.sports || []).join(" • ") || "ספורטאי/ת"}
                </div>
              </div>
            </div>
            <div className="mt-2 text-[11px] opacity-60">
              {s.placeHint || s.user.city || "באזור"} • {s.distanceKm} ק״מ
            </div>
            <div className="mt-2 flex gap-2">
              <a
                className="flex-1 rounded-lg border px-2 py-1 text-xs hover:bg-amber-50"
                href={`/social/${s.user.id}`}
              >
                פרופיל
              </a>
              <button
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:brightness-110"
                onClick={async () => {
                  await fetch("/api/social/message", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      toUserId: s.user.id,
                      text: "היי! מתאמנים יחד?",
                    }),
                  });
                  window.dispatchEvent(
                    new CustomEvent("mm:toast", {
                      detail: { type: "success", text: "הודעה נשלחה" },
                    }),
                  );
                }}
              >
                <MessageCircle size={12} /> הודעה
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
