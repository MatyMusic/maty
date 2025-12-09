// src/components/assistant/AssistantPanel.tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type LinkCard = {
  title: string;
  href: string;
  subtitle?: string;
  external?: boolean;
};
type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string }
  | { id: string; role: "assistant"; text: string; links: LinkCard[] };

type Hint = {
  text: string;
  action: { type: "link" | "command"; value: string };
};

const STORAGE_KEY = "mm:assistant:messages";

export default function AssistantPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  /* ======================= State ======================= */
  const [mounted, setMounted] = React.useState(false);
  const [portalRoot, setPortalRoot] = React.useState<HTMLElement | null>(null);

  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [hints, setHints] = React.useState<Hint[]>([]);
  const [online, setOnline] = React.useState<number | null>(null);
  const [here, setHere] = React.useState<number | null>(null);

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  /* ================== Mount / Portal / Lock ================== */
  React.useEffect(() => {
    setMounted(true);
    setPortalRoot(document.body);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* ================== Restore / Persist chat ================== */
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {}
    const box = scrollRef.current;
    if (box) requestAnimationFrame(() => (box.scrollTop = box.scrollHeight));
  }, [messages]);

  /* ================== Focus / Hotkeys ================== */
  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) inputRef.current?.focus();
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  /* ================== Hints / Presence ================== */
  React.useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    (async () => {
      try {
        const path = window.location.pathname || "/";
        const r = await fetch("/api/assistant/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path }),
          signal: ac.signal,
        });
        const j = await r.json().catch(() => null);
        if (j?.ok) {
          if (Array.isArray(j.suggestions)) setHints(j.suggestions);
          if (typeof j.online === "number") setOnline(j.online);
          if (typeof j.here === "number") setHere(j.here);
        }
      } catch {}
    })();
    return () => ac.abort();
  }, [open]);

  /* ================== Tracking helpers ================== */
  function track(kind: string, meta?: Record<string, any>) {
    try {
      const anonId = getOrCreate("mm:anon", () => crypto.randomUUID());
      const sessionId = getSessionId();
      const payload = {
        ev: { kind, page: window.location.pathname, meta: meta || {} },
        anonId,
        sessionId,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      (navigator as any).sendBeacon?.(
        "/api/track",
        new Blob([JSON.stringify(payload)], { type: "application/json" }),
      );
    } catch {}
  }
  function getOrCreate(key: string, make: () => string) {
    const v = localStorage.getItem(key);
    if (v) return v;
    const nv = make();
    localStorage.setItem(key, nv);
    return nv;
  }
  function getSessionId() {
    const k = "mm:sid";
    const raw = sessionStorage.getItem(k);
    if (raw) return raw;
    const sid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(k, sid);
    return sid;
  }

  /* ================== Ask / Router / AI ================== */
  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", text: trimmed },
    ]);
    setQ("");
    track("assistant_query", { q: trimmed });

    try {
      // 1) Router מהיר – מחזיר תשובה/לינקים ללא AI
      const r1 = await fetch("/api/assistant/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: trimmed, path: window.location.pathname }),
      });
      const j1 = await r1.json().catch(() => null);
      if (j1?.ok && j1.type === "answer" && j1.answer) {
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), role: "assistant", text: j1.answer },
        ]);
        return;
      }
      if (
        j1?.ok &&
        j1.type === "links" &&
        Array.isArray(j1.links) &&
        j1.links.length
      ) {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: "מצאתי אפשרויות רלוונטיות:",
            links: j1.links as LinkCard[],
          },
        ]);
        return;
      }

      // 2) LLM fallback – /api/ai/ask
      const r2 = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: trimmed, history: messages.slice(-6) }),
      });
      const j2 = await r2.json().catch(() => ({}));
      if (!r2.ok || !j2?.ok) {
        const err =
          j2?.error === "missing_api_key"
            ? "אין מפתח API קיים. הוסף OPENAI_API_KEY או OPENROUTER_API_KEY."
            : "הייתה שגיאה זמנית. נסה שוב.";
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), role: "assistant", text: err },
        ]);
        return;
      }
      const a = (j2 && (j2.answer || j2.text)) || "קיבלתי!";
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: a },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "שגיאת רשת. בדוק חיבור/שרת.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function runHint(h: Hint) {
    if (h.action.type === "link") {
      window.location.href = h.action.value;
    } else {
      ask(h.action.value);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(q);
    }
  }

  function clearChat() {
    setMessages([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  /* ================== Render ================== */
  if (!mounted || !portalRoot) return null;
  if (!open) return null;

  return createPortal(
    <div
      className="assistant-portal fixed inset-0 z-[500]"
      role="dialog"
      aria-modal="true"
    >
      {/* רקע אטום-כהה (לא שקוף מדי) */}
      <div
        className="assistant-backdrop absolute inset-0 bg-black/45"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      />

      {/* פאנל – דסקטופ: מגירה מימין; מובייל: מסך מלא מלמטה */}
      <section
        dir="rtl"
        className="
          assistant-sheet
          absolute inset-y-0 right-0
          w-[min(92vw,420px)]
          bg-white dark:bg-neutral-950 text-slate-900 dark:text-slate-100
          border-l border-black/10 dark:border-white/10
          shadow-2xl
          flex flex-col
        "
        style={{ backdropFilter: "none" }} // אטימות מלאה – בלי blur על הפאנל
      >
        {/* Header */}
        <header className="px-3 py-2 border-b border-black/10 dark:border-white/10 flex items-center gap-2">
          <div className="text-sm font-bold">Assistant</div>
          {online != null && (
            <div className="ml-2 text-[12px] opacity-80">
              🟢 אונליין: {online}
            </div>
          )}
          {here != null && (
            <div className="text-[12px] opacity-60">• כאן: {here}</div>
          )}
          <div className="ml-auto" />
          <button
            type="button"
            onClick={clearChat}
            title="נקה שיחה"
            className="mm-chip h-8 px-3 text-xs"
          >
            נקה
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mm-chip h-8 px-3 text-xs font-semibold"
            title="סגור • MATY"
            aria-label="סגור את העוזר"
          >
            סגור • MATY
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mm-btn mm-pressable h-8 px-3"
            aria-label="סגור"
            title="סגור"
          >
            ✕
          </button>
        </header>

        {/* קלט מהיר */}
        <div className="p-3 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="שאל/י כל דבר… (Enter לשליחה, Shift+Enter לשורה חדשה, ⌘/Ctrl+K למיקוד)"
              className="flex-1 h-12 rounded-2xl px-4 border bg-white dark:bg-neutral-900 outline-none input-rtl"
            />
            <button
              className="h-12 px-4 rounded-2xl bg-brand text-white font-bold disabled:opacity-50"
              onClick={() => ask(q)}
              disabled={busy || !q.trim()}
            >
              {busy ? "…שולח" : "שאל"}
            </button>
          </div>

          {hints.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {hints.map((h, i) => (
                <button
                  key={i}
                  onClick={() => runHint(h)}
                  className="px-3 h-8 rounded-full text-xs border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 hover:bg-black/5 dark:hover:bg-white/10 transition"
                  type="button"
                >
                  {h.text}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* תמליל */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-3 pr-3 scrollbar-thin"
        >
          <div className="space-y-2">
            {messages.map((m) => {
              const isUser = m.role === "user";
              const hasLinks =
                !isUser && "links" in m && Array.isArray((m as any).links);
              return (
                <div
                  key={m.id}
                  className={`px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                    isUser
                      ? "bg-amber-100/70 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 ml-auto max-w-[85%]"
                      : "bg-black/5 dark:bg-white/10 mr-auto max-w-[90%]"
                  }`}
                  dir="rtl"
                >
                  {m.text}
                  {hasLinks && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(m as any).links.map((lnk: LinkCard, idx: number) => (
                        <a
                          key={idx}
                          href={lnk.href}
                          target={lnk.external ? "_blank" : "_self"}
                          rel={lnk.external ? "noopener noreferrer" : undefined}
                          className="block rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-3 hover:bg-white dark:hover:bg-neutral-800 transition"
                        >
                          <div className="font-semibold">{lnk.title}</div>
                          {lnk.subtitle && (
                            <div className="text-xs opacity-70 mt-0.5">
                              {lnk.subtitle}
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {!messages.length && (
              <div className="px-2 py-2 text-sm opacity-70">
                רמזים: “מצא לי ניגון חתונה”, “מה חדש ב־CLUB?”, “איך נרשמים
                ל־MATY-DATE?”
              </div>
            )}

            {busy && (
              <div className="px-3 py-2 rounded-xl text-sm bg-black/5 dark:bg-white/10 mr-auto max-w-[70%]">
                העוזר מקליד…
              </div>
            )}
          </div>
        </div>
      </section>

      {/* מובייל: מסך מלא/Sheet מלמטה */}
      <style>{`
        @media (max-width: 767px) {
          .assistant-sheet {
            width: 100vw !important;
            inset: auto 0 0 0; /* צמוד לתחתית */
            height: 100dvh;
            border-left: none;
            border-top: 1px solid rgba(0, 0, 0, 0.08);
          }
          .dark .assistant-sheet {
            border-top-color: rgba(255, 255, 255, 0.12);
          }
        }
      `}</style>
    </div>,
    portalRoot,
  );
}
