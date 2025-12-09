// src/components/club/RightSidebar.tsx
"use client";

/**
 * פאנל צד ל־CLUB:
 * - שליטה בשידור חי שלי (Go Live / Stop) עם מצלמה ראשית גדולה
 * - בחירת "חדר" לשידור: חרדי / חב״ד / חסידי / מזרחי / התוועדות / מוזיקאים
 * - מפת נוכחות חיה
 * - רשימת שידורים בסביבה עם סינון, חיפוש ומיון
 * - חיבור לחדר וידאו חי (WebRTC) 1 על 1
 * - "שיחה נכנסת" – כשמישהו שולח אליך בקשה (ring)
 * - כרטיסיית MATY-DATE LIVE מחוברת ל־API
 */

import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useRtcRoom } from "@/hooks/useRtcRoom";
import Link from "next/link";
import * as React from "react";

/* ───────── Types from API ───────── */

export type LiveRoomTag =
  | "charedi"
  | "chabad"
  | "chasidic"
  | "mizrahi"
  | "farbrengen"
  | "musicians";

type LiveItem = {
  _id: string;
  userId: string;
  userName?: string;
  userImage?: string;
  isAdmin?: boolean;
  lat?: number;
  lon?: number;
  areaName?: string;
  distanceKm?: number | null;
  kind?: "public" | "one_to_one" | "friends";
  startedAt?: string;
  lastPingAt?: string;
  isMe?: boolean;
  roomTag?: LiveRoomTag; // חדר השידור
};

type LiveListResp = {
  ok: boolean;
  items?: LiveItem[];
  error?: string;
};

type MySessionResp = {
  ok: boolean;
  item?: LiveItem | null;
  error?: string;
};

/* ───────── Incoming call types ───────── */

type IncomingCall = {
  id: string;
  roomId: string;
  fromUserId: string;
  fromName: string;
  fromImage?: string | null;
  at?: string | null;
};

/* ───────── Utils ───────── */

function formatDistance(d?: number | null): string | null {
  if (d == null || !Number.isFinite(d)) return null;
  if (d < 0.1) return "מאוד קרוב אליך";
  if (d < 1) return `${(d * 1000).toFixed(0)} מ׳ ממך`;
  if (d < 10) return `${d.toFixed(1)} ק״מ ממך`;
  return `${Math.round(d)} ק״מ ממך`;
}

function formatTimeAgo(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffSec = (Date.now() - d.getTime()) / 1000;
  if (diffSec < 60) return "לפני רגע";
  if (diffSec < 3600) return `לפני ${Math.floor(diffSec / 60)} דק׳`;
  if (diffSec < 86400) return `לפני ${Math.floor(diffSec / 3600)} שעות`;
  return d.toLocaleString("he-IL", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatKind(kind?: LiveItem["kind"]): string {
  if (kind === "one_to_one") return "1 על 1";
  if (kind === "friends") return "חברים";
  if (kind === "public") return "פומבי";
  return "לא ידוע";
}

function roomTagLabel(tag?: LiveRoomTag): string {
  switch (tag) {
    case "charedi":
      return "חרדי";
    case "chabad":
      return "חב״ד";
    case "chasidic":
      return "חסידי";
    case "mizrahi":
      return "מזרחי / חאפלה";
    case "farbrengen":
      return "התוועדות";
    case "musicians":
      return "מוזיקאים / ג׳אם";
    default:
      return "חדר כללי";
  }
}

/* ───────── Hook: מיקום שלי (Geolocation) ───────── */

function useGeo() {
  const [coords, setCoords] = React.useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!navigator.geolocation) {
      setError("המכשיר לא תומך במיקום (Geolocation).");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        console.warn("geo error:", err);
        setError("אין הרשאה למיקום או שגיאה בקריאה.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 20_000,
        timeout: 15_000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { coords, error };
}

/* ───────── Hook: תרגום נ״צ לשם עיר/אזור (Reverse-Geo) ───────── */

type GeoReverseResp = {
  ok: boolean;
  label?: string;
  areaName?: string;
  city?: string;
  name?: string;
  error?: string;
};

function useGeoLabel(coords: { lat: number; lon: number } | null) {
  const [geoLabel, setGeoLabel] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!coords) {
      setGeoLabel(null);
      return;
    }

    let aborted = false;
    setLoading(true);

    const params = new URLSearchParams({
      lat: String(coords.lat),
      lon: String(coords.lon),
    });

    fetch(`/api/geo/reverse?${params.toString()}`, { cache: "no-store" })
      .then(async (res) => {
        const ct = res.headers.get("content-type") || "";
        const raw = await res.text();

        if (!ct.includes("application/json")) {
          console.error("[GEO.REVERSE] non-JSON:", res.status, raw);
          throw new Error("התשובה מהמיקום לא בפורמט JSON");
        }

        let j: GeoReverseResp;
        try {
          j = JSON.parse(raw);
        } catch (e) {
          console.error("[GEO.REVERSE] JSON parse error:", raw);
          throw new Error("שגיאה בפענוח מיקום מהשרת");
        }

        if (!res.ok || !j.ok) {
          throw new Error(j.error || `שגיאה במיקום (סטטוס ${res.status})`);
        }

        const label = j.label || j.areaName || j.name || j.city || null;

        if (!aborted) {
          setGeoLabel(label);
        }
      })
      .catch((e) => {
        console.warn("[GEO.REVERSE] error:", e);
        if (!aborted) setGeoLabel(null);
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });

    return () => {
      aborted = true;
    };
  }, [coords?.lat, coords?.lon]);

  return { geoLabel, geoLoading: loading };
}

/* ───────── Hook: ניהול שידור חי שלי ───────── */

