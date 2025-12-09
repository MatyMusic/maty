// src/lib/liveStore.ts
import type { NextRequest } from "next/server";

type UID = string;

export type GeoPing = {
  uid: UID;
  lat: number;
  lon: number;
  name?: string | null;
  ts: number; // ms epoch
};

type LiveStore = {
  presence: Map<UID, number>; // lastSeen ms
  geo: Map<UID, GeoPing>;
  sseClients: Set<(data: any) => void>;
  cleanupTimer?: NodeJS.Timeout;
};

declare global {
  // eslint-disable-next-line no-var
  var __liveStore: LiveStore | undefined;
}

const PRESENCE_TTL_MS = 45_000; // כמה זמן נחשב "מחובר"
const GEO_TTL_MS = 5 * 60_000; // מיקום תקף 5 דקות

function getStore(): LiveStore {
  if (!global.__liveStore) {
    global.__liveStore = {
      presence: new Map(),
      geo: new Map(),
      sseClients: new Set(),
    };
    // ניקוי תקופתי
    global.__liveStore.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [uid, ts] of global.__liveStore!.presence) {
        if (now - ts > PRESENCE_TTL_MS)
          global.__liveStore!.presence.delete(uid);
      }
      for (const [uid, ping] of global.__liveStore!.geo) {
        if (now - ping.ts > GEO_TTL_MS) global.__liveStore!.geo.delete(uid);
      }
      broadcast({ type: "tick", online: getOnlineCount() });
    }, 10_000);
  }
  return global.__liveStore;
}

export function touchPresence(uid: UID) {
  const s = getStore();
  s.presence.set(uid, Date.now());
  broadcast({ type: "presence", online: getOnlineCount() });
}

export function getOnlineCount(): number {
  const s = getStore();
  const now = Date.now();
  let n = 0;
  for (const ts of s.presence.values()) if (now - ts <= PRESENCE_TTL_MS) n++;
  return n;
}

export function setGeo(ping: Omit<GeoPing, "ts">) {
  const s = getStore();
  s.geo.set(ping.uid, { ...ping, ts: Date.now() });
}

export function getNearby(lat: number, lon: number, radiusKm = 20) {
  const s = getStore();
  const now = Date.now();
  const items: Array<{
    uid: UID;
    km: number;
    lat: number;
    lon: number;
    name?: string | null;
  }> = [];
  for (const g of s.geo.values()) {
    if (now - g.ts > GEO_TTL_MS) continue;
    const km = haversine(lat, lon, g.lat, g.lon);
    if (km <= radiusKm) {
      items.push({
        uid: g.uid,
        km: Math.round(km * 10) / 10,
        // עיגול קל לפרטיות
        lat: round(g.lat, 3),
        lon: round(g.lon, 3),
        name: g.name || null,
      });
    }
  }
  // קרובים תחילה
  items.sort((a, b) => a.km - b.km);
  return items;
}

export function addSseClient(push: (data: any) => void) {
  const s = getStore();
  s.sseClients.add(push);
  // שיגור ראשוני
  push({ type: "hello", online: getOnlineCount() });
  return () => {
    s.sseClients.delete(push);
  };
}

function broadcast(payload: any) {
  const s = getStore();
  for (const push of s.sseClients) {
    try {
      push(payload);
    } catch {
      // ננקה במנגנון ההסרה בהזדמנות
    }
  }
}

function round(n: number, d = 3) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

function toRad(x: number) {
  return (x * Math.PI) / 180;
}
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
