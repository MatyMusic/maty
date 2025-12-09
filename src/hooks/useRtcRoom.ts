// src/hooks/useRtcRoom.ts
"use client";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";

export type RtcStatus = "idle" | "connecting" | "connected" | "error";

export type UseRtcRoomOpts = {
  roomId: string | null; // מזהה החדר – למשל _id של LiveSession
  meId: string | null; // מזהה המשתמש שלי
  peerId: string | null; // המשתמש בצד השני (לא חובה, אבל מומלץ)
  role?: "caller" | "callee" | "auto";
  localStream: MediaStream | null; // הוידאו/אודיו שלך
  remoteVideoRef: RefObject<HTMLVideoElement>; // וידאו של הצד השני
  debug?: boolean; // לוגים לדיבוג
};

export type UseRtcRoomResult = {
  status: RtcStatus;
  error: string | null;
  connect: (forcedRole?: "caller" | "callee") => Promise<void>;
  hangup: () => Promise<void>;
  isCaller: boolean;
  isCallee: boolean;
  isBusy: boolean;
  remoteStream: MediaStream | null;
};

type SignalItem = {
  _id: string;
  roomId: string;
  fromUserId: string;
  toUserId: string | null;
  kind: "offer" | "answer" | "candidate" | "bye" | "ring";
  payload: any;
  createdAt: string;
};

type SignalResponse = {
  ok: boolean;
  now?: number;
  items?: SignalItem[];
  error?: string;
};