function useMyLiveSession(
  coords: { lat: number; lon: number } | null,
  geoLabel?: string | null,
) {
  const [session, setSession] = React.useState<LiveItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<Date | null>(null);

  const reload = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/club/live/session", { cache: "no-store" });

      const ct = res.headers.get("content-type") || "";
      const raw = await res.text();

      if (!ct.includes("application/json")) {
        console.error("[LIVE.SESSION] non-JSON response:", res.status, raw);
        throw new Error(`שרת החזיר תגובה לא תקינה (סטטוס ${res.status})`);
      }

      let j: MySessionResp;
      try {
        j = JSON.parse(raw);
      } catch (e) {
        console.error("[LIVE.SESSION] JSON parse error:", raw);
        throw new Error("שגיאה בפענוח JSON מהשרת");
      }

      if (!res.ok || !j.ok) {
        throw new Error(
          j.error || `שגיאה בטעינת סטטוס לייב (סטטוס ${res.status})`,
        );
      }

      setSession(j.item || null);
      setLastUpdatedAt(new Date());
    } catch (e: any) {
      setError(e?.message || "שגיאה בטעינת סטטוס לייב");
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const startLive = React.useCallback(
    async (
      kind: "public" | "one_to_one" | "friends" = "public",
      roomTag?: LiveRoomTag,
    ) => {
      if (!coords) {
        setError("אין מיקום – אי אפשר לצאת לשידור חי.");
        return;
      }
      try {
        setSaving(true);
        setError(null);
        const res = await fetch("/api/club/live/session", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: coords.lat,
            lon: coords.lon,
            areaName: geoLabel || "אזור נוכחי",
            radiusMeters: 1500,
            kind,
            roomTag,
          }),
        });

        const ct = res.headers.get("content-type") || "";
        const raw = await res.text();

        if (!ct.includes("application/json")) {
          console.error("[LIVE.SESSION.POST] non-JSON:", res.status, raw);
          throw new Error(`שרת החזיר תגובה לא תקינה (סטטוס ${res.status})`);
        }

        let j: MySessionResp;
        try {
          j = JSON.parse(raw);
        } catch (e) {
          console.error("[LIVE.SESSION.POST] JSON parse error:", raw);
          throw new Error("שגיאה בפענוח JSON מהשרת");
        }

        if (!res.ok || !j.ok) {
          throw new Error(
            j.error || `שגיאה ביציאה לשידור (סטטוס ${res.status})`,
          );
        }

        setSession(j.item || null);
        setLastUpdatedAt(new Date());
      } catch (e: any) {
        setError(e?.message || "שגיאה ביציאה לשידור");
      } finally {
        setSaving(false);
      }
    },
    [coords, geoLabel],
  );

  const stopLive = React.useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/club/live/session", {
        method: "DELETE",
        cache: "no-store",
      });
      const ct = res.headers.get("content-type") || "";
      const raw = await res.text();

      if (!ct.includes("application/json")) {
        console.error("[LIVE.SESSION.DELETE] non-JSON:", res.status, raw);
        throw new Error(`שרת החזיר תגובה לא תקינה (סטטוס ${res.status})`);
      }

      let j: any;
      try {
        j = JSON.parse(raw);
      } catch (e) {
        console.error("[LIVE.SESSION.DELETE] JSON parse error:", raw);
        throw new Error("שגיאה בפענוח JSON מהשרת");
      }

      if (!res.ok || !j.ok) {
        throw new Error(j.error || `שגיאה בעצירת שידור (סטטוס ${res.status})`);
      }

      setSession(null);
      setLastUpdatedAt(new Date());
    } catch (e: any) {
      setError(e?.message || "שגיאה בעצירת שידור");
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    session,
    loading,
    saving,
    error,
    reload,
    startLive,
    stopLive,
    lastUpdatedAt,
  };
}

/* ───────── Hook: רשימת שידורים בסביבה ───────── */

type LiveFilterKind = "nearby" | "all" | "admins" | "friends";
type LiveSortKey = "distance" | "name" | "recent";

function useLiveList(coords: { lat: number; lon: number } | null) {
  const [items, setItems] = React.useState<LiveItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastReloadAt, setLastReloadAt] = React.useState<Date | null>(null);

  const reload = React.useCallback(
    async (opts?: { forceAll?: boolean }) => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (coords) {
          params.set("lat", String(coords.lat));
          params.set("lon", String(coords.lon));
        }
        params.set("radius", "5000");
        if (opts?.forceAll) params.set("all", "1");

        const res = await fetch(`/api/club/live/list?${params.toString()}`, {
          cache: "no-store",
        });

        const ct = res.headers.get("content-type") || "";
        const raw = await res.text();

        if (!ct.includes("application/json")) {
          console.error("[LIVE.LIST] non-JSON response:", res.status, raw);
          throw new Error(
            `שרת החזיר תוכן לא תקין (סטטוס ${res.status}) – בדוק את /api/club/live/list בטרמינל`,
          );
        }

        let j: LiveListResp;
        try {
          j = JSON.parse(raw);
        } catch (e) {
          console.error("[LIVE.LIST] JSON parse error:", raw);
          throw new Error("שגיאה בפענוח JSON מהשרת (LIVE LIST)");
        }

        if (!res.ok || !j.ok) {
          throw new Error(
            j.error || `שגיאה בטעינת שידורים חיים (סטטוס ${res.status})`,
          );
        }

        setItems(Array.isArray(j.items) ? j.items : []);
        setLastReloadAt(new Date());
      } catch (e: any) {
        setError(e?.message || "שגיאה בטעינת שידורים חיים");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [coords],
  );

  React.useEffect(() => {
    reload();
    const id = setInterval(() => reload(), 20_000);
    return () => clearInterval(id);
  }, [reload]);

  return { items, loading, error, reload, lastReloadAt };
}

/* ───────── Hook: מצלמה מקומית (getUserMedia) לשיחות 1:1 ───────── */

function useLocalCamera() {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);

  const stopStream = React.useCallback(() => {
    const el = videoRef.current;
    const s: MediaStream | null =
      (el && (el as any).srcObject) || stream || null;
    if (s && s instanceof MediaStream) {
      s.getTracks().forEach((t) => t.stop());
    }
    if (el) {
      (el as any).srcObject = null;
    }
    setStream(null);
  }, [stream]);

  const start = React.useCallback(async () => {
    try {
      setError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("הדפדפן לא תומך בפתיחת מצלמה (camera API).");
        setActive(false);
        return;
      }
      const s = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const el = videoRef.current;
      if (!el) {
        s.getTracks().forEach((t) => t.stop());
        setError("לא נמצא אלמנט וידאו להצגה (videoRef=null).");
        setActive(false);
        return;
      }
      (el as any).srcObject = s;
      setStream(s);
      setActive(true);
    } catch (e: any) {
      console.error("camera error:", e);
      let msg = e?.message || "שגיאה בפתיחת מצלמה/מיקרופון";
      if (msg.includes("Permission") || msg.includes("denied")) {
        msg =
          "הגישה למצלמה/מיקרופון חסומה לאתר. בבקשה אפשר מחדש את ההרשאות בדפדפן ואז נסה שוב.";
      }
      setError(msg);
      setActive(false);
    }
  }, []);

  const stop = React.useCallback(() => {
    stopStream();
    setActive(false);
  }, [stopStream]);

  React.useEffect(
    () => () => {
      stopStream();
    },
    [stopStream],
  );

  return { videoRef, active, error, start, stop, stream };
}

