// src/components/rtc/RtcCallPanel.tsx
"use client";

import { useRtcRoom } from "@/hooks/useRtcRoom";
import * as React from "react";

type Props = {
  roomId: string | null; // מזהה החדר – שני הצדדים חייבים להשתמש באותו roomId
  meId: string | null; // מזהה המשתמש שלי (מה־session)
  peerId?: string | null; // לא חובה כרגע – אפשר להשאיר null
  title?: string; // כותרת לתצוגה
};

export default function RtcCallPanel({
  roomId,
  meId,
  peerId = null,
  title = "שיחת וידאו 1 על 1",
}: Props) {
  const [localStream, setLocalStream] = React.useState<MediaStream | null>(
    null,
  );
  const [camError, setCamError] = React.useState<string | null>(null);
  const [isCamOn, setIsCamOn] = React.useState(false);

  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement | null>(null);

  const { status, error, connect, hangup, isCaller, isCallee, isBusy } =
    useRtcRoom({
      roomId,
      meId,
      peerId,
      localStream,
      remoteVideoRef,
      role: "auto",
      debug: true,
    });

  // חיבור הסטרים המקומי לוידאו
  React.useEffect(() => {
    const el = localVideoRef.current;
    if (!el) return;
    if (localStream) {
      if (el.srcObject !== localStream) {
        el.srcObject = localStream;
      }
    } else if (el.srcObject) {
      el.srcObject = null;
    }
  }, [localStream]);

  // ניקוי סטרים מקומי ביציאה מהקומפוננטה
  React.useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setCamError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("הדפדפן לא תומך בגישה למצלמה/מיקרופון");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      setIsCamOn(true);
    } catch (e: any) {
      console.error("[RTC] getUserMedia error:", e);
      setCamError(e?.message || "שגיאה בהפעלת מצלמה/מיקרופון");
    }
  }

  function stopCamera() {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    setLocalStream(null);
    setIsCamOn(false);
  }

  async function handleConnectAsCaller() {
    if (!roomId) {
      alert("אין roomId – שני הצדדים חייבים להשתמש באותו roomId");
      return;
    }
    if (!localStream) {
      await startCamera();
    }
    await connect("caller");
  }

  async function handleConnectAsCallee() {
    if (!roomId) {
      alert("אין roomId – שני הצדדים חייבים להשתמש באותו roomId");
      return;
    }
    if (!localStream) {
      await startCamera();
    }
    await connect("callee");
  }

  async function handleHangup() {
    await hangup();
    stopCamera();
  }

  const statusLabel =
    status === "idle"
      ? "מנותק"
      : status === "connecting"
        ? "מתחבר…"
        : status === "connected"
          ? "מחובר"
          : "שגיאה";

  const statusColor =
    status === "connected"
      ? "bg-green-600"
      : status === "connecting"
        ? "bg-yellow-500"
        : status === "error"
          ? "bg-red-600"
          : "bg-gray-500";

  return (
    <div className="w-full rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4 text-slate-50 shadow-lg backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-slate-300">
            roomId:{" "}
            <span className="font-mono text-xs text-emerald-300">
              {roomId ?? "(אין)"}
            </span>
          </p>
          <p className="text-xs text-slate-400">
            אני:{" "}
            <span className="font-mono text-xs text-sky-300">
              {meId ?? "(לא מחובר)"}
            </span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}
          >
            <span className="h-2 w-2 rounded-full bg-white/80" />
            {statusLabel}
          </span>
          {error && (
            <span className="max-w-[240px] text-right text-[11px] text-red-300">
              {error}
            </span>
          )}
          {camError && (
            <span className="max-w-[240px] text-right text-[11px] text-red-300">
              {camError}
            </span>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {!isCamOn ? (
          <button
            type="button"
            onClick={startCamera}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
          >
            הפעל מצלמה + מיקרופון
          </button>
        ) : (
          <button
            type="button"
            onClick={stopCamera}
            className="rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-600"
          >
            כבה מצלמה/מיקרופון
          </button>
        )}

        <div className="mx-2 h-4 w-px bg-slate-600" />

        <button
          type="button"
          onClick={handleConnectAsCaller}
          disabled={!roomId || isBusy}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            !roomId || isBusy
              ? "cursor-not-allowed bg-slate-700/70 text-slate-400"
              : "bg-sky-600 hover:bg-sky-500"
          }`}
        >
          אני מתקשר (Caller)
        </button>

        <button
          type="button"
          onClick={handleConnectAsCallee}
          disabled={!roomId || isBusy}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            !roomId || isBusy
              ? "cursor-not-allowed bg-slate-700/70 text-slate-400"
              : "bg-violet-600 hover:bg-violet-500"
          }`}
        >
          אני עונה (Callee)
        </button>

        <button
          type="button"
          onClick={handleHangup}
          disabled={status === "idle"}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            status === "idle"
              ? "cursor-not-allowed bg-slate-800 text-slate-500"
              : "bg-red-600 hover:bg-red-500"
          }`}
        >
          ניתוק
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-300">
            וידאו מקומי (אתה)
          </span>
          <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-black">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-52 w-full bg-black object-cover"
            />
            {!isCamOn && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                המצלמה כבויה
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-300">
            וידאו נכנס (צד שני)
          </span>
          <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-black">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-52 w-full bg-black object-cover"
            />
            {status !== "connected" && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                מחכה לחיבור מהצד השני…
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        כדי לבדוק:
        <br />
        • פתח את אותו roomId בשני דפדפנים שונים (או מחשבים שונים).
        <br />• בצד אחד לחץ על &quot;אני מתקשר (Caller)&quot; ובשני על &quot;אני
        עונה (Callee)&quot;.
      </p>
    </div>
  );
}
