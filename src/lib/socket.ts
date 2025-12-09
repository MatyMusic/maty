// src/lib/socket.ts
"use client";

import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";

let cached: Promise<Socket> | null = null;

// אפשר לשים גם ב-.env
const FALLBACK_PORTS = ["4003", "4002", "4001"];
const SOCKET_PATH = "/socket.io";

export async function getSocket(): Promise<Socket> {
  if (cached) return cached;

  cached = new Promise<Socket>((resolve, reject) => {
    const tried: string[] = [];
    const origin = window.location.origin;

    const saved = window.localStorage.getItem("maty:socket:url") || "";
    const candidates = [
      saved,
      origin,
      ...FALLBACK_PORTS.map((p) => `http://localhost:${p}`),
    ].filter(Boolean);

    function tryNext(i: number) {
      if (i >= candidates.length) {
        return reject(new Error("Socket connect failed: " + tried.join(" | ")));
      }

      const url = candidates[i];
      tried.push(url);

      const s = io(url, {
        path: SOCKET_PATH,
        transports: ["websocket"],
        autoConnect: false,
      });

      const timer = window.setTimeout(() => {
        s.disconnect();
        tryNext(i + 1);
      }, 2500);

      s.once("connect", () => {
        window.clearTimeout(timer);
        try {
          window.localStorage.setItem("maty:socket:url", url);
        } catch {}
        resolve(s);
      });

      s.once("connect_error", () => {
        window.clearTimeout(timer);
        s.disconnect();
        tryNext(i + 1);
      });

      s.connect();
    }

    tryNext(0);
  });

  return cached;
}
