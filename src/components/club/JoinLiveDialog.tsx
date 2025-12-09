// src/components/club/JoinLiveDialog.tsx
"use client";

import { useRtcRoom } from "@/hooks/useRtcRoom";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;

  roomId: string | null;

  meId: string;
  meName: string;

  peerId: string;
  peerName: string;

  role?: "caller" | "callee"; // אופציונלי – אם לא תעביר, נקבע לפי meId/peerId
};

/**
 * JoinLiveDialog
 * ---------------
 * דיאלוג לשיחת וידאו 1 על 1:
 * - פותח getUserMedia
 * - מחבר useRtcRoom
 * - מציג וידאו שלי + הצד השני
 */
export default function JoinLiveDialog({
  open,
  onClose,
  roomId,
  meId,
  meName,
  peerId,
  peerName,
  role,
}: Props) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const effectiveRole: "caller" | "callee" =
    role || (meId && peerId && meId < peerId ? "caller" : "callee");

  const { status, error, connect, hangup } = useRtcRoom({
    roomId,
    meId,
    peerId,
    role: effectiveRole,
    localStream,
    remoteVideoRef,
  });

  /* ───────── פתיחת מצלמה כשפותחים את הדיאלוג ───────── */

  useEffect(() => {
    if (!open) return;

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

    void openCamera();

    return () => {
      cancelled = true;
    };
  }, [open]);

  /* ───────── חיבור RTC ברגע שיש roomId + stream ───────── */

  useEffect(() => {
    if (!open) return;
    if (!roomId) return;
    if (!localStream) return;
    connect();
  }, [open, roomId, localStream, connect]);

  /* ───────── ניקוי סטרים מקומי ───────── */

  const cleanupLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    setLocalStream(null);
  };

  /* ───────── סגירת דיאלוג ───────── */

  const handleClose = async () => {
    try {
      await hangup();
    } catch {
      // לא קריטי
    }
    cleanupLocalStream();
    onClose();
  };

  if (!open) return null;

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

        {/* גוף – וידאו כפול */}
        <div className="flex flex-1 flex-col gap-3 p-4 md:flex-row">
          {/* הצד השני */}
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

          {/* אני */}
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

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (!localStream) return;
                  const vTrack = localStream
                    .getVideoTracks()
                    .find((t) => t.kind === "video");
                  if (!vTrack) return;
                  vTrack.enabled = !vTrack.enabled;
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

            {error && (
              <div className="mt-2 text-xs text-red-400">שגיאה: {error}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
