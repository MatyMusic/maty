// src/components/fit/FitMap.tsx
"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { LatLngBoundsExpression } from "leaflet";
import { setupLeafletDefaultIcon } from "@/components/fit/leaflet-default-icon";

// dynamic imports – מונע SSR על קוד שמצריך window
const MapContainer = dynamic(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false },
);
const TileLayer = dynamic(
  async () => (await import("react-leaflet")).TileLayer,
  { ssr: false },
);
const Marker = dynamic(async () => (await import("react-leaflet")).Marker, {
  ssr: false,
});
const Popup = dynamic(async () => (await import("react-leaflet")).Popup, {
  ssr: false,
});
const Circle = dynamic(async () => (await import("react-leaflet")).Circle, {
  ssr: false,
});
const useMap = dynamic(async () => (await import("react-leaflet")).useMap, {
  ssr: false,
});
const ScaleControl = dynamic(
  async () => (await import("react-leaflet")).ScaleControl,
  { ssr: false },
);

export type FitPartnerMarker = {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  gym: string | null;
  city?: string | null;
  sports: string[];
  level: "beginner" | "intermediate" | "advanced" | null;
  // לא תמיד יש לנו קואורדינטות של הפרטנר—אנחנו מציגים רק לפי המידע המוחזר (רדיוס מהמרכז)
  // לכן המפה מציגה את המשתמש (המרכז) + הסמנים הכלליים ע״פ הנתונים (אם בעתיד תוסיף לכל פרופיל loc, נרחיב לפה).
  distKm: number | null;
};

type Props = {
  /** מרכז החיפוש (מיקום המשתמש) */
  center: { lat: number; lng: number } | null;
  /** שותפים שחזרו מה־API */
  items: FitPartnerMarker[];
  /** רדיוס חיפוש בק״מ להצגת עיגול */
  radiusKm: number;
  /** מופעל כשהמשתמש מבקש איתור מחדש */
  onRelocate?: () => void;
  /** קישור שמטרתו להרחיב חיפוש (למשל פתיחת דף/שינוי פילטרים) */
  onExpandRadius?: () => void;
};

function FitBounds({
  center,
  items,
}: {
  center: { lat: number; lng: number } | null;
  items: FitPartnerMarker[];
}) {
  const map = (
    useMap as unknown as () => ReturnType<typeof import("react-leaflet").useMap>
  )();
  React.useEffect(() => {
    if (!map) return;
    if (!center) return;

    // אם אין פריטים – זום נוח על מרכז
    if (!items.length) {
      map.setView([center.lat, center.lng], 12);
      return;
    }

    // נבנה bounds סביב המרכז + מעטפת שרירותית בהתאם למרחק המקסימלי שנראה
    const maxDist = Math.max(...items.map((i) => i.distKm ?? 0), 1);
    const km = Math.min(Math.max(maxDist, 2), 200);

    // bounding box גסה סביב המרכז (דרום/צפון/מזרח/מערב). כל 0.01≈1.1ק״מ בקו רוחב ~32
    const delta = km / 90; // קירוב טוב: 1° ≈ 111 ק״מ
    const bounds: LatLngBoundsExpression = [
      [center.lat - delta, center.lng - delta],
      [center.lat + delta, center.lng + delta],
    ];
    map.fitBounds(bounds, { padding: [36, 36] });
  }, [map, center, items]);

  return null;
}

function openMaps(lat: number, lng: number) {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  if (isIOS) {
    window.open(`http://maps.apple.com/?ll=${lat},${lng}`, "_blank");
  } else {
    window.open(`https://maps.google.com/?q=${lat},${lng}`, "_blank");
  }
}

function openWaze(lat: number, lng: number) {
  window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, "_blank");
}

export default function FitMap({
  center,
  items,
  radiusKm,
  onRelocate,
  onExpandRadius,
}: Props) {
  React.useEffect(() => {
    setupLeafletDefaultIcon();
  }, []);

  // כאשר אין לנו center עדיין – שומרים גובה/מסגרת קבועה
  const defaultCenter = center ?? { lat: 31.778, lng: 35.235 }; // ירושלים כברירת מחדל
  const canNavigate = !!center;

  return (
    <div className="rounded-2xl border overflow-hidden">
      <div className="h-[340px] w-full">
        <MapContainer
          center={[defaultCenter.lat, defaultCenter.lng]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            // OpenStreetMap – חופשי לשימוש, כולל ייחוס
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
          />

          {/* התאמת תצוגה אוטומטית */}
          <FitBounds center={center} items={items} />

          {/* מרקר מיקום המשתמש */}
          {center && (
            <>
              <Marker position={[center.lat, center.lng]}>
                <Popup>
                  <div dir="rtl" className="text-right">
                    <div className="font-semibold mb-1">את/ה כאן</div>
                    <div className="flex gap-2 mt-2">
                      <button
                        className="rounded-full border px-2 py-1 text-sm"
                        onClick={() => openMaps(center.lat, center.lng)}
                      >
                        פתח ב-Maps
                      </button>
                      <button
                        className="rounded-full border px-2 py-1 text-sm"
                        onClick={() => openWaze(center.lat, center.lng)}
                      >
                        פתח ב-Waze
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* עיגול רדיוס */}
              <Circle
                center={[center.lat, center.lng]}
                radius={radiusKm * 1000}
                pathOptions={{ color: "#f59e0b", opacity: 0.35 }}
              />
            </>
          )}

          {/* סקייל */}
          <ScaleControl imperial={false} />

          {/* פופאפים לפרטנרים (מבוסס רשימה—אם בעתיד תחשוף loc לפרטנר, נציג אותם גאוגרפית) */}
          {!center && items.length > 0 && (
            <Marker position={[defaultCenter.lat, defaultCenter.lng]}>
              <Popup>
                מציגים תוצאות סביב ברירת המחדל. אפשר ללחוץ “אתר מיקום” כדי
                לדייק.
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* סרגל פעולות קטן מתחת למפה */}
      <div className="flex flex-wrap items-center gap-2 p-2">
        <button
          type="button"
          onClick={onRelocate}
          className="rounded-full border px-3 h-9 text-sm hover:bg-muted"
        >
          אתר מיקום
        </button>
        {onExpandRadius && (
          <button
            type="button"
            onClick={onExpandRadius}
            className="rounded-full border px-3 h-9 text-sm hover:bg-muted"
          >
            הגדל רדיוס
          </button>
        )}
        <div className="ml-auto text-xs opacity-70">
          {center
            ? `מרחק חיפוש: ~${radiusKm} ק״מ • תוצאות: ${items.length}`
            : `ממתין למיקום…`}
        </div>
      </div>
    </div>
  );
}