export function useRtcRoom(opts: UseRtcRoomOpts): UseRtcRoomResult {
  const { roomId, meId, peerId, localStream, remoteVideoRef, debug } = opts;
  const roleOpt = opts.role ?? "auto";

  const [status, setStatus] = useState<RtcStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTsRef = useRef<number>(0);
  const roleRef = useRef<"caller" | "callee">("caller");

  const log = (...args: any[]) => {
    if (debug) {
      // eslint-disable-next-line no-console
      console.log("[RTC]", ...args);
    }
  };

  const isCaller = roleRef.current === "caller";
  const isCallee = roleRef.current === "callee";
  const isBusy = status === "connecting" || status === "connected";

  // מחבר סטרים רחוק לוידאו
  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el) return;
    if (remoteStream) {
      if (el.srcObject !== remoteStream) {
        el.srcObject = remoteStream;
      }
    } else {
      if (el.srcObject) {
        el.srcObject = null;
      }
    }
  }, [remoteStream, remoteVideoRef]);

  const cleanupPc = useCallback(() => {
    const pc = pcRef.current;
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      try {
        pc.close();
      } catch {
        // ignore
      }
    }
    pcRef.current = null;
    setRemoteStream(null);
    setStatus("idle");
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const sendSignal = useCallback(
    async (kind: "offer" | "answer" | "candidate" | "bye", payload: any) => {
      if (!roomId || !meId) return;
      try {
        const res = await fetch("/api/rtc/signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            kind,
            payload,
            toUserId: peerId ?? null,
          }),
        });
        const data = (await res.json()) as SignalResponse;
        if (!data.ok) {
          throw new Error(data.error || "signal_failed");
        }
        log("sendSignal ok", kind);
      } catch (e: any) {
        log("sendSignal error", e?.message || e);
        setError(e?.message || "signal_error");
      }
    },
    [roomId, meId, peerId, log],
  );

  const ensurePc = useCallback((): RTCPeerConnection | null => {
    if (!roomId || !meId) return null;
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        // כאן בעתיד אפשר להכניס TURN פרטי
      ],
    });

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        log("ICE candidate", event.candidate);
        await sendSignal("candidate", event.candidate);
      }
    };

    pc.ontrack = (event) => {
      log("ontrack", event.streams);
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
      }
    };

    // מוסיף את כל הטרקים של localStream
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pcRef.current = pc;
    return pc;
  }, [roomId, meId, localStream, sendSignal, log]);

  const handleIncomingSignal = useCallback(
    async (item: SignalItem) => {
      const pc = ensurePc();
      if (!pc) return;

      switch (item.kind) {
        case "offer": {
          if (!isCallee && roleOpt !== "auto") return;
          roleRef.current = "callee";
          log("got offer");
          setStatus("connecting");
          await pc.setRemoteDescription(
            new RTCSessionDescription(item.payload),
          );
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal("answer", answer);
          break;
        }
        case "answer": {
          if (!isCaller && roleOpt !== "auto") return;
          log("got answer");
          await pc.setRemoteDescription(
            new RTCSessionDescription(item.payload),
          );
          setStatus("connected");
          break;
        }
        case "candidate": {
          if (!item.payload) return;
          try {
            await pc.addIceCandidate(new RTCIceCandidate(item.payload));
          } catch (e) {
            log("addIceCandidate error", e);
          }
          break;
        }
        case "bye": {
          log("got bye");
          cleanupPc();
          break;
        }
        default:
          break;
      }
    },
    [ensurePc, sendSignal, cleanupPc, log, roleOpt, isCaller, isCallee],
  );

  const pollSignals = useCallback(async () => {
    if (!roomId || !meId) return;
    try {
      const res = await fetch(
        `/api/rtc/signal?roomId=${encodeURIComponent(
          roomId,
        )}&since=${lastTsRef.current || 0}`,
        { method: "GET", cache: "no-store" },
      );
      const data = (await res.json()) as SignalResponse;
      if (!data.ok) {
        log("pollSignals error", data.error);
        return;
      }
      const now = data.now ?? Date.now();
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const ts = new Date(item.createdAt).getTime();
          if (ts > lastTsRef.current) {
            lastTsRef.current = ts;
          }
          // לא מעבדים סיגנלים ששלחנו לעצמנו
          if (item.fromUserId === meId) continue;
          await handleIncomingSignal(item);
        }
      } else {
        lastTsRef.current = Math.max(lastTsRef.current, now);
      }
    } catch (e: any) {
      log("pollSignals fetch error", e?.message || e);
    }
  }, [roomId, meId, handleIncomingSignal, log]);

  const connect = useCallback(
    async (forcedRole?: "caller" | "callee") => {
      setError(null);

      if (!roomId || !meId) {
        setError("missing_room_or_user");
        return;
      }
      if (!localStream) {
        setError("missing_local_stream");
        return;
      }

      const effectiveRole =
        forcedRole || roleOpt || ("caller" as "caller" | "callee");
      roleRef.current = effectiveRole;

      const pc = ensurePc();
      if (!pc) {
        setError("pc_not_available");
        return;
      }

      if (effectiveRole === "caller") {
        try {
          setStatus("connecting");
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await sendSignal("offer", offer);
        } catch (e: any) {
          setError(e?.message || "offer_error");
          setStatus("error");
          return;
        }
      } else {
        // callee – מחכה ל־offer בפולינג
        setStatus("connecting");
      }

      if (!pollTimerRef.current) {
        // מתחילים polling
        pollTimerRef.current = setInterval(() => {
          void pollSignals();
        }, 1500);
      }

      log("connect started, role =", effectiveRole);
    },
    [
      roomId,
      meId,
      localStream,
      roleOpt,
      ensurePc,
      sendSignal,
      pollSignals,
      log,
    ],
  );

  const hangup = useCallback(async () => {
    try {
      await sendSignal("bye", { reason: "user_hangup" });
    } catch {
      // לא נורא אם לא הצלחנו לשדר bye
    }
    stopPolling();
    cleanupPc();
  }, [sendSignal, stopPolling, cleanupPc]);

  // ניקוי בזמן unmount / שינוי roomId
  useEffect(() => {
    return () => {
      stopPolling();
      cleanupPc();
    };
  }, [stopPolling, cleanupPc]);

  // אם roomId/meId/localStream התחלפו – מאפסים state בסיסי
  useEffect(() => {
    setError(null);
    setStatus("idle");
    setRemoteStream(null);
    lastTsRef.current = 0;
  }, [roomId, meId]);

  return {
    status,
    error,
    connect,
    hangup,
    isCaller,
    isCallee,
    isBusy,
    remoteStream,
  };
}
