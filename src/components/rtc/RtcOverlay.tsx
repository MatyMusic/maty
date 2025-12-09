// src/components/rtc/RtcOverlay.tsx
"use client";

import { useRtcRoom } from "@/hooks/useRtcRoom";
import {
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  PhoneOff,
  Video,
  X,
} from "lucide-react";
import * as React from "react";

/**
 * אוברליי RTC גלובלי:
 * - מאזין ל־mm:rtc:open (דרך useRtcRoom(autoListenEvents:true))
 * - מציג מצלמה מקומית (וידאו חי)
 * - אפשר למזער / להגדיל / לנתק
 * - future: חיבור לסטרים מרוחק / WebRTC מלא
 */
export default function RtcOverlay() {
  const {
    status,
    error,
    roomId,
    peerId,
    localVideoRef,
    // remoteVideoRef, // לעתיד
    endCall,
    setError,
  } = useRtcRoom({ autoListenEvents: true });

  const [collapsed, setCollapsed] = React.useState(false);
  const [micOn, setMicOn] = React.useState(true);
  const [camOn, setCamOn] = React.useState(true);

  // אם אין שיחה ואין שגיאה – לא מציג כלום
  const isActive =
    status === "connecting" ||
    status === "in-call" ||
    status === "error" ||
    status === "ended";

  if (!isActive && !error) return null;

  const title =
    status === "connecting"
      ? "מתחבר לשיחה..."
      : status === "in-call"
        ? "שיחת JAM 1 על 1"
        : status === "ended"
          ? "השיחה הסתיימה"
          : status === "error"
            ? "שגיאת RTC"
            : "מצב שיחה";

  function handleHangup() {
    endCall();
  }

  function handleCloseError() {
    setError(null);
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[120] flex flex-col items-start gap-2">
      {/* בועת שגיאה (אם יש) */}
      {error && (
        <div className="pointer-events-auto mb-1 max-w-xs rounded-2xl border border-red-500/70 bg-red-900/80 px-3 py-2 text-[11px] text-red-50 shadow-lg">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-semibold">שגיאת RTC</span>
            <button
              type="button"
              onClick={handleCloseError}
              className="rounded-full p-0.5 text-red-100 hover:bg-red-800/70"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="whitespace-pre-wrap">{error}</div>
        </div>
      )}

      {/* חלון השיחה */}
      <div
        className={[
          "pointer-events-auto overflow-hidden rounded-2xl border border-slate-700/90 bg-slate-950/95 text-slate-50 shadow-[0_18px_50px_rgba(15,23,42,0.9)] transition-all",
          collapsed ? "h-10 w-64" : "h-64 w-80",
        ].join(" ")}
      >
        {/* בר עליון */}
        <div className="flex h-10 items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/90 px-3 text-[11px]">
          <div className="flex flex-col">
            <span className="font-semibold">{title}</span>
            {(roomId || peerId) && (
              <span className="text-[10px] text-slate-400">
                {peerId ? `peer: ${peerId}` : ""}
                {peerId && roomId ? " • " : ""}
                {roomId ? `room: ${roomId}` : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="rounded-full p-1 text-slate-300 hover:bg-slate-800/90"
            >
              {collapsed ? (
                <Maximize2 className="h-3 w-3" />
              ) : (
                <Minimize2 className="h-3 w-3" />
              )}
            </button>
            <button
              type="button"
              onClick={handleHangup}
              className="rounded-full p-1 text-red-300 hover:bg-red-700/90"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="flex h-[216px] flex-col">
            {/* אזור וידאו */}
            <div className="relative flex-1 border-b border-slate-800/80 bg-gradient-to-br from-slate-900 to-black">
              {/* וידאו מקומי */}
              <video
                ref={localVideoRef}
                className="h-full w-full rounded-none object-cover"
                playsInline
                autoPlay
                muted
              />

              {/* overlay מצב */}
              <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-1 text-[10px] text-slate-200">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {status === "connecting"
                    ? "מתחבר..."
                    : status === "in-call"
                      ? "מחובר"
                      : status === "ended"
                        ? "הסתיים"
                        : status === "error"
                          ? "שגיאה"
                          : "מוכן"}
                </span>
              </div>
            </div>

            {/* כפתורי שליטה */}
            <div className="flex h-12 items-center justify-between gap-2 bg-slate-950/95 px-3 text-[11px]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMicOn((v) => !v)}
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                    micOn
                      ? "border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-400"
                      : "border-red-500/80 bg-red-800/80 text-red-50",
                  ].join(" ")}
                >
                  {micOn ? (
                    <Mic className="h-4 w-4" />
                  ) : (
                    <MicOff className="h-4 w-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCamOn((v) => !v)}
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                    camOn
                      ? "border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-400"
                      : "border-yellow-500/80 bg-yellow-700/80 text-yellow-50",
                  ].join(" ")}
                >
                  <Video className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleHangup}
                className="flex items-center gap-1 rounded-full border border-red-500 bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-red-700"
              >
                <PhoneOff className="h-3 w-3" />
                נתק
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
