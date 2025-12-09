"use client";
import * as React from "react";
import { MapPin, MessageCircle } from "lucide-react";
import type { NearbySuggestion } from "@/types/social";

export default function NearbyWelcome() {
  const [shown, setShown] = React.useState(false);
  const [sug, setSug] = React.useState<NearbySuggestion | null>(null);

  React.useEffect(() => {
    if (shown) return;
    if (!("geolocation" in navigator)) return;
    const t = setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude: lat, longitude: lng } = pos.coords;
            const u = new URL("/api/social/nearby", window.location.origin);
            u.searchParams.set("lat", String(lat));
            u.searchParams.set("lng", String(lng));
            u.searchParams.set("maxKm", "35");
            const res = await fetch(u.toString(), { cache: "no-store" });
            const j = await res.json();
            const first = j?.items?.[0] as NearbySuggestion | undefined;
            if (first) {
              setSug(first);
              setShown(true);
              window.dispatchEvent(
                new CustomEvent("mm:toast", {
                  detail: {
                    type: "info",
                    text:
                      `מצאנו לידך: ${first.user.name}` +
                      (first.placeHint ? ` (${first.placeHint})` : "") +
                      ` • ${first.distanceKm} ק״מ`,
                    id: "nearby-suggestion",
                    duration: 6000,
                  },
                }),
              );
            }
          } catch {}
        },
        () => {}, // שקט אם המשתמש מסרב
        { enableHighAccuracy: false, timeout: 3000 },
      );
    }, 800);
    return () => clearTimeout(t);
  }, [shown]);

  if (!sug) return null;

  return (
    <div className="fixed bottom-4 end-4 z-50 max-w-xs rounded-2xl border bg-white/95 p-3 shadow-xl backdrop-blur dark:bg-zinc-900/95">
      <div className="flex items-center gap-2 text-sm">
        <img
          src={sug.user.avatar || "/icon.svg"}
          alt={sug.user.name}
          className="h-8 w-8 rounded-full border object-cover"
        />
        <div>
          <div className="font-semibold">{sug.user.name}</div>
          <div className="text-xs opacity-70">
            <MapPin className="inline me-1" size={12} />
            {sug.placeHint || sug.user.city || "באזור שלך"} • {sug.distanceKm}{" "}
            ק״מ
          </div>
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <a
          href={`/social/${encodeURIComponent(sug.user.id)}`}
          className="flex-1 rounded-xl border px-3 py-1.5 text-sm hover:bg-amber-50"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("mm:track", {
                detail: { event: "nearby_open_profile", id: sug.user.id },
              }),
            )
          }
        >
          לפרופיל
        </a>
        <button
          className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
          onClick={async () => {
            const txt = `היי ${sug.user.name}! בא לך אימון יחד?`;
            await fetch("/api/social/message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ toUserId: sug.user.id, text: txt }),
            });
            window.dispatchEvent(
              new CustomEvent("mm:toast", {
                detail: { type: "success", text: "הודעה נשלחה!" },
              }),
            );
          }}
          aria-label="שליחת הודעה"
        >
          <MessageCircle size={14} /> הודעה
        </button>
      </div>
    </div>
  );
}
