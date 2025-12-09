// src/app/(community)/farbrengen/[roomId]/page.tsx
"use client";
import * as React from "react";
import { useParams } from "next/navigation";

type Msg = { _id: string; userId: string; text: string; at: string };

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [title, setTitle] = React.useState("התוועדות");
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [text, setText] = React.useState("");
  const boxRef = React.useRef<HTMLDivElement>(null);

  async function load() {
    const r = await fetch(`/api/farbrengen/rooms/${roomId}/messages`, {
      cache: "no-store",
    });
    const j = await r.json().catch(() => null);
    if (j?.ok) setMsgs(j.items || []);
    setTimeout(
      () =>
        boxRef.current &&
        (boxRef.current.scrollTop = boxRef.current.scrollHeight),
      0,
    );
  }
  async function send() {
    const t = text.trim();
    if (!t) return;
    setText("");
    await fetch(`/api/farbrengen/rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t }),
    });
    load();
  }

  React.useEffect(() => {
    load();
    const id = setInterval(load, 2500); // אפשר להחליף לסוקט בהמשך
    return () => clearInterval(id);
  }, [roomId]);

  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-gradient-to-b from-violet-50 to-pink-50 dark:from-neutral-950 dark:to-neutral-900"
    >
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/70 backdrop-blur border-b border-black/10 dark:border-white/10">
        <div className="mx-auto max-w-3xl p-3">
          <h1 className="text-xl font-bold">{title}</h1>
          <div className="text-xs opacity-70">
            כללי צניעות והתנהגות חלים תמיד.
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl p-3">
        <div
          ref={boxRef}
          className="h-[calc(100dvh-220px)] overflow-y-auto bg-white/70 dark:bg-neutral-900/60 rounded-xl p-3 space-y-2"
        >
          {msgs.map((m) => (
            <div key={m._id} className="mm-bubble">
              {m.text}
            </div>
          ))}
          {msgs.length === 0 && (
            <div className="text-sm opacity-60">
              עדיין אין הודעות. פתחו את הדיון! ✨
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            className="mm-input input-rtl flex-1"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="כתבו הודעה…"
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button className="mm-btn mm-btn-primary" onClick={send}>
            שלח
          </button>
        </div>
      </section>
    </main>
  );
}