/* ───────── Hook: מצלמת שידור ראשית (Broadcast) ───────── */

function useBroadcastCamera() {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);

  const stopStream = React.useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    const el = videoRef.current;
    if (el) {
      (el as any).srcObject = null;
    }
    setStream(null);
  }, [stream]);

  const start = React.useCallback(async () => {
    try {
      if (active && stream) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("הדפדפן לא תומך במצלמה/מיקרופון.");
        setActive(false);
        return;
      }
      setError(null);
      const s = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const el = videoRef.current;
      if (!el) {
        s.getTracks().forEach((t) => t.stop());
        setError("לא נמצא אלמנט וידאו לשידור (videoRef=null).");
        setActive(false);
        return;
      }
      (el as any).srcObject = s;
      setStream(s);
      setActive(true);
    } catch (e: any) {
      console.error("[BroadcastCamera] error:", e);
      let msg = e?.message || "שגיאה בפתיחת מצלמה לשידור.";
      if (msg.includes("Permission") || msg.includes("denied")) {
        msg =
          "הגישה למצלמה/מיקרופון חסומה לאתר. תבדוק את ההרשאות לדומיין (סמל המנעול) ותאפשר שוב.";
      }
      setError(msg);
      setActive(false);
    }
  }, [active, stream]);

  const stop = React.useCallback(() => {
    stopStream();
    setActive(false);
  }, [stopStream]);

  React.useEffect(
    () => () => {
      stopStream();
    },
    [stopStream],
  );

  return { videoRef, active, error, start, stop };
}

/* ───────── Hook: Inbox לשיחות נכנסות (ring) ───────── */

