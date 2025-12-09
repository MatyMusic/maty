// src/components/club/LiveRoomModal.tsx
"use client";

import { useLiveSession } from "@/hooks/useLiveSession"; // מניח שיש לך הוק כזה
import { useRtcRoom } from "@/hooks/useRtcRoom";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;

  meId: string; // userId הנוכחי
  meName: string;

  peerId: string; // מי בצד השני
  peerName: string;

  // אם כבר יצרת LiveSession בחוץ – אפשר להעביר roomId מוכן
  initialRoomId?: string | null;

  role: "caller" | "callee"; // מי יוזם את השיחה
};

/**
 * LiveRoomModal – מודאל שיחת וידאו 1 על 1
 *
 * - פותח getUserMedia
 * - יוצר LiveSession (אם צריך)
 * - מחבר useRtcRoom לחדר + משתמשים
 */
export default function LiveRoomModal({
  isOpen,
  onClose,
  meId,
  meName,
  peerId,
  peerName,
  initialRoomId,
  role,
}: Props) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [roomId, setRoomId] = useState<string | null>(initialRoomId || null);
  const [loadingSession, setLoadingSession] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const { startLive, stopLive } = useLiveSession(); // מניח שיש: startLive(), stopLive()

  // RTCPeerConnection hook
  const { status, error, connect, disconnect } = useRtcRoom({
    roomId: roomId || "",
    meId,
    peerId,
    role,
    localStream,
    remoteVideoRef,
  });

  // ---- פתיחת מצלמה מקומית ----
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function openCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("getUserMedia error", err);
      }
    }

    openCamera();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // ---- ניקוי stream מקומי בעת סגירה ----
  const cleanupLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    setLocalStream(null);
  };

  // ---- יצירת LiveSession אם צריך ----
  useEffect(() => {
    if (!isOpen) return;
    if (roomId) return; // כבר יש

    let active = true;

    async function ensureSession() {
      try {
        setLoadingSession(true);
        const res = await startLive({
          title: `שיחה עם ${peerName}`,
          kind: "one_to_one",
          note: `שיחת וידאו בין ${meName} ל-${peerName}`,
        });
        if (!active) return;
        if (res?.liveSessionId) {
          setRoomId(res.liveSessionId);
        } else if (res?._id) {
          setRoomId(res._id);
        }
      } catch (err) {
        console.error("startLive error", err);
      } finally {
        if (active) setLoadingSession(false);
      }
    }

    void ensureSession();

    return () => {
      active = false;
    };
  }, [isOpen, roomId, startLive, meName, peerName]);

  // ---- התחברות RTC ברגע שיש roomId + localStream ----
  useEffect(() => {
    if (!isOpen) return;
    if (!roomId) return;
    if (!localStream) return;

    void connect();
    // לא מנתקים פה כדי לא להפיל בזמן רינדור
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, roomId, localStream]);

  // ---- סגירה מלאה ----
  const handleClose = async () => {
    try {
      await disconnect();
    } catch {
      // לא קריטי
    }
    if (roomId) {
      try {
        await stopLive({ liveSessionId: roomId });
      } catch {
        // לא נורא
      }
    }
    cleanupLocalStream();
    setRoomId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-zinc-900 text-zinc-50 shadow-xl border border-zinc-700 flex flex-col">
        {/* כותרת */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex flex-col">
            <span className="text-sm text-zinc-400">שיחת וידאו חיה</span>
            <span className="text-lg font-semibold">
              {meName} ↔ {peerName}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full border border-zinc-600 px-3 py-1 text-sm hover:bg-zinc-800"
          >
            סגירה ✕
          </button>
        </div>

        {/* תוכן – וידאו כפול */}
        <div className="flex flex-1 flex-col gap-3 p-4 md:flex-row">
          {/* וידאו של הצד השני */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">הצד השני</span>
              <span
                className={clsx(
                  "text-xs rounded-full px-2 py-0.5 border",
                  status === "connected"
                    ? "border-emerald-500 text-emerald-400"
                    : status === "connecting"
                      ? "border-amber-500 text-amber-300"
                      : status === "error"
                        ? "border-red-500 text-red-400"
                        : "border-zinc-500 text-zinc-300",
                )}
              >
                {status === "idle" && "ממתין"}
                {status === "connecting" && "מתחבר..."}
                {status === "connected" && "מחובר"}
                {status === "error" && "שגיאה"}
              </span>
            </div>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/70">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
              {status !== "connected" && (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
                  ממתין שהצד השני יתחבר...
                </div>
              )}
            </div>
          </div>

          {/* הוידאו המקומי */}
          <div className="w-full md:w-72 flex flex-col gap-2">
            <span className="text-sm text-zinc-400">אני</span>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/70">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {!localStream && (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-xs">
                  פותח מצלמה...
                </div>
              )}
            </div>

            {/* כפתורי שליטה */}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (!localStream) return;
                  const vTrack = localStream
                    .getVideoTracks()
                    .find((t) => t.kind === "video");
                  if (!vTrack) return;
                  const enabled = vTrack.enabled;
                  vTrack.enabled = !enabled;
                }}
                className="flex-1 rounded-full bg-zinc-800 px-3 py-1.5 text-xs hover:bg-zinc-700"
              >
                מצלמה ON/OFF
              </button>
              <button
                onClick={() => {
                  if (!localStream) return;
                  const aTrack = localStream
                    .getAudioTracks()
                    .find((t) => t.kind === "audio");
                  if (!aTrack) return;
                  aTrack.enabled = !aTrack.enabled;
                }}
                className="flex-1 rounded-full bg-zinc-800 px-3 py-1.5 text-xs hover:bg-zinc-700"
              >
                מיקרופון ON/OFF
              </button>
              <button
                onClick={handleClose}
                className="flex-1 rounded-full bg-red-600 px-3 py-1.5 text-xs hover:bg-red-500"
              >
                סיום שיחה
              </button>
            </div>

            {loadingSession && (
              <div className="mt-2 text-xs text-amber-300">
                יוצר חדר לייב...
              </div>
            )}
            {error && (
              <div className="mt-1 text-xs text-red-400">שגיאה: {error}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
