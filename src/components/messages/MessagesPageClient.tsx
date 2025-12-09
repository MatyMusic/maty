// src/components/messages/MessagesPageClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type MessageKind = "system" | "music" | "date" | string;

export type UserMessage = {
  _id: string;
  userId: string;
  kind: MessageKind;
  title: string;
  body: string;
  read: boolean;
  createdAt: string; // ISO
  meta?: Record<string, any>;
};

type MessagesListResponse = {
  ok: boolean;
  items?: UserMessage[];
  nextCursor?: string | null;
  error?: string;
};

type FilterTab = "all" | "unread" | "system" | "music" | "date";

const FILTER_LABELS: Record<FilterTab, string> = {
  all: "הכל",
  unread: "לא נקראו",
  system: "מערכת",
  music: "מוזיקה",
  date: "MATY-DATE",
};

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(iso: string) {
  if (!iso) return "";
  const now = Date.now();
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diffMs = now - t;
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "הרגע";
  if (diffMin < 60) return `לפני ${diffMin} דק׳`;

  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `לפני ${diffH} שעות`;

  const diffD = Math.round(diffH / 24);
  return `לפני ${diffD} ימים`;
}

export default function MessagesPageClient() {
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // ---------- טעינה ראשונית ----------
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/user/messages?limit=20", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("HTTP_" + res.status);

        const data: MessagesListResponse = await res.json();
        if (!data.ok) throw new Error(data.error || "SERVER_ERROR");
        if (cancelled) return;

        const items = data.items || [];
        setMessages(items);
        setNextCursor(data.nextCursor ?? null);

        if (items.length > 0) {
          setSelectedId(items[0]._id);
        }
      } catch (err) {
        console.error("load messages failed:", err);
        if (!cancelled) {
          setError("תקלה בטעינת ההודעות. נסה שוב בעוד רגע.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- טעינת עוד (פאגינציה) ----------
  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;

    try {
      setLoadingMore(true);

      const url = `/api/user/messages?limit=20&cursor=${encodeURIComponent(
        nextCursor,
      )}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("HTTP_" + res.status);

      const data: MessagesListResponse = await res.json();
      if (!data.ok) throw new Error(data.error || "SERVER_ERROR");

      const newItems = data.items || [];
      setMessages((prev) => [...prev, ...newItems]);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      console.error("loadMore failed:", err);
      setError("לא הצלחנו לטעון עוד הודעות.");
    } finally {
      setLoadingMore(false);
    }
  };

  // ---------- פילטר ----------
  const filteredMessages = useMemo(() => {
    let base = [...messages].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    switch (filter) {
      case "unread":
        base = base.filter((m) => !m.read);
        break;
      case "system":
        base = base.filter((m) => m.kind === "system");
        break;
      case "music":
        base = base.filter((m) => m.kind === "music");
        break;
      case "date":
        base = base.filter((m) => m.kind === "date");
        break;
      case "all":
      default:
        break;
    }
    return base;
  }, [messages, filter]);

  // ---------- הודעה נבחרת ----------
  const selectedMessage = useMemo(
    () =>
      filteredMessages.find((m) => m._id === selectedId) ?? filteredMessages[0],
    [filteredMessages, selectedId],
  );

  // אם משנים פילטר / רשימה – בוחרים אוטומטית את הראשונה
  useEffect(() => {
    if (!filteredMessages.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredMessages.some((m) => m._id === selectedId)) {
      setSelectedId(filteredMessages[0]._id);
    }
  }, [filteredMessages, selectedId]);

  // ---------- סימון כנקראה / לא נקראה (פשוט) ----------
  const toggleRead = async (msg: UserMessage) => {
    const newRead = !msg.read;

    // עדכון בצד לקוח
    setMessages((prev) =>
      prev.map((m) =>
        m._id === msg._id
          ? {
              ...m,
              read: newRead,
            }
          : m,
      ),
    );

    // ניסיון עדכון בשרת (אם יש route mark-read)
    try {
      await fetch("/api/user/messages/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msg._id, read: newRead }),
      });
    } catch (err) {
      console.error("mark-read failed:", err);
    }
  };

  const unreadCount = useMemo(
    () => messages.filter((m) => !m.read).length,
    [messages],
  );

  // ---------- UI ----------
  return (
    <div dir="rtl" className="space-y-6">
      {/* כותרת עליונה */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ההודעות שלי
          </h1>
          <p className="mt-1 text-sm text-neutral-300 max-w-xl">
            כאן תראה הודעות מערכת, מוזיקה, MATY-DATE והתראות חשובות מהמערכת.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 text-xs sm:text-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900/80 border border-white/10 px-3 py-1.5">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>מצב מרכז ההודעות: פעיל (beta)</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-400">
            <span>סה״כ הודעות: {messages.length}</span>
            <span className="text-neutral-600">•</span>
            <span>לא נקראו: {unreadCount}</span>
          </div>
        </div>
      </header>

      {/* פילטרים */}
      <div className="flex flex-wrap gap-2 rounded-2xl bg-neutral-900/80 border border-white/5 p-2">
        {(Object.keys(FILTER_LABELS) as FilterTab[]).map((tab) => {
          const active = filter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={[
                "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs sm:text-sm transition",
                active
                  ? "bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white shadow-lg shadow-fuchsia-600/40"
                  : "bg-neutral-800/80 text-neutral-200 hover:bg-neutral-700",
              ].join(" ")}
            >
              {tab === "unread" && (
                <span className="h-2 w-2 rounded-full bg-amber-400" />
              )}
              {tab === "system" && <span>⚙️</span>}
              {tab === "music" && <span>🎵</span>}
              {tab === "date" && <span>❤️</span>}
              <span>{FILTER_LABELS[tab]}</span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2 text-[11px] text-neutral-400">
          {loading && <span>טוען הודעות…</span>}
          {error && <span className="text-rose-400">{error}</span>}
        </div>
      </div>

      {/* גריד – רשימה + תצוגת הודעה */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
        {/* רשימת הודעות */}
        <section className="rounded-3xl border border-white/10 bg-neutral-900/80 shadow-2xl shadow-black/40 overflow-hidden">
          <div className="border-b border-white/10 bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-lg">
                ✉️
              </span>
              <div className="leading-tight">
                <div className="font-semibold">תיבת ההודעות</div>
                <div className="text-xs text-pink-50/80">
                  בחר הודעה מהרשימה כדי לראות את הפרטים המלאים בצד ימין.
                </div>
              </div>
            </div>

            {nextCursor && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/90 text-xs font-semibold text-rose-700 px-3 py-1 hover:bg-white disabled:opacity-60"
              >
                {loadingMore ? "טוען…" : "טען עוד"}
              </button>
            )}
          </div>

          <div className="max-h-[480px] overflow-y-auto divide-y divide-white/5">
            {!loading && filteredMessages.length === 0 && (
              <div className="py-10 text-center text-sm text-neutral-300">
                לא נמצאו הודעות תואמות לסינון הנוכחי.
              </div>
            )}

            {filteredMessages.map((m, idx) => {
              const isSelected = selectedMessage?._id === m._id;
              return (
                <button
                  key={`${m._id}-${idx}`} // מונע אזהרת מפתח כפול
                  type="button"
                  onClick={() => setSelectedId(m._id)}
                  className={[
                    "w-full text-right px-4 py-3 flex flex-col gap-1 transition",
                    isSelected
                      ? "bg-fuchsia-950/60"
                      : "hover:bg-neutral-800/70",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!m.read && (
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow shadow-amber-500/60" />
                      )}
                      <span className="text-sm font-semibold line-clamp-1">
                        {m.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 whitespace-nowrap">
                      {formatRelative(m.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-neutral-300 line-clamp-2">
                      {m.body}
                    </p>
                    <span className="shrink-0 text-[11px] rounded-full border border-neutral-600/60 px-2 py-0.5 text-neutral-300">
                      {m.kind === "system"
                        ? "מערכת"
                        : m.kind === "music"
                          ? "מוזיקה"
                          : m.kind === "date"
                            ? "MATY-DATE"
                            : m.kind}
                    </span>
                  </div>
                </button>
              );
            })}

            {nextCursor && filteredMessages.length > 0 && (
              <div className="p-3 border-t border-white/5 lg:hidden">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full inline-flex items-center justify-center gap-1 rounded-full bg-neutral-800 text-xs font-semibold text-neutral-100 px-3 py-2 hover:bg-neutral-700 disabled:opacity-60"
                >
                  {loadingMore ? "טוען עוד…" : "טען עוד הודעות"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* תצוגת הודעה נבחרת */}
        <section className="rounded-3xl border border-white/10 bg-neutral-900/80 shadow-2xl shadow-black/40 p-4 sm:p-6 flex flex-col">
          {!selectedMessage ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center py-10 text-sm text-neutral-300">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-neutral-600 bg-neutral-900/80">
                <span className="text-2xl">📭</span>
              </div>
              <p>בחר הודעה מהרשימה כדי לראות את התוכן המלא.</p>
            </div>
          ) : (
            <>
              <header className="mb-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg sm:text-xl font-bold">
                    {selectedMessage.title}
                  </h2>
                  <span className="text-[11px] text-neutral-400 whitespace-nowrap">
                    {formatDate(selectedMessage.createdAt)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-300">
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2.5 py-1 border border-neutral-600/60">
                    {selectedMessage.kind === "system" && <>⚙️ מערכת</>}
                    {selectedMessage.kind === "music" && <>🎵 מוזיקה</>}
                    {selectedMessage.kind === "date" && <>❤️ MATY-DATE</>}
                    {selectedMessage.kind !== "system" &&
                      selectedMessage.kind !== "music" &&
                      selectedMessage.kind !== "date" && (
                        <>🔔 {selectedMessage.kind}</>
                      )}
                  </span>

                  {!selectedMessage.read && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/40 px-2.5 py-1">
                      • הודעה חדשה
                    </span>
                  )}
                </div>
              </header>

              <div className="flex-1 rounded-2xl bg-neutral-950/60 border border-white/5 p-4 text-sm leading-relaxed text-neutral-100 whitespace-pre-line">
                {selectedMessage.body}
              </div>

              <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => toggleRead(selectedMessage)}
                  className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-3 py-1.5 text-neutral-100 hover:bg-neutral-700"
                >
                  {selectedMessage.read ? "סמן כלא נקראה" : "סמן כהודעה נקראה"}
                </button>

                <span className="text-neutral-500">
                  בהמשך נוכל להוסיף כאן כפתור מעבר לשיר / התאמה וכו׳.
                </span>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