function useRtcInbox() {
  const [incoming, setIncoming] = React.useState<IncomingCall | null>(null);
  const lastTsRef = React.useRef<number>(Date.now());

  React.useEffect(() => {
    let stopped = false;

    const tick = async () => {
      try {
        const params = new URLSearchParams({
          since: String(lastTsRef.current),
        });
        const res = await fetch(`/api/rtc/inbox?${params.toString()}`, {
          cache: "no-store",
        });
        const ct = res.headers.get("content-type") || "";
        const raw = await res.text();

        if (!ct.includes("application/json")) {
          console.error("[RTC.INBOX] non-JSON:", res.status, raw);
          return;
        }

        let j: {
          ok: boolean;
          now?: number;
          items?: Array<{
            id: string;
            roomId: string;
            fromUserId: string;
            fromName: string;
            fromImage?: string | null;
            createdAt?: string | null;
          }>;
          error?: string;
        };

        try {
          j = JSON.parse(raw);
        } catch (e) {
          console.error("[RTC.INBOX] JSON parse error:", raw);
          return;
        }

        if (!j.ok) {
          if (j.error) console.warn("[RTC.INBOX] error:", j.error);
          return;
        }

        if (typeof j.now === "number") {
          lastTsRef.current = j.now;
        }

        const items = j.items || [];
        if (!items.length) return;

        const last = items[items.length - 1];
        if (stopped) return;

        setIncoming({
          id: last.id,
          roomId: last.roomId,
          fromUserId: last.fromUserId,
          fromName: last.fromName || "משתמש לא ידוע",
          fromImage: last.fromImage || null,
          at: last.createdAt || null,
        });
      } catch (e) {
        console.warn("[RTC.INBOX] tick error:", e);
      }
    };

    const id = setInterval(() => {
      if (!stopped) void tick();
    }, 2500);

    void tick();

    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, []);

  const clear = React.useCallback(() => {
    setIncoming(null);
  }, []);

  return { incoming, clear };
}

/* ───────── מודאל הצטרפות לשידור (מצלמה + WebRTC 1:1) ───────── */

function JoinLiveDialog({
  target,
  onClose,
  autoStartCamera,
}: {
  target: LiveItem | null;
  onClose: () => void;
  autoStartCamera?: boolean;
}) {
  const {
    videoRef,
    active,
    error: camError,
    start,
    stop,
    stream,
  } = useLocalCamera();

  const remoteVideoRef = React.useRef<HTMLVideoElement | null>(null);

  const roomId = target?._id ?? null;
  const targetUserId = target?.userId ?? null;

  const {
    status,
    error: rtcError,
    connect,
    hangup,
  } = useRtcRoom({
    roomId,
    targetUserId,
    localStream: stream,
    remoteVideoRef,
  });

  React.useEffect(() => {
    if (target && autoStartCamera && !active) {
      void start();
    }
  }, [target, autoStartCamera, active, start]);

  const statusText: string = (() => {
    if (status === "idle") return "מוכן להתחברות";
    if (status === "connecting") return "מתחבר לחדר וידאו…";
    if (status === "connected") return "מחובר לחדר וידאו ✔";
    if (status === "error") return "שגיאה בחיבור – אפשר לנסות שוב";
    return "";
  })();

  const handleClose = () => {
    stop();
    void hangup();
    onClose();
  };

  if (!target) return null;

  const dist = formatDistance(target.distanceKm ?? null);
  const kindLabel = formatKind(target.kind);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-950 shadow-xl border border-neutral-200/80 dark:border-neutral-800/80 p-4 space-y-3">
        {/* כותרת + פרטי משתמש */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-sky-400 text-black flex items-center justify-center text-sm font-semibold overflow-hidden">
              {target.userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={target.userImage}
                  alt={target.userName || ""}
                  className="w-full h-full object-cover"
                />
              ) : (
                (target.userName || "??").slice(0, 2)
              )}
            </div>
            {target.isAdmin && (
              <span className="absolute -bottom-1 -left-1 px-1.5 rounded-full bg-sky-600 text-[9px] text-white">
                מנהל
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-[14px] truncate">
              {target.userName || "משתמש לא ידוע"}
            </span>
            <span className="text-[11px] opacity-70 truncate">
              {target.areaName || "אזור לא ידוע"}
              {dist ? ` · ${dist}` : ""}
            </span>
          </div>
        </div>

        <div className="text-[11px] opacity-80 leading-relaxed">
          אתה עומד להצטרף לשידור{" "}
          <span className="font-semibold">{kindLabel}</span> עם המשתמש הזה.
          עכשיו זה כבר <b>חדר וידאו אמיתי</b> בעזרת WebRTC – המצלמות נפתחות רק
          אצל מי שמאשר.
        </div>

        {/* מצלמה שלי + הצד השני */}
        <div className="grid grid-cols-2 gap-2">
          {/* מצלמה שלי */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold">תצוגה שלי</div>
            <div className="relative rounded-xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800/80 bg-black h-40 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${
                  !active ? "opacity-30" : ""
                }`}
              />
              {!active && (
                <span className="absolute text-[11px] text-white/80">
                  המצלמה כבויה – לחץ על "פתח מצלמה שלי"
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={active ? stop : start}
                className={`rounded-full px-3 py-1 text-[11px] ${
                  active
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                }`}
              >
                {active ? "כבה מצלמה" : "פתח מצלמה שלי"}
              </button>
              {camError && (
                <span className="text-red-500 text-[10px]">{camError}</span>
              )}
            </div>
          </div>

          {/* הצד השני */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold">הצד השני</div>
            <div className="relative rounded-xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800/80 bg-black h-40 flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {status !== "connected" && (
                <span className="absolute text-[11px] text-white/80">
                  ממתין לחיבור/מצלמה מהצד השני…
                </span>
              )}
            </div>
            <div className="text-[10px] opacity-70">{statusText}</div>
          </div>
        </div>

        {rtcError && <div className="text-[11px] text-red-500">{rtcError}</div>}

        {/* כפתורי פעולה */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-neutral-300/80 dark:border-neutral-700/80 px-3 py-1 text-[11px] hover:bg-neutral-100/90 dark:hover:bg-neutral-800/80"
          >
            בטל
          </button>
          <button
            type="button"
            disabled={!stream}
            onClick={() => connect()}
            className="rounded-full bg-emerald-500 text-white px-3 py-1 text-[11px] hover:bg-emerald-600 disabled:opacity-60"
          >
            התחבר לשידור חי
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── דיאלוג שיחה נכנסת ───────── */

function IncomingCallDialog({
  call,
  onAccept,
  onReject,
}: {
  call: IncomingCall;
  onAccept: () => void;
  onReject: () => void;
}) {
  const atLabel = call.at ? formatTimeAgo(call.at) : "עכשיו";

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center pointer-events-none">
      <div className="mt-16 pointer-events-auto w-full max-w-sm rounded-2xl bg-white/95 dark:bg-neutral-950/95 border border-emerald-400/70 dark:border-emerald-500/70 shadow-2xl px-4 py-3 animate-[mmIncoming_0.45s_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-sky-400 text-black flex items-center justify-center text-sm font-semibold overflow-hidden">
              {call.fromImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={call.fromImage}
                  alt={call.fromName}
                  className="w-full h-full object-cover"
                />
              ) : (
                call.fromName.slice(0, 2)
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] flex items-center justify-center animate-pulse">
              📞
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold truncate">
              {call.fromName}
            </div>
            <div className="text-[11px] opacity-70 truncate">
              רוצה לפתוח איתך שיחת וידאו 1 על 1
            </div>
            <div className="text-[10px] opacity-60">{atLabel}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 text-[12px]">
          <button
            type="button"
            onClick={onReject}
            className="px-3 py-1 rounded-full border border-neutral-300/80 dark:border-neutral-700/80 hover:bg-neutral-100/90 dark:hover:bg-neutral-800/90"
          >
            דחה
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="px-3 py-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 animate-[mmCallPulse_1.1s_ease-in-out_infinite]"
          >
            קבל שיחה
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes mmIncoming {
          0% {
            transform: translateY(-12px) scale(0.96);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes mmCallPulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
          }
        }
      `}</style>
    </div>
  );
}

/* ───────── רשימת שידורים + סינון/חיפוש ───────── */

function LiveListPanel({
  items,
  loading,
  error,
  onReload,
  isAdmin,
  lastReloadAt,
  onJoin,
  callSending,
}: {
  items: LiveItem[];
  loading: boolean;
  error: string | null;
  onReload: (opts?: { forceAll?: boolean }) => void;
  isAdmin: boolean;
  lastReloadAt: Date | null;
  onJoin: (u: LiveItem) => void;
  callSending: boolean;
}) {
  const [filterKind, setFilterKind] = React.useState<LiveFilterKind>("nearby");
  const [sortKey, setSortKey] = React.useState<LiveSortKey>("distance");
  const [search, setSearch] = React.useState("");
  const [roomFilter, setRoomFilter] = React.useState<LiveRoomTag | "all">(
    "all",
  );

  const filtered = React.useMemo(() => {
    let res = [...items];

    if (roomFilter !== "all") {
      res = res.filter((u) => (u.roomTag || "charedi") === roomFilter);
    }

    if (filterKind === "nearby") {
      res = res.filter((u) => {
        return (
          u.distanceKm == null ||
          (typeof u.distanceKm === "number" && u.distanceKm <= 5)
        );
      });
    } else if (filterKind === "admins") {
      res = res.filter((u) => !!u.isAdmin);
    } else if (filterKind === "friends") {
      res = res.filter((u) => u.kind === "friends");
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      res = res.filter((u) => {
        const name = (u.userName || "").toLowerCase();
        const area = (u.areaName || "").toLowerCase();
        const room = roomTagLabel(u.roomTag).toLowerCase();
        return name.includes(q) || area.includes(q) || room.includes(q);
      });
    }

    res.sort((a, b) => {
      if (sortKey === "name") {
        return (a.userName || "").localeCompare(b.userName || "");
      }
      if (sortKey === "recent") {
        const ta = a.lastPingAt ? +new Date(a.lastPingAt) : 0;
        const tb = b.lastPingAt ? +new Date(b.lastPingAt) : 0;
        return tb - ta;
      }
      const da = typeof a.distanceKm === "number" ? a.distanceKm : 9999;
      const db = typeof b.distanceKm === "number" ? b.distanceKm : 9999;
      return da - db;
    });

    return res;
  }, [items, filterKind, sortKey, search, roomFilter]);

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div>
          <div className="text-[13px] font-semibold flex items-center gap-1.5">
            🎥 שידורים חיים בסביבה
          </div>
          <div className="text-[11px] opacity-70">
            מי מחובר כרגע ויכול לפתוח מצלמה (בהסכמה), לפי חדרים וסגנונות.
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <button
                type="button"
                onClick={() => onReload({ forceAll: true })}
                className="rounded-full border border-neutral-300/70 dark:border-neutral-700/80 px-2 py-1 text-[10px] hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80"
              >
                הכל (אדמין)
              </button>
            )}
            <button
              type="button"
              onClick={() => onReload()}
              className="rounded-full border border-neutral-300/70 dark:border-neutral-700/80 px-2 py-1 text-[10px] hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80"
            >
              ריענון
            </button>
          </div>
          {lastReloadAt && (
            <span className="text-[10px] opacity-60">
              עודכן {formatTimeAgo(lastReloadAt.toISOString())}
            </span>
          )}
        </div>
      </div>

      <div className="px-3 pb-2 flex flex-col gap-2">
        {/* פילטר חדרים */}
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span className="opacity-70">חדר:</span>
          <button
            type="button"
            onClick={() => setRoomFilter("all")}
            className={`px-2 py-0.5 rounded-full border ${
              roomFilter === "all"
                ? "bg-neutral-900 text-white border-neutral-900"
                : "border-neutral-300/70 dark:border-neutral-700/80"
            }`}
          >
            הכל
          </button>
          {(
            [
              "charedi",
              "chabad",
              "chasidic",
              "mizrahi",
              "farbrengen",
              "musicians",
            ] as LiveRoomTag[]
          ).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setRoomFilter(tag)}
              className={`px-2 py-0.5 rounded-full border ${
                roomFilter === tag
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "border-emerald-300/70 dark:border-emerald-700/80"
              }`}
            >
              {roomTagLabel(tag)}
            </button>
          ))}
        </div>

        {/* פילטר סוג + חיפוש */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => setFilterKind("nearby")}
            className={`rounded-full px-2 py-1 border text-[10px] ${
              filterKind === "nearby"
                ? "bg-emerald-500 text-white border-emerald-500"
                : "border-neutral-300/70 dark:border-neutral-700/80"
            }`}
          >
            קרובים
          </button>
          <button
            type="button"
            onClick={() => setFilterKind("all")}
            className={`rounded-full px-2 py-1 border text-[10px] ${
              filterKind === "all"
                ? "bg-neutral-900 text-white border-neutral-900"
                : "border-neutral-300/70 dark:border-neutral-700/80"
            }`}
          >
            כולם
          </button>
          <button
            type="button"
            onClick={() => setFilterKind("admins")}
            className={`rounded-full px-2 py-1 border text-[10px] ${
              filterKind === "admins"
                ? "bg-sky-500 text-white border-sky-500"
                : "border-neutral-300/70 dark:border-neutral-700/80"
            }`}
          >
            מנהלים
          </button>
          <button
            type="button"
            onClick={() => setFilterKind("friends")}
            className={`rounded-full px-2 py-1 border text-[10px] ${
              filterKind === "friends"
                ? "bg-purple-500 text-white border-purple-500"
                : "border-neutral-300/70 dark:border-neutral-700/80"
            }`}
          >
            חברים
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש לפי שם / אזור / חדר..."
            className="flex-1 rounded-full border border-neutral-300/70 dark:border-neutral-700/80 bg-white/70 dark:bg-neutral-900/80 px-2.5 py-1 outline-none focus:ring-1 focus:ring-emerald-500 text-[11px]"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as LiveSortKey)}
            className="rounded-full border border-neutral-300/70 dark:border-neutral-700/80 bg-white/70 dark:bg-neutral-900/80 px-2 py-1 text-[10px]"
          >
            <option value="distance">מרחק</option>
            <option value="recent">אחרונים</option>
            <option value="name">שם</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="px-3 pb-3 pt-2 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-8 rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="px-3 pb-3 pt-2 text-[12px] text-red-500">{error}</div>
      ) : !filtered.length ? (
        <div className="px-3 pb-3 pt-2 text-[12px] opacity-70">
          אין כרגע שידורים לפי הסינון. אפשר לשנות פילטר או לצאת אתה לשידור 😉
        </div>
      ) : (
        <ul className="px-2 pb-3 pt-1 space-y-1.5 max-h-[240px] overflow-auto">
          {filtered.map((u) => {
            const dist = formatDistance(u.distanceKm ?? null);
            const badge = u.isMe
              ? "אתה"
              : u.isAdmin
                ? "מנהל"
                : u.kind === "friends"
                  ? "חברים"
                  : u.kind === "one_to_one"
                    ? "1 על 1"
                    : "פומבי";

            const profileHref = u.userId ? `/profile/${u.userId}` : null;

            return (
              <li
                key={u._id}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-[12px] hover:bg-neutral-100/80 dark:hover:bg-neutral-900/80 transition-colors"
              >
                <div className="relative">
                  {profileHref ? (
                    <Link href={profileHref} className="block">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-sky-400 text-black flex items-center justify-center text-[11px] font-semibold overflow-hidden">
                        {u.userImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.userImage}
                            alt={u.userName || ""}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (u.userName || "??").slice(0, 2)
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-sky-400 text-black flex items-center justify-center text-[11px] font-semibold overflow-hidden">
                      {u.userImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.userImage}
                          alt={u.userName || ""}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (u.userName || "??").slice(0, 2)
                      )}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -left-0.5 px-1 rounded-full bg-black/80 text-[9px] text-white">
                    {badge}
                  </span>
                  {u.roomTag && (
                    <span className="absolute -top-0.5 -right-0.5 px-1 rounded-full bg-emerald-500 text-[9px] text-white">
                      {roomTagLabel(u.roomTag)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  {profileHref ? (
                    <Link
                      href={profileHref}
                      className="font-medium truncate hover:underline hover:text-emerald-600"
                    >
                      {u.userName || "משתמש לא ידוע"}
                    </Link>
                  ) : (
                    <span className="font-medium truncate">
                      {u.userName || "משתמש לא ידוע"}
                    </span>
                  )}
                  <span className="text-[11px] opacity-70 truncate">
                    {u.areaName || "אזור לא ידוע"}
                    {dist ? ` · ${dist}` : ""}
                  </span>
                  {u.lastPingAt && (
                    <span className="text-[10px] opacity-60">
                      נראה {formatTimeAgo(u.lastPingAt)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onJoin(u)}
                  disabled={callSending}
                  className="ms-auto rounded-full bg-emerald-500 text-white px-3 py-1 text-[11px] hover:bg-emerald-600 disabled:opacity-60"
                >
                  {callSending ? "שולח בקשה…" : "הצטרף"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ───────── מיני-מפה ───────── */

function LiveMiniMap({ items }: { items: LiveItem[] }) {
  if (!items.length) {
    return (
      <div className="text-xs opacity-60 text-center py-4">
        עדיין אין שידורים חיים באזור שלך.
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-gradient-to-br from-slate-900 via-slate-950 to-zinc-900 text-xs text-neutral-100 p-3 shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-[13px]">מפת נוכחות חיה</span>
        <span className="text-[11px] opacity-70">
          {items.length} שידורים פעילים
        </span>
      </div>
      <div className="relative h-28 rounded-xl bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.45),_transparent_60%)] overflow-hidden">
        <div className="absolute inset-0 opacity-35">
          <div className="grid grid-cols-6 grid-rows-3 h-full w-full">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className="border-[0.5px] border-white/5 border-dashed"
              />
            ))}
          </div>
        </div>
        <div className="absolute inset-1">
          {items.slice(0, 9).map((u, idx) => {
            const row = Math.floor(idx / 3);
            const col = idx % 3;
            const top = 8 + row * 26;
            const left = 12 + col * 32;
            const isMe = u.isMe;

            const bgClass = (() => {
              if (isMe) return "bg-emerald-400/90 text-black";
              if (u.isAdmin) return "bg-sky-400/90 text-black";
              if (u.roomTag === "mizrahi") return "bg-amber-400/90 text-black";
              if (u.roomTag === "chabad") return "bg-yellow-300/90 text-black";
              if (u.roomTag === "farbrengen")
                return "bg-rose-400/90 text-black";
              if (u.roomTag === "musicians")
                return "bg-fuchsia-400/90 text-black";
              return "bg-neutral-500/80 text-white";
            })();

            return (
              <div
                key={u._id}
                className="absolute flex flex-col items-center"
                style={{ top, left }}
              >
                <div
                  className={`w-6 h-6 rounded-full border border-white/70 shadow-md flex items-center justify-center text-[10px] font-semibold ${bgClass}`}
                >
                  {(u.userName || "??").slice(0, 2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 text-[10px] opacity-70 leading-snug">
        כל עיגול מייצג משתמש בשידור חי. ירוק – אתה, כחול – מנהל. הצבעים הנוספים
        לפי חדר/סגנון (מזרחי, חב״ד, התוועדות, מוזיקאים וכו׳).
      </div>
    </div>
  );
}

/* ───────── פאנל MATY-DATE LIVE ───────── */

function MatyDatePanel() {
  const [info, setInfo] = React.useState<{
    online?: number;
    activeRooms?: number;
    matchesToday?: number;
  }>({});
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let aborted = false;

    const load = async () => {
      try {
        const res = await fetch("/api/maty-date/now", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!aborted) {
          setInfo({
            online: data.onlineUsers ?? data.online ?? undefined,
            activeRooms: data.activeRooms ?? undefined,
            matchesToday: data.matchesToday ?? undefined,
          });
        }
      } catch (e) {
        if (!aborted)
          setError("לא הצלחתי לטעון נתוני MATY-DATE (לא חובה כרגע).");
      }
    };

    load();
    const id = setInterval(load, 20_000);
    return () => {
      aborted = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 shadow-sm px-3 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[13px] font-semibold flex items-center gap-1.5">
            💛 MATY-DATE LIVE
          </div>
          <div className="text-[11px] opacity-70">
            חיבור בין המוזיקה, הקלאב והדייטים – הכל במערכת אחת.
          </div>
        </div>
        <a
          href="/date"
          className="text-[11px] px-2 py-1 rounded-full bg-pink-500 text-white hover:bg-pink-600"
        >
          לדף הדייטים
        </a>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
        <div className="rounded-xl bg-pink-50 dark:bg-pink-900/20 px-2 py-1.5">
          <div className="opacity-70">אונליין</div>
          <div className="text-[12px] font-semibold">{info.online ?? "—"}</div>
        </div>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 px-2 py-1.5">
          <div className="opacity-70">חדרים פעילים</div>
          <div className="text-[12px] font-semibold">
            {info.activeRooms ?? "—"}
          </div>
        </div>
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1.5">
          <div className="opacity-70">מאצ׳ים היום</div>
          <div className="text-[12px] font-semibold">
            {info.matchesToday ?? "—"}
          </div>
        </div>
      </div>

      {error && <div className="text-[10px] text-red-500">{error}</div>}

      <div className="text-[10px] opacity-70">
        לאדמין תהיה בהמשך גישה מלאה לכל הנתונים דרך MATY-API מרוכז – כאן זה רק
        דשבורד חי קטן בצד.
      </div>
    </div>
  );
}

/* ───────── פאנל עזרה / הסבר קצר ───────── */

function HelpPanel() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-950/80 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-[12px]"
      >
        <span className="flex items-center gap-1.5 font-semibold">
          ℹ️ איך עובד שידור חי?
        </span>
        <span className="text-[11px] opacity-70">{open ? "הסתר" : "פתח"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 text-[11px] space-y-1.5 opacity-85">
          <p>
            • כשלוחצים על <b>״צא לשידור״</b> – המצלמה שלך נפתחת בגדול ואתה מופיע
            בצד ימין אצל אחרים (לפי מיקום וחדר שבחרת).
          </p>
          <p>
            • אפשר לבחור <b>חדר</b> (חרדי / חב״ד / חסידי / מזרחי / התוועדות /
            מוזיקאים) וגם סוג: פומבי / חברים / 1 על 1.
          </p>
          <p>
            • הצטרפות לוידאו 1 על 1 נעשית דרך WebRTC רק אחרי שאתה או הצד השני
            מאשרים – אין פתיחת מצלמות בלי הסכמה.
          </p>
          <p>
            • אם מישהו שולח אליך שיחת וידאו, תקבל פופ־אפ{" "}
            <b>שיחה נכנסת – קבל / דחה</b>.
          </p>
        </div>
      )}
    </div>
  );
}

/* ───────── פאנל שליטה שלי (Go Live / Stop) + מצלמת שידור ───────── */

function MyLiveControls({
  coords,
  geoLabel,
  geoLoading,
  session,
  loading,
  saving,
  error,
  startLive,
  stopLive,
  lastUpdatedAt,
}: {
  coords: { lat: number; lon: number } | null;
  geoLabel: string | null;
  geoLoading: boolean;
  session: LiveItem | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  startLive: (
    kind?: "public" | "one_to_one" | "friends",
    roomTag?: LiveRoomTag,
  ) => void;
  stopLive: () => void;
  lastUpdatedAt: Date | null;
}) {
  const [kind, setKind] = React.useState<"public" | "one_to_one" | "friends">(
    "public",
  );
  const [roomTag, setRoomTag] = React.useState<LiveRoomTag>("mizrahi");
  const isLive = !!session;

  const {
    videoRef,
    active: camActive,
    error: camError,
    start: startCam,
    stop: stopCam,
  } = useBroadcastCamera();

  const statusLabel = React.useMemo(() => {
    if (loading) return "בודק סטטוס…";
    if (isLive)
      return "אתה בשידור חי · התצוגה למטה היא איך שאתה נראה כרגע באתר.";
    if (!coords) return "כדי לעבוד במדויק, מומלץ לאשר גישה למיקום במכשיר.";
    return "אתה לא בשידור כרגע. אפשר לצאת לשידור בכל רגע.";
  }, [loading, isLive, coords]);

  const handleStart = () => {
    if (!coords) return;
    void startCam();
    startLive(kind, roomTag);
  };

  const handleStop = () => {
    stopCam();
    stopLive();
  };

  return (
    <div className="rounded-2xl border border-dashed border-emerald-300/80 dark:border-emerald-500/60 bg-emerald-50/60 dark:bg-emerald-900/20 px-3 py-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-[13px] font-semibold flex items-center gap-1.5">
            {isLive
              ? "🎥 אתה בשידור חי (MATY LIVE)"
              : "🎥 צא לשידור חי בכל האתר"}
          </div>
          <div className="text-[11px] opacity-80">{statusLabel}</div>
          <div className="mt-1 text-[10px] opacity-70">
            {coords ? (
              geoLoading ? (
                "טוען מיקום משוער…"
              ) : geoLabel ? (
                <>מיקום משוער: {geoLabel}</>
              ) : (
                <>מיקום משוער זמין, אבל לא זוהה שם עיר.</>
              )
            ) : (
              "מיקום לא זמין – אפשר לאשר גישה למיקום בדפדפן."
            )}
          </div>
          {lastUpdatedAt && (
            <div className="mt-0.5 text-[10px] opacity-60">
              עודכן {formatTimeAgo(lastUpdatedAt.toISOString())}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {isLive ? (
            <button
              type="button"
              disabled={saving}
              onClick={handleStop}
              className="rounded-full bg-red-500/90 text-white px-3 py-1 text-[11px] hover:bg-red-600 disabled:opacity-60"
            >
              עצור שידור
            </button>
          ) : (
            <button
              type="button"
              disabled={saving || !coords}
              onClick={handleStart}
              className={`rounded-full text-white px-3 py-1 text-[11px] disabled:opacity-60 ${
                saving
                  ? "bg-emerald-500 animate-[mmBtnSlow_1.2s_ease-in-out_infinite]"
                  : "bg-emerald-500 animate-[mmBtnFast_0.6s_ease-in-out_infinite]"
              }`}
            >
              צא לשידור{" "}
              {roomTag === "mizrahi"
                ? "מזרחי / חאפלה"
                : roomTag === "farbrengen"
                  ? "התוועדות"
                  : roomTag === "chabad"
                    ? "חב״ד"
                    : roomTag === "musicians"
                      ? "מוזיקאים"
                      : "חי"}
            </button>
          )}
          <div className="flex flex-col items-end gap-1">
            <div className="flex flex-wrap gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => setKind("public")}
                className={`px-2 py-0.5 rounded-full border ${
                  kind === "public"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-emerald-400/70"
                }`}
              >
                פומבי
              </button>
              <button
                type="button"
                onClick={() => setKind("friends")}
                className={`px-2 py-0.5 rounded-full border ${
                  kind === "friends"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "border-purple-300/70"
                }`}
              >
                חברים
              </button>
              <button
                type="button"
                onClick={() => setKind("one_to_one")}
                className={`px-2 py-0.5 rounded-full border ${
                  kind === "one_to_one"
                    ? "bg-sky-600 text-white border-sky-600"
                    : "border-sky-300/70"
                }`}
              >
                1 על 1
              </button>
            </div>
            {loading && (
              <span className="text-[10px] opacity-70">טוען סטטוס…</span>
            )}
          </div>
        </div>
      </div>

      {/* בחירת חדרים לסגנון השידור */}
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        <span className="opacity-70">חדר שידור:</span>
        {(
          [
            "charedi",
            "chabad",
            "chasidic",
            "mizrahi",
            "farbrengen",
            "musicians",
          ] as LiveRoomTag[]
        ).map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setRoomTag(tag)}
            className={`px-2 py-0.5 rounded-full border ${
              roomTag === tag
                ? "bg-emerald-600 text-white border-emerald-600"
                : "border-emerald-300/70 text-emerald-900 dark:text-emerald-100"
            }`}
          >
            {roomTagLabel(tag)}
          </button>
        ))}
      </div>

      {/* תצוגת מצלמה גדולה – זה אתה משודר באתר */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold">
          התצוגה שלך באתר (שדרן ראשי)
        </div>
        <div className="relative h-44 rounded-2xl overflow-hidden border border-emerald-400/70 dark:border-emerald-600/70 bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${
              !camActive ? "opacity-30" : ""
            }`}
          />
          {!camActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-[11px] gap-1 bg-black/40">
              <span>המצלמה כבויה כרגע.</span>
              <span>לחץ על "צא לשידור" כדי לפתוח את המצלמה ולשדר.</span>
            </div>
          )}
          {session?.roomTag && (
            <div className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-black/70 text-white">
              {roomTagLabel(session.roomTag)}
            </div>
          )}
        </div>
        {camError && (
          <div className="text-[11px] text-red-500">
            שגיאת מצלמה: {camError}
          </div>
        )}
      </div>

      {error && (
        <div className="text-[11px] text-red-500 mt-1">שגיאה: {error}</div>
      )}
      <div className="text-[10px] opacity-70">
        השידור שלך מוצג בכל המערכת (לפי חדר) וכל מי שנמצא ב־MATY-MUSIC / CLUB
        יכול לבקש ממך שיחת וידאו 1 על 1. הצטרפות ל־RTC מתבצעת רק אחרי שאתה מאשר.
      </div>

      <style jsx global>{`
        @keyframes mmBtnFast {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
          }
        }
        @keyframes mmBtnSlow {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6);
          }
          50% {
            box-shadow: 0 0 0 16px rgba(16, 185, 129, 0);
          }
        }
      `}</style>
    </div>
  );
}

/* ───────── קומפוננטת side-bar הראשית ───────── */

export default function RightSidebar() {
  const { coords, error: geoError } = useGeo();
  const { geoLabel, geoLoading } = useGeoLabel(coords);
  const {
    session,
    loading: liveLoading,
    saving: liveSaving,
    error: liveError,
    startLive,
    stopLive,
    lastUpdatedAt,
  } = useMyLiveSession(coords, geoLabel);
  const {
    items,
    loading: listLoading,
    error: listError,
    reload: reloadList,
    lastReloadAt,
  } = useLiveList(coords);
  const isAdmin = useIsAdmin();

  const [joinTarget, setJoinTarget] = React.useState<LiveItem | null>(null);
  const [autoStartCamera, setAutoStartCamera] = React.useState(false);

  const { incoming, clear: clearIncoming } = useRtcInbox();

  // סטטוס שליחת בקשת שיחה
  const [callSending, setCallSending] = React.useState(false);
  const [callError, setCallError] = React.useState<string | null>(null);

  const openJoinDialog = React.useCallback(
    (target: LiveItem, autoStart = true) => {
      setJoinTarget(target);
      setAutoStartCamera(autoStart);
    },
    [],
  );

  // שליחת בקשת שיחה לצד השני (ring)
  const sendCallRequest = React.useCallback(async (target: LiveItem) => {
    try {
      setCallSending(true);
      setCallError(null);

      const res = await fetch("/api/rtc/call", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: target._id,
          targetUserId: target.userId,
        }),
      });

      const ct = res.headers.get("content-type") || "";
      const raw = await res.text();

      if (!ct.includes("application/json")) {
        console.error("[RTC.CALL] non-JSON response:", res.status, raw);
        setCallError(
          `השרת החזיר תגובה לא תקינה לבקשת שיחה (סטטוס ${res.status}). כנראה שהנתיב /api/rtc/call לא קיים או מחזיר HTML במקום JSON.`,
        );
        return;
      }

      let j: { ok: boolean; error?: string };
      try {
        j = JSON.parse(raw);
      } catch (e) {
        console.error("[RTC.CALL] JSON parse error:", raw);
        setCallError("שגיאה בפענוח תשובת בקשת השיחה מהשרת (JSON).");
        return;
      }

      if (!res.ok || !j.ok) {
        throw new Error(
          j.error || `שגיאה בשליחת בקשת שיחה (סטטוס ${res.status})`,
        );
      }
    } catch (e: any) {
      console.error("[RTC.CALL] error:", e);
      setCallError(e?.message || "שגיאה בשליחת בקשת שיחה");
    } finally {
      setCallSending(false);
    }
  }, []);

  const handleAcceptIncoming = React.useCallback(() => {
    if (!incoming) return;
    const live: LiveItem = {
      _id: incoming.roomId,
      userId: incoming.fromUserId,
      userName: incoming.fromName,
      userImage: incoming.fromImage || undefined,
      isAdmin: false,
      areaName: "שיחה נכנסת",
      kind: "one_to_one",
      distanceKm: null,
      startedAt: incoming.at || undefined,
    };
    openJoinDialog(live, true);
    clearIncoming();
  }, [incoming, clearIncoming, openJoinDialog]);

  const itemsWithMe = React.useMemo<LiveItem[]>(() => {
    let base = [...items];

    if (session) {
      const meUserId = session.userId || null;

      const meBase: LiveItem = {
        ...session,
        isMe: true,
        distanceKm: 0,
        areaName:
          session.areaName ||
          geoLabel ||
          (coords ? "האזור שלך" : "מיקום לא ידוע"),
      };

      const idx = base.findIndex(
        (u) =>
          u._id === session._id ||
          (meUserId && u.userId && u.userId === meUserId),
      );

      if (idx >= 0) {
        base[idx] = { ...base[idx], ...meBase, isMe: true };
      } else {
        base = [meBase, ...base];
      }
    }

    return base;
  }, [items, session, coords, geoLabel]);

  return (
    <>
      <aside className="flex flex-col gap-4 w-full max-w-xs">
        <MyLiveControls
          coords={coords}
          geoLabel={geoLabel}
          geoLoading={geoLoading}
          session={session}
          loading={liveLoading}
          saving={liveSaving}
          error={liveError || geoError}
          startLive={startLive}
          stopLive={stopLive}
          lastUpdatedAt={lastUpdatedAt}
        />

        <LiveMiniMap items={itemsWithMe} />

        <MatyDatePanel />

        <HelpPanel />

        <LiveListPanel
          items={itemsWithMe}
          loading={listLoading}
          error={listError}
          onReload={reloadList}
          isAdmin={isAdmin}
          lastReloadAt={lastReloadAt}
          onJoin={(u) => {
            // 1) שולח בקשת שיחה (ring) לצד השני
            void sendCallRequest(u);
            // 2) פותח אצלך את חלון ה־RTC והמצלמה
            openJoinDialog(u, true);
          }}
          callSending={callSending}
        />

        {callError && (
          <div className="text-[11px] text-red-500 mt-1">
            שגיאה בשליחת בקשת שיחה: {callError}
          </div>
        )}
      </aside>

      <JoinLiveDialog
        target={joinTarget}
        onClose={() => setJoinTarget(null)}
        autoStartCamera={autoStartCamera}
      />

      {incoming && (
        <IncomingCallDialog
          call={incoming}
          onAccept={handleAcceptIncoming}
          onReject={clearIncoming}
        />
      )}
    </>
  );
}
