// src/components/maty-date/MatchesMap.tsx
"use client";

import * as React from "react";
import dynamic from "next/dynamic";

type MapItem = {
  userId: string;
  displayName?: string | null;
  city?: string | null;
  country?: string | null;
  distanceKm?: number | null;
  // נקבל loc בצד הקליינט דרך extra field שהחזרת ב-API (אם החזרת)
  loc?: { type: "Point"; coordinates: [number, number] } | null;
  avatarUrl?: string | null;
  photos?: string[];
  score?: number;
};

const MapLibre = dynamic(() => import("maplibre-gl"), { ssr: false });

export default function MatchesMap({
  items,
  center,
}: {
  items: MapItem[];
  center?: { lat: number; lng: number };
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<any>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const maplibregl = (await MapLibre) as any;
      if (!ref.current || cancelled) return;

      const map = new maplibregl.Map({
        container: ref.current,
        style: "https://demotiles.maplibre.org/style.json",
        center: center ? [center.lng, center.lat] : [35.2137, 31.7683], // ירושלים כברירת מחדל
        zoom: center ? 10 : 5,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl());

      map.on("load", () => {
        // שכבת נקודות פשוטה
        const feats = items
          .filter((it) => it.loc?.coordinates?.length === 2)
          .map((it) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: it.loc!.coordinates },
            properties: {
              userId: it.userId,
              name: it.displayName || "",
              city: it.city || "",
              country: it.country || "",
              score: it.score || 0,
            },
          }));

        map.addSource("matches", {
          type: "geojson",
          data: { type: "FeatureCollection", features: feats },
        });
        map.addLayer({
          id: "matches-circles",
          source: "matches",
          type: "circle",
          paint: {
            "circle-radius": 6,
            "circle-color": "#7c3aed",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
          },
        });

        map.on("click", "matches-circles", (e: any) => {
          const f = e.features?.[0];
          if (!f) return;
          const { name, city, country, userId, score } = f.properties || {};
          const [lng, lat] = f.geometry.coordinates;
          new maplibregl.Popup({ closeButton: true })
            .setLngLat([lng, lat])
            .setHTML(
              `<div dir="rtl" style="min-width:200px">
                <div style="font-weight:800">${name || "—"}</div>
                <div style="opacity:.75;font-size:12px">${[city, country]
                  .filter(Boolean)
                  .join(", ")}</div>
                <div style="margin-top:6px;font-size:12px">ציון: <b>${Math.round(
                  score || 0
                )}</b></div>
                <div style="margin-top:8px">
                  <a href="/date/u/${userId}" style="color:#000;text-decoration:underline">צפה בכרטיס</a>
                </div>
              </div>`
            )
            .addTo(map);
        });
      });
    })();
    return () => {
      cancelled = true;
      try {
        mapRef.current?.remove();
      } catch {}
      mapRef.current = null;
    };
  }, [items, center]);

  return (
    <div
      ref={ref}
      className="w-full h-[420px] rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden"
    />
  );
}
