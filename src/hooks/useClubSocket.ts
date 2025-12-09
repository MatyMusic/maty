// src/hooks/useClubSocket.ts
"use client";

import type {
  ClubSocketAiHintPayload,
  ClubSocketFeedEventPayload,
  ClubSocketInbound,
  ClubSocketLiveItem,
  ClubSocketOutbound,
  ClubSocketPresencePayload,
  ClubSocketStatus,
} from "@/lib/club/socket-types";
import { useCallback, useEffect, useRef, useState } from "react";

type UseClubSocketOpts = {
  page?: "club" | "music" | "fit" | "date" | "jam" | "home" | "other";
  userId?: string | null;
  displayName?: string | null;
  areaName?: string | null;
  autoConnect?: boolean;
};

type UseClubSocketState = {
  status: ClubSocketStatus;
  lastError: string | null;
  lastMessage: ClubSocketInbound | null;
  presence: ClubSocketPresencePayload | null;
  liveItems: ClubSocketLiveItem[];
  liveUpdatedAt: Date | null;
  aiHints: ClubSocketAiHintPayload[];
  lastFeedEvents: ClubSocketFeedEventPayload[];
};

export function useClubSocket({
  page = "club",
  userId = null,
  displayName = null,
  areaName = null,
  autoConnect = true,
}: UseClubSocketOpts): UseClubSocketState & {
  connect: () => void;
  disconnect: () => void;
  send: (msg: ClubSocketOutbound) => void;
} {
  const [status, setStatus] = useState<ClubSocketStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<ClubSocketInbound | null>(
    null,
  );
  const [presence, setPresence] = useState<ClubSocketPresencePayload | null>(
    null,
  );
  const [liveItems, setLiveItems] = useState<ClubSocketLiveItem[]>([]);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState<Date | null>(null);
  const [aiHints, setAiHints] = useState<ClubSocketAiHintPayload[]>([]);
  const [lastFeedEvents, setLastFeedEvents] = useState<
    ClubSocketFeedEventPayload[]
  >([]);

  const wsRef = useRef<WebSocket | null>(null);
  const shouldConnectRef = useRef<boolean>(autoConnect);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current != null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const safeClose = () => {
    try {
      wsRef.current?.close();
    } catch {
      // ignore
    }
    wsRef.current = null;
  };

  const send = useCallback((msg: ClubSocketOutbound) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    try {
      ws.send(JSON.stringify(msg));
    } catch (e) {
      console.warn("[CLUB.SOCKET] send error:", e);
    }
  }, []);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    shouldConnectRef.current = true;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    clearReconnectTimeout();

    let wsUrl: string;
    const envUrl = process.env.NEXT_PUBLIC_CLUB_WS_URL;
    if (envUrl && envUrl.startsWith("ws")) {
      wsUrl = envUrl;
    } else {
      const { protocol, host } = window.location;
      const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${wsProtocol}//${host}/api/club/socket`;
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setStatus("connecting");
      setLastError(null);

      ws.onopen = () => {
        setStatus("open");
        setLastError(null);

        const helloMsg: ClubSocketOutbound = {
          kind: "hello",
          payload: {
            userId: userId || null,
            displayName: displayName || null,
            areaName: areaName || null,
            page,
            locale:
              typeof navigator !== "undefined"
                ? navigator.language || "he-IL"
                : "he-IL",
          },
        };
        try {
          ws.send(JSON.stringify(helloMsg));
        } catch (e) {
          console.warn("[CLUB.SOCKET] hello send error:", e);
        }

        const pingMsg: ClubSocketOutbound = {
          kind: "ping",
          payload: { t: Date.now() },
        };
        try {
          ws.send(JSON.stringify(pingMsg));
        } catch (e) {
          console.warn("[CLUB.SOCKET] ping send error:", e);
        }

        const subscribeLiveMsg: ClubSocketOutbound = {
          kind: "subscribe_live",
          payload: {},
        };
        try {
          ws.send(JSON.stringify(subscribeLiveMsg));
        } catch (e) {
          console.warn("[CLUB.SOCKET] subscribe_live send error:", e);
        }
      };

      ws.onmessage = (ev) => {
        let msg: ClubSocketInbound | null = null;
        try {
          msg = JSON.parse(ev.data);
        } catch (e) {
          console.warn("[CLUB.SOCKET] json parse error:", e, ev.data);
          return;
        }

        if (!msg) return;
        setLastMessage(msg);

        if (msg.kind === "presence") {
          setPresence(msg.payload);
        } else if (msg.kind === "live_list") {
          setLiveItems(msg.payload.items || []);
          setLiveUpdatedAt(new Date());
        } else if (msg.kind === "ai_hint") {
          setAiHints((prev) => {
            const next = [msg!.payload, ...prev];
            return next.slice(0, 10);
          });
        } else if (msg.kind === "feed_event") {
          setLastFeedEvents((prev) => {
            const next = [msg!.payload, ...prev];
            return next.slice(0, 20);
          });
        } else if (msg.kind === "hello_ack") {
          if (!msg.payload.ok) {
            setLastError(msg.payload.message || "שגיאה בהתחברות לסוקט");
          }
        }
      };

      ws.onerror = (ev) => {
        console.warn("[CLUB.SOCKET] onerror", ev);
        setStatus("error");
        setLastError("שגיאה בחיבור לסוקט (onerror)");
      };

      ws.onclose = () => {
        wsRef.current = null;
        setStatus("closed");
        if (shouldConnectRef.current) {
          clearReconnectTimeout();
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, 4000);
        }
      };
    } catch (e: any) {
      console.error("[CLUB.SOCKET] connect error:", e);
      setStatus("error");
      setLastError(e?.message || "שגיאה בפתיחת חיבור סוקט");
    }
  }, [page, userId, displayName, areaName, send]);

  const disconnect = useCallback(() => {
    shouldConnectRef.current = false;
    clearReconnectTimeout();
    safeClose();
    setStatus("closed");
  }, []);

  useEffect(() => {
    if (!autoConnect) return;
    connect();
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const helloMsg: ClubSocketOutbound = {
      kind: "hello",
      payload: {
        userId: userId || null,
        displayName: displayName || null,
        areaName: areaName || null,
        page,
        locale:
          typeof navigator !== "undefined"
            ? navigator.language || "he-IL"
            : "he-IL",
      },
    };
    try {
      wsRef.current.send(JSON.stringify(helloMsg));
    } catch (e) {
      console.warn("[CLUB.SOCKET] hello re-send error:", e);
    }
  }, [userId, displayName, areaName, page]);

  return {
    status,
    lastError,
    lastMessage,
    presence,
    liveItems,
    liveUpdatedAt,
    aiHints,
    lastFeedEvents,
    connect,
    disconnect,
    send,
  };
}
