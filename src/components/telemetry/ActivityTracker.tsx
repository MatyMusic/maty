"use client";
import * as React from "react";

export default function ActivityTracker() {
  React.useEffect(() => {
    // Pageview
    fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: location.pathname,
        ref: document.referrer || null,
      }),
    }).catch(() => {});

    // Presence heartbeat (15s)
    const presIv = setInterval(() => {
      fetch("/api/club/presence", { method: "POST" }).catch(() => {});
    }, 15000);

    // Geo heartbeat (בהסכמת המשתמש)
    let geoIv: any;
    if (navigator.geolocation) {
      const geoOnce = () =>
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            fetch("/api/geo/heartbeat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lat, lng }),
            }).catch(() => {});
          },
          () => {},
          { enableHighAccuracy: false, maximumAge: 60_000 },
        );
      geoOnce();
      geoIv = setInterval(geoOnce, 60_000 * 5);
    }

    return () => {
      clearInterval(presIv);
      if (geoIv) clearInterval(geoIv);
    };
  }, []);

  return null;
}
