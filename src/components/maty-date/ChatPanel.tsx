// src/components/maty-date/ChatPanel.tsx
"use client";

import { dmRoomId } from "@/lib/date/room-id";
import * as React from "react";

type ChatMsg = {
  id: string;
  type: "chat";
  room: string;
  from: string;
  text: string;
  ts: number;
};

export default function ChatPanel({
  meId,
  otherId,
}: {
  meId: string;
  otherId: string;
}) {
  const room = dmRoomId(meId, otherId);
  const [ws, setWs] = React.useState<WebSocket | null>(null);
  const [msgs, setMsgs] = React.useState<ChatMsg[]>([]);
  const [text, setText] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);

  React.useEffect(() => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${location.host}/api/ws?room=${encodeURIComponent(
      room,
    )}&user=${encodeURIComponent(meId)}`;
    const sock = new WebSocket(url);
    setWs(sock);

    sock.onmessage = (e) => {
      try {
        const msg = JSON.parse(String(e.data));
        if (msg.type === "chat" && msg.room === room) {
          const withId: ChatMsg = {
            ...msg,
            id:
              msg.id ||
              `${msg.room}-${msg.from}-${msg.ts}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,
          };
          setMsgs((m) => [...m, withId]);
        }
      } catch {}
    };
    return () => sock.close();
  }, [room, meId]);

  function send() {
    const t = text.trim();
    if (!t || !ws || ws.readyState !== ws.OPEN) return;
    const msg: ChatMsg = {
      id: `${room}-${meId}-${Date.now()}`,
      type: "chat",
      room,
      from: meId,
      text: t,
      ts: Date.now(),
    };
    ws.send(JSON.stringify(msg));
    setText("");
  }

  async function suggestWithAI() {
    const lastMsgs = msgs.slice(-10);
    setAiLoading(true);
    try {
      // תוסיף route מתאים: /api/ai/date-suggest
      const res = await fetch("/api/ai/date-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meId,
          otherId,
          history: lastMsgs,
        }),
      });
      if (!res.ok) throw new Error("AI failed");
      const data = await res.json();
      if (data?.suggestion) setText(data.suggestion);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">צ’אט היכרות</div>
        <div className="text-[11px] opacity-70">
          חדר: <span className="font-mono">{room}</span>
        </div>
      </div>

      <div className="h-56 overflow-auto rounded-xl border bg-white/70 dark:bg-neutral-900/60 p-2 text-sm">
        {msgs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs opacity-70">
            עדיין אין הודעות… כתוב/י משהו נחמד לשבירת הקרח 🧊
          </div>
        ) : (
          msgs.map((m) => {
            const mine = m.from === meId;
            const key = `${m.id}-${m.ts}`;
            return (
              <div
                key={key}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] my-1 px-3 py-1.5 rounded-2xl shadow-sm ${
                    mine
                      ? "bg-pink-600 text-white rounded-br-sm"
                      : "bg-black/5 dark:bg-white/10 rounded-bl-sm"
                  }`}
                >
                  <div dir="auto">{m.text}</div>
                  <div className="text-[10px] opacity-70 mt-0.5 text-right">
                    {new Date(m.ts).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="כתוב/י הודעה…"
            className="flex-1 h-10 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
          />
          <button
            onClick={send}
            className="h-10 px-4 rounded-xl font-semibold bg-pink-600 text-white hover:bg-pink-700"
          >
            שלח
          </button>
        </div>
        <button
          type="button"
          onClick={suggestWithAI}
          disabled={aiLoading}
          className="h-10 px-3 rounded-xl border border-dashed text-xs sm:text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
        >
          {aiLoading ? "AI חושב…" : "תן לי רעיון לפתיחה/תגובה 🤖"}
        </button>
      </div>
    </div>
  );
}
