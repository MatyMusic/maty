// src/components/live/NearbyPeople.tsx
"use client";

import * as React from "react";
import { MapPin, Radar, Shield } from "lucide-react";

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

type NearbyItem = {
  uid: string;
  km: number;
  lat: number;
  lon: number;
  name?: string | null;
};

export default function NearbyPeople({
  defaultRadiusKm = 10,
}: {
  defaultRadiusKm?: number;
}) {
  const [radius, setRadius] = React.useState(defaultRadiusKm);
  const [coords, setCoords] = React.useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [nearby, setNearby] = React.useState<NearbyItem[]>([]);
  const [online, setOnline] = React.useState<number | null>(null);
  const [enabled, setEnabled] = React.useState(false);
  const uidRef = React.useRef<string>("");

  // enable & get location
  const request = async () => {
    if (!navigator.geolocation) {
      alert("הדפדפן לא תומך במיקום");
      return;
    }
    uidRef.current = ensureUid();
    setEnabled(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoords({ lat, lon });
        await fetch("/api/geo/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: uidRef.current, lat, lon }),
        });
        refresh(lat, lon, radius);
      },
      () => {
        setEnabled(false);
        alert("לא ניתן להשיג מיקום");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  async function refresh(lat: number, lon: number, r: number) {
    const u = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      radiusKm: String(r),
    });
    const j = await fetch("/api/geo/nearby?" + u.toString(), {
      cache: "no-store",
    }).then((r) => r.json());
    if (j?.ok) {
      setNearby(j.nearby);
      setOnline(j.online);
    }
  }

  // רענון כל 30 שניות (אם הופעל)
  React.useEffect(() => {
    if (!coords) return;
    let stop = false;
    const loop = async () => {
      await refresh(coords.lat, coords.lon, radius).catch(() => {});
      if (!stop) setTimeout(loop, 30_000);
    };
    loop();
    return () => {
      stop = true;
    };
  }, [coords, radius]);

  return (
    <section className="rounded-2xl border p-3 bg-white/70 dark:bg-neutral-950/70">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold text-sm flex items-center gap-2">
          <Radar className="w-4 h-4" />
          מי סביבי
        </div>
        <div className="text-xs opacity-70">
          {online != null ? `מחוברים כעת: ${online}` : null}
        </div>
      </div>

      {!enabled ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="text-xs opacity-70">
            נשתמש במיקום מקורב כדי להראות משתמשים בקרבתך.
          </div>
          <button
            className="rounded-xl border px-3 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
            onClick={request}
          >
            אפשר מיקום
          </button>
        </div>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-2 justify-between">
            <label className="text-right text-xs">
              רדיוס (ק״מ): {radius}
              <input
                type="range"
                min={1}
                max={100}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-40 ml-2 align-middle"
              />
            </label>
            <div className="text-xs opacity-60 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              נשמר רק אנונימי + עיגול מיקום
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {nearby.length === 0 ? (
              <div className="text-xs opacity-70">
                אין משתמשים קרובים ברדיוס שבחרת.
              </div>
            ) : (
              nearby.slice(0, 30).map((n) => (
                <div
                  key={n.uid}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 opacity-70" />
                    <div className="text-sm">
                      בסביבה · ~{n.km} ק״מ
                      {n.name ? (
                        <span className="opacity-70"> · {n.name}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-xs opacity-60 ltr">
                    ({n.lat.toFixed(3)}, {n.lon.toFixed(3)})
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
