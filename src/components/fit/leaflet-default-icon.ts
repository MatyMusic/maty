// src/components/fit/leaflet-default-icon.ts
// דואג שהאייקונים של Leaflet יעבדו בנקסט (לולא זה, לא רואים סיכות)
import L from "leaflet";

// שימוש באייקונים מהחבילה (Vite/Next יודעים לפתור import של תמונות)
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

export function setupLeafletDefaultIcon() {
  // הגדרה חד־פעמית
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (L.Icon.Default as any).mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
  });
}
