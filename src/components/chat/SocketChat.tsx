// src/components/chat/SocketChat.tsx
"use client";

import { getSocket } from "@/lib/socket";
import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

type ChatMessage = {
  id: string;
  name: string;
  text: string;
  ts: number;
  fromMe?: boolean;
};

const SOCKET_FALLBACK_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4001";

export default function SocketChat() {
  const sockRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [me, setMe] = useState<{ id?: string; nickname?: string }>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // התחברות ל-socket.io
  useEffect(() => {
    if (sockRef.current) return;

    (async () => {
      try {
        // ניסיון עם getSocket (auto-detect) ואם לא עובד – נופלים ל-URL קבוע
        let s: Socket;
        try {
          s = await getSocket();
        } catch {
          s = (await import("socket.io-client")).io(SOCKET_FALLBACK_URL, {
            transports: ["websocket"],
          });
        }

        sockRef.current = s;

        s.on("connect", () => setConnected(true));
        s.on("disconnect", () => setConnected(false));

        s.on("server:welcome", (payload: { id: string; nickname: string }) => {
          setMe({ id: payload.id, nickname: payload.nickname });
          setName(payload.nickname);
        });

        s.on("server:nameSet", (nick: string) => {
          setMe((prev) => ({ ...prev, nickname: nick }));
        });

        s.on("server:message", (msg: ChatMessage) => {
          setMessages((prev) =>
            [...prev, msg].sort((a, b) => a.ts - b.ts).slice(-200),
          );
        });

        s.on(
          "server:leave",
          (info: { id: string; name: string; ts: number }) => {
            const sysMsg: ChatMessage = {
              id: `leave-${info.id}-${info.ts}`,
              name: info.name || "מערכת",
              text: "עזב את הצ׳אט",
              ts: info.ts,
            };
            setMessages((prev) => [...prev, sysMsg].slice(-200));
          },
        );
      } catch (e) {
        console.error("Socket init error", e);
      }
    })();

    return () => {
      sockRef.current?.disconnect();
      sockRef.current = null;
    };
  }, []);

  const sendMessage = () => {
    const t = text.trim();
    if (!t || !sockRef.current) return;
    sockRef.current.emit("client:message", t);
    setText("");
  };

  const saveName = () => {
    const n = name.trim();
    if (!n || !sockRef.current) return;
    sockRef.current.emit("client:setName", n);
  };

  async function suggestWithAI() {
    const lastMessages = messages.slice(-10);
    setAiLoading(true);
    try {
      // אתה יוצר route כזה לבד: /api/ai/chat-suggest
      const res = await fetch("/api/ai/chat-suggest", {
        method: "POST",
        body: JSON.stringify({ history: lastMessages }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("AI failed");
      const data = await res.json();
      if (data?.suggestion) {
        setText(data.suggestion);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              connected ? "bg-emerald-500" : "bg-amber-400 animate-pulse"
            }`}
          />
          <span className="text-sm opacity-80">
            {connected ? "מחובר לחדר הצ׳אט" : "מנסה להתחבר לצ׳אט…"}
          </span>
        </div>
        <div className="text-xs sm:text-sm opacity-80">
          אני:{" "}
          <span className="font-semibold">
            {me.nickname || "בלי כינוי עדיין"}
          </span>
        </div>
      </div>

      {/* שינוי כינוי */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
        <div className="text-xs font-semibold opacity-80 mb-2">כינוי בצ׳אט</div>
        <div className="mt-1 flex gap-2">
          <input
            className="input-base input-rtl flex-1"
            placeholder="כינוי..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
          />
          <button className="btn" onClick={saveName}>
            שמור כינוי
          </button>
        </div>
      </div>

      {/* רשימת הודעות */}
      <div className="h-[50vh] overflow-y-auto rounded-2xl border border-black/10 dark:border-white/10 p-3 bg-gradient-to-b from-white/80 to-white/50 dark:from-neutral-900/80 dark:to-neutral-900/50 backdrop-blur">
        {messages.length === 0 ? (
          <div className="text-center opacity-70 mt-10 text-sm">
            אין הודעות עדיין… תהיה הראשון לשבור את הקרח 🧊
          </div>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => {
              const mine = m.name === me.nickname;
              const key = `${m.id}-${m.ts}`;
              return (
                <li
                  key={key}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      mine
                        ? "bg-pink-600 text-white rounded-br-sm"
                        : "bg-black/5 dark:bg-white/10 rounded-bl-sm"
                    }`}
                  >
                    <div className="text-[11px] font-semibold opacity-80 mb-0.5">
                      {m.name}
                    </div>
                    <div dir="auto">{m.text}</div>
                    <div className="text-[10px] opacity-60 mt-1 text-right">
                      {new Date(m.ts).toLocaleTimeString()}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* אינפוט + AI */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1 flex gap-2">
          <input
            className="input-base input-rtl flex-1"
            placeholder="כתוב הודעה… Enter לשליחה"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            maxLength={500}
          />
          <button className="btn" onClick={sendMessage}>
            שלח
          </button>
        </div>
        <button
          type="button"
          onClick={suggestWithAI}
          disabled={aiLoading}
          className="text-xs sm:text-sm rounded-xl border border-dashed px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
        >
          {aiLoading ? "חושב עבורך…" : "תן לי הצעת תשובה עם AI 🤖"}
        </button>
      </div>
    </div>
  );
}
