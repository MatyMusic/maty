// src/hooks/useLiveSession.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ───────── Types ───────── */

export type LiveSessionItem = {
  _id?: string;
  userId: string;
  userName: string;
  userImage?: string;
  isAdmin?: boolean;
  lat?: number;
  lon?: number;
  title?: string;
  note?: string;
  visibility?: string;
  active: boolean;
  camOn?: boolean;
  blocked?: boolean;
  createdAt?: string;
  lastPingAt?: string;
};

type StartPayload = {
  lat?: number;
  lon?: number;
  title?: string;
  note?: string;
  visibility?: string; // "nearby" | "global" | ...
};

type PingPayload = {
  lat?: number;
  lon?: number;
  camOn?: boolean;
  note?: string;
};

type StopPayload = {
  targetUserId?: string; // לאדמין/סופראדמין
};

type UseLiveSessionOptions = {
  /** האם להפעיל אוטומטית ping כשיש סשן פעיל */
  autoPing?: boolean;
  /** כל כמה זמן לעשות ping (מילישניות) */
  pingIntervalMs?: number;
};

type UseLiveSessionReturn = {
  mySession: LiveSessionItem | null;
  loading: boolean;
  error: string | null;
  isActive: boolean;
  lastPingAt: Date | null;

  startLive: (payload?: StartPayload) => Promise<void>;
  ping: (payload?: PingPayload) => Promise<void>;
  stopLive: (payload?: StopPayload) => Promise<void>;

  setLastKnownLocation: (lat: number, lon: number) => void;
  lastKnownLocation: { lat: number | null; lon: number | null };

  toggling: boolean;
  toggleLive: () => Promise<void>;
};

/* ───────── Hook ───────── */

export function useLiveSession(
  opts: UseLiveSessionOptions = {},
): UseLiveSessionReturn {
  const { autoPing = true, pingIntervalMs = 25_000 } = opts;

  const [mySession, setMySession] = useState<LiveSessionItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPingAt, setLastPingAt] = useState<Date | null>(null);

  const [lastKnownLocation, setLastKnownLocationState] = useState<{
    lat: number | null;
    lon: number | null;
  }>({ lat: null, lon: null });

  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isActive = !!mySession?.active && !mySession?.blocked;

  const setLastKnownLocation = useCallback((lat: number, lon: number) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    setLastKnownLocationState({ lat, lon });
  }, []);

  /* ───────── API helpers ───────── */

  const startLive = useCallback(
    async (payload?: StartPayload) => {
      setLoading(true);
      setError(null);
      try {
        const body: any = {
          visibility: payload?.visibility || "nearby",
        };

        if (payload?.title) body.title = payload.title;
        if (payload?.note) body.note = payload.note;

        const lat = payload?.lat ?? lastKnownLocation.lat ?? undefined;
        const lon = payload?.lon ?? lastKnownLocation.lon ?? undefined;

        if (typeof lat === "number" && Number.isFinite(lat)) body.lat = lat;
        if (typeof lon === "number" && Number.isFinite(lon)) body.lon = lon;

        const res = await fetch("/api/club/live/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `שגיאה ב-start (סטטוס ${res.status}) ${text ? " - " + text : ""}`,
          );
        }

        const data = (await res.json().catch(() => null)) as {
          ok: boolean;
          item?: LiveSessionItem;
        } | null;

        if (!data?.ok || !data.item) {
          throw new Error("התשובה מהשרת לא תקינה (start)");
        }

        setMySession(data.item);
        setLastPingAt(new Date());
      } catch (e: any) {
        console.error("[useLiveSession.startLive] error:", e);
        setError(e?.message || "שגיאה בהתחלת שידור חי");
      } finally {
        setLoading(false);
      }
    },
    [lastKnownLocation.lat, lastKnownLocation.lon],
  );

  const ping = useCallback(
    async (payload?: PingPayload) => {
      try {
        const body: any = {};

        const lat = payload?.lat ?? lastKnownLocation.lat ?? undefined;
        const lon = payload?.lon ?? lastKnownLocation.lon ?? undefined;

        if (typeof lat === "number" && Number.isFinite(lat)) body.lat = lat;
        if (typeof lon === "number" && Number.isFinite(lon)) body.lon = lon;

        if (typeof payload?.camOn === "boolean") {
          body.camOn = payload.camOn;
        }
        if (payload?.note) body.note = payload.note;

        const res = await fetch("/api/club/live/ping", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `שגיאה ב-ping (סטטוס ${res.status}) ${text ? " - " + text : ""}`,
          );
        }

        const data = (await res.json().catch(() => null)) as {
          ok: boolean;
          item?: LiveSessionItem;
        } | null;
        if (!data?.ok || !data.item) {
          throw new Error("התשובה מהשרת לא תקינה (ping)");
        }

        setMySession(data.item);
        setLastPingAt(new Date());
      } catch (e: any) {
        console.error("[useLiveSession.ping] error:", e);
        // לא נשבור את החוויה על פינג בודד – רק לוג
      }
    },
    [lastKnownLocation.lat, lastKnownLocation.lon],
  );

  const stopLive = useCallback(
    async (payload?: StopPayload) => {
      setLoading(true);
      setError(null);
      try {
        const body: any = {};
        if (payload?.targetUserId && typeof payload.targetUserId === "string") {
          body.targetUserId = payload.targetUserId;
        }

        const res = await fetch("/api/club/live/stop", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `שגיאה ב-stop (סטטוס ${res.status}) ${text ? " - " + text : ""}`,
          );
        }

        const data = (await res.json().catch(() => null)) as {
          ok: boolean;
          item?: LiveSessionItem | null;
        } | null;
        if (!data?.ok) {
          throw new Error("התשובה מהשרת לא תקינה (stop)");
        }

        // אם זה הסשן שלי – נאפס
        if (!payload?.targetUserId) {
          setMySession(null);
        } else if (mySession && payload.targetUserId === mySession.userId) {
          setMySession({ ...mySession, active: false, camOn: false });
        }
      } catch (e: any) {
        console.error("[useLiveSession.stopLive] error:", e);
        setError(e?.message || "שגיאה בעצירת שידור חי");
      } finally {
        setLoading(false);
      }
    },
    [mySession],
  );

  /* ───────── Auto ping ───────── */

  useEffect(() => {
    if (!autoPing) return;
    if (!isActive) {
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
      return;
    }

    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
    }

    pingTimerRef.current = setInterval(() => {
      // פינג עדין, בלי override של note וכו'
      ping().catch(() => {});
    }, pingIntervalMs);

    return () => {
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
    };
  }, [autoPing, isActive, ping, pingIntervalMs]);

  /* ───────── Toggle helper ───────── */

  const toggleLive = useCallback(async () => {
    if (toggling) return;
    setToggling(true);
    try {
      if (isActive) {
        await stopLive();
      } else {
        await startLive();
      }
    } finally {
      setToggling(false);
    }
  }, [isActive, startLive, stopLive, toggling]);

  return {
    mySession,
    loading,
    error,
    isActive,
    lastPingAt,

    startLive,
    ping,
    stopLive,

    setLastKnownLocation,
    lastKnownLocation,

    toggling,
    toggleLive,
  };
}
