// src/components/club/ChatDock.tsx
"use client";
import * as React from "react";
import { Msg } from "@/lib/club/types";

/**
 * ChatDock — צ'אט קומפקטי עם פולינג חכם, RTL, וניהול גלילה לתחתית.
 * - נעצר כש-tab לא נראה (document.visibilityState)
 * - merge + sort לפי זמן, החלפת temp message עם זו שחוזרת מהשרת
 */
export default function ChatDock() {
  const [open, setOpen] = React.useState(false);
  const [peer, setPeer] = React.useState("");
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [text, setText] = React.useState("");
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  const lastAtRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    lastAtRef.current = msgs[msgs.length - 1]?.at;
  }, [msgs]);

  const scrollToBottom = React.useCallback(() => {
    queueMicrotask(() => {
      const el = scrollerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  async function load({ after }: { after?: string } = {}) {
    if (!peer) return;
    const qs = new URLSearchParams({ limit: "120" });
    if (after) qs.set("after", after);

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    try {
      const res = await fetch(
        `/api/date/chat/${encodeURIComponent(peer)}?${qs}`,
        { cache: "no-store", signal: ctrl.signal },
      );
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) return;

      setMsgs((prev) => {
        const merged = after ? [...prev, ...(j.items || [])] : j.items || [];
        const map = new Map(merged.map((m: Msg) => [m.id, m]));
        const arr = Array.from(map.values()).sort(
          (a, b) => +new Date(a.at) - +new Date(b.at),
        );
        scrollToBottom();
        return arr;
      });
    } catch {
      /* ignore */
    } finally {
      clearTimeout(t);
    }
  }

  async function send() {
    const t = text.trim();
    if (!peer || !t) return;
    setText("");
    const tempId = "tmp-" + Math.random().toString(36).slice(2);
    const now = new Date().toISOString();
    setMsgs((p) => [...p, { id: tempId, fromMe: true, text: t, at: now }]);
    scrollToBottom();
    try {
      const res = await fetch(`/api/date/chat/${encodeURIComponent(peer)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error();
      setMsgs((p) => p.map((m) => (m.id === tempId ? j.item : m)));
      scrollToBottom();
    } catch {
      setMsgs((p) =>
        p.map((m) =>
          m.id === tempId ? { ...m, text: m.text + " (נכשל)" } : m,
        ),
      );
    }
  }

  React.useEffect(() => {
    if (!open || !peer) return;
    let timer: number | null = null;
    let stopped = false;

    const tick = async () => {
      if (stopped) return;
      if (document.visibilityState !== "visible") {
        timer = window.setTimeout(tick, 2500);
        return;
      }
      await load({ after: lastAtRef.current });
      timer = window.setTimeout(tick, 2500);
    };

    load().then(() => {
      timer = window.setTimeout(tick, 2500);
    });

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, peer]);

  return (
    <>
      <button
        className="fixed bottom-24 right-4 h-12 w-12 rounded-full bg-violet-600 text-white grid place-items-center shadow-card"
        onClick={() => setOpen((v) => !v)}
        title="צ׳אט"
        aria-label="פתח/סגור צ׳אט"
      >
        💬
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-4 w-[min(90vw,360px)] rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur shadow-xl overflow-hidden"
          dir="rtl"
        >
          <div className="p-3 border-b border-black/10 dark:border-white/10 flex items-center gap-2">
            <div className="font-semibold">צ׳אט מהיר</div>
            <div className="ml-auto text-xs opacity-70">מזהה משתמש יעד</div>
          </div>

          <div className="p-3 flex gap-2">
            <input
              className="mm-input input-rtl flex-1"
              placeholder="userId"
              value={peer}
              onChange={(e) => setPeer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
            <button className="mm-btn" onClick={() => load()}>
              פתח
            </button>
            {!!peer && (
              <a
                className="mm-btn"
                href={`/date/chat/${encodeURIComponent(peer)}`}
                title="פתח עמוד מלא"
              >
                עמוד
              </a>
            )}
          </div>

          <div
            ref={scrollerRef}
            className="px-3 pb-3 h-60 overflow-y-auto space-y-2"
          >
            {msgs.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-2xl px-3 py-2 text-sm max-w-[78%] ${
                    m.fromMe
                      ? "bg-violet-600 text-white"
                      : "bg-black/5 dark:bg-white/10"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {msgs.length === 0 && (
              <div className="text-xs opacity-60">אין הודעות עדיין.</div>
            )}
          </div>

          <div className="p-3 border-t border-black/10 dark:border-white/10 flex gap-2">
            <input
              className="mm-input input-rtl flex-1"
              placeholder="כתוב הודעה…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button className="mm-btn mm-btn-primary" onClick={send}>
              שלח
            </button>
          </div>
        </div>
      )}
    </>
  );
}
