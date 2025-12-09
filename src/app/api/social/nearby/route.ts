import { NextRequest, NextResponse } from "next/server";
import type { NearbySuggestion, UserLite } from "@/types/social";

// TODO: החלף למקור שלך (DB). כאן דמו קשיח + פילטר לפי lat/lng שנשלח בשאילתה.
const DEMO_USERS: UserLite[] = [
  {
    id: "u1",
    name: "יודי",
    city: "ירושלים",
    lat: 31.78,
    lng: 35.22,
    sports: ["ריצה"],
    avatar: "https://avatars.githubusercontent.com/u/1?v=4",
    bio: "רץ בבקרים בגן סאקר",
  },
  {
    id: "u2",
    name: "רבקה",
    city: "ת״א",
    lat: 32.09,
    lng: 34.8,
    sports: ["HIIT"],
    avatar: "https://avatars.githubusercontent.com/u/2?v=4",
    bio: "אימוני HIIT בפארק הירקון",
  },
  {
    id: "u3",
    name: "אבי",
    city: "ראשל״צ",
    lat: 31.97,
    lng: 34.8,
    sports: ["אופניים"],
    avatar: "https://avatars.githubusercontent.com/u/3?v=4",
    bio: "מסלולי רכיבה קלים",
  },
];

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat") || "");
  const lng = Number(searchParams.get("lng") || "");
  const q = (searchParams.get("q") || "").toLowerCase();
  const maxKm = Number(searchParams.get("maxKm") || 30);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ ok: true, items: [] });
  }

  const here = { lat, lng };
  let items: NearbySuggestion[] = DEMO_USERS.map((u) => {
    const d = haversineKm(here, { lat: u.lat!, lng: u.lng! });
    const place =
      u.city === "ת״א"
        ? "פארק הירקון"
        : u.city === "ירושלים"
          ? "גן סאקר"
          : undefined;
    return { user: u, distanceKm: Math.round(d * 10) / 10, placeHint: place };
  }).filter((s) => s.distanceKm <= maxKm);

  if (q) {
    items = items.filter(
      (s) =>
        (s.user.name || "").toLowerCase().includes(q) ||
        (s.user.sports || []).join(",").toLowerCase().includes(q),
    );
  }

  // דמו: תמיין לפי קרבה
  items.sort((a, b) => a.distanceKm - b.distanceKm);
  return NextResponse.json({ ok: true, items });
}
