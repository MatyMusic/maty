// src/app/(date)/date/chat/[peerId]/page.tsx
"use client";

import { getSocket } from "@/lib/socket";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Ellipsis,
  Image as ImageIcon,
  Loader2,
  Mic,
  MoreHorizontal,
  Pause,
  Pin,
  Play,
  Search,
  Send,
  Smile,
  Star,
  Trash2,
  Undo2,
  UserRound,
  Video as VideoIcon,
} from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import * as React from "react";
import type { Socket } from "socket.io-client";

/* ===================== Types ===================== */

type Msg = {
  id: string;
  fromMe: boolean;
  text: string;
  at: string; // ISO
  kind?: "text" | "image" | "audio";
  replyToId?: string | null;
  reactions?: { emoji: string; byMe?: boolean }[];
  delivery?: "sending" | "sent" | "delivered" | "seen" | "failed";
  pinned?: boolean;
  starred?: boolean;
};

type Profile = {
  userId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  city?: string | null;
  country?: string | null;
  verified?: boolean;
};

type ChatHistoryResp =
  | { ok: true; items: Msg[]; nextCursor?: string | null }
  | { ok: false; error: string; message?: string; upgrade?: string };

type SendResp =
  | { ok: true; item: Msg }
  | { ok: false; error: string; message?: string; upgrade?: string };

/* ===================== Utils ===================== */

const fmtTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const fmtDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch {
    return "";
  }
};

const sameDay = (a: string, b: string) => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

function dirForText(t: string): "rtl" | "ltr" {
  const nonHeb = (t.match(/[A-Za-z0-9@:./]/g) || []).length;
  const heb = (t.match(/[\u0590-\u05FF]/g) || []).length;
  return nonHeb > heb ? "ltr" : "rtl";
}

// הופך לינקים/מייל/טלפון לקליקים
function linkify(input: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const re =
    /((https?:\/\/|www\.)[^\s]+)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})|(\+?\d[\d\s\-()]{7,})/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    if (m.index > last) parts.push(input.slice(last, m.index));
    const [full] = m;
    if (full.includes("@") && !full.startsWith("http")) {
      parts.push(
        <a
          key={m.index}
          href={`mailto:${full}`}
          className="underline decoration-dotted"
          target="_blank"
        >
          {full}
        </a>,
      );
    } else if (/^\+?\d/.test(full) && !full.startsWith("http")) {
      parts.push(
        <a
          key={m.index}
          href={`tel:${full.replace(/\D+/g, "")}`}
          className="underline decoration-dotted"
        >
          {full}
        </a>,
      );
    } else {
      const url = full.startsWith("http") ? full : `https://${full}`;
      parts.push(
        <a
          key={m.index}
          href={url}
          target="_blank"
          className="underline decoration-dotted"
        >
          {full}
        </a>,
      );
    }
    last = m.index + full.length;
  }
  if (last < input.length) parts.push(input.slice(last));
  return parts;
}

// ניחוש סוג הודעה מהטקסט (לוגיקת מדיה)
function inferKind(text: string): Msg["kind"] {
  if (/📎\s*קובץ מצורף:\s*(data:|blob:|https?:)/.test(text)) {
    if (/\.(jpg|jpeg|png|gif|webp)/i.test(text) || /data:image\//.test(text))
      return "image";
    if (/\.(mp3|m4a|wav|ogg|webm)/i.test(text) || /audio\//.test(text))
      return "audio";
    if (/🎙|🎤|🔊/.test(text)) return "audio";
    return "image";
  }
  return "text";
}

// הדגשת טקסט חיפוש
function highlight(text: string, q: string) {
  if (!q) return linkify(text);
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${safe})`, "gi");
  const chunks = String(text).split(re);
  return chunks.map((part, i) => {
    if (part.toLowerCase() === q.toLowerCase()) {
      return (
        <mark key={`hl-${i}`} className="bg-yellow-200/70 px-0.5 rounded">
          {part}
        </mark>
      );
    }
    const pieces = linkify(part);
    return <React.Fragment key={`hl-${i}`}>{pieces}</React.Fragment>;
  });
}

/* ===================== Atoms ===================== */

function Avatar({ src, alt }: { src?: string | null; alt: string }) {
  return src ? (
    <img
      src={src}
      alt={alt}
      className="h-9 w-9 rounded-full object-cover border border-black/10 dark:border-white/10"
    />
  ) : (
    <div className="h-9 w-9 rounded-full grid place-items-center bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
      <UserRound className="h-4 w-4" />
    </div>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="my-3 flex justify-center">
      <div className="rounded-full bg-neutral-200/80 dark:bg-neutral-800/80 px-3 py-1 text-[11px] text-neutral-700 dark:text-neutral-300">
        {label}
      </div>
    </div>
  );
}

function ReactionBar({ onReact }: { onReact: (emoji: string) => void }) {
  const R = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "✨"];
  return (
    <div className="absolute -top-9 right-0 rounded-full bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 shadow px-1.5 py-1 flex gap-1">
      {R.map((e) => (
        <button
          key={e}
          onClick={() => onReact(e)}
          className="h-7 w-7 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          title={e}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function AudioBubble({ url, fromMe }: { url: string; fromMe: boolean }) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          const a = audioRef.current;
          if (!a) return;
          if (playing) {
            a.pause();
            setPlaying(false);
          } else {
            a.play()
              .then(() => setPlaying(true))
              .catch(() => {});
          }
        }}
        className={[
          "h-9 px-3 rounded-full inline-flex items-center gap-2 transition-transform active:scale-95",
          fromMe
            ? "bg-white/15 text-white border border-white/20"
            : "bg-neutral-200/70 dark:bg-neutral-800/70 border border-black/10 dark:border-white/10",
        ].join(" ")}
        title="נגן/השהה"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        <span className="text-sm">האזנה</span>
      </button>
      <audio
        ref={audioRef}
        src={url}
        preload="auto"
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </div>
  );
}

/* ===================== Main Page ===================== */

export default function ChatPage() {
  const params = useParams<{ peerId: string }>();
  const search = useSearchParams();

  const rawPeerId = params?.peerId || "";
  const peerId = decodeURIComponent(rawPeerId);
  const peerNameFromUrl = search?.get("name") || "";

  const [peer, setPeer] = React.useState<Profile | null>(null);
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [q, setQ] = React.useState("");

  const [reactingId, setReactingId] = React.useState<string | null>(null);
  const [replyTo, setReplyTo] = React.useState<Msg | null>(null);
  const [attachedImg, setAttachedImg] = React.useState<string | null>(null);
  const [lightbox, setLightbox] = React.useState<string | null>(null);

  const [recState, setRecState] = React.useState<"idle" | "rec" | "saving">(
    "idle",
  );

  const [peerTyping, setPeerTyping] = React.useState(false);
  const [atBottom, setAtBottom] = React.useState(true);

  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isSocket, setIsSocket] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const topSentryRef = React.useRef<HTMLDivElement | null>(null);
  const endRef = React.useRef<HTMLDivElement | null>(null);
  const taRef = React.useRef<HTMLTextAreaElement | null>(null);
  const mediaRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const socketRef = React.useRef<Socket | null>(null);
  const typingTimerRef = React.useRef<number | null>(null);
  const typingEmitRef = React.useRef<number | null>(null);

  // Admin detection בצד לקוח (בטוח עם useEffect)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const flag =
      (window as any).__MM_IS_ADMIN__ === true ||
      (document?.documentElement?.dataset as any)?.admin === "1";
    setIsAdmin(Boolean(flag));
  }, []);

  const adminHeaders = React.useMemo(
    () => (isAdmin ? { "x-maty-admin": "1" } : {}),
    [isAdmin],
  );

  // חיפוש + דה־דופליקציה
  const filtered = React.useMemo(() => {
    const base = !q
      ? msgs
      : msgs.filter((m) => m.text.toLowerCase().includes(q.toLowerCase()));

    const seen = new Set<string>();
    const uniq: Msg[] = [];

    for (const m of base) {
      const key = `${m.id}-${m.at}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(m);
    }

    return uniq;
  }, [msgs, q]);

  // Peer profile
  React.useEffect(() => {
    if (!peerId) return;
    let dead = false;
    (async () => {
      try {
        const r = await fetch(
          `/api/date/profile/${encodeURIComponent(peerId)}`,
          { cache: "no-store", headers: { ...adminHeaders } },
        );
        const j = await r.json().catch(() => null);
        if (!dead && j?.ok && j.profile) {
          setPeer({
            userId: j.profile.userId,
            displayName: j.profile.displayName || j.profile.name || peerId,
            avatarUrl:
              (j.profile.photos?.[0] as string) || j.profile.avatarUrl || null,
            city: j.profile.city || null,
            country: j.profile.country || null,
            verified: !!j.profile.verified,
          });
        }
      } catch {
        // לא קריטי
      }
    })();
    return () => {
      dead = true;
    };
  }, [peerId, adminHeaders]);

  // טעינה ראשונית + before (Infinite scroll)
  async function loadMessages(opts?: { before?: string }) {
    const qs = new URLSearchParams();
    qs.set("limit", "60");
    if (opts?.before) qs.set("before", opts.before);

    try {
      const r = await fetch(
        `/api/date/chat/${encodeURIComponent(peerId)}?${qs.toString()}`,
        {
          cache: "no-store",
          headers: { ...adminHeaders },
        },
      );

      if (r.status === 401) {
        window.location.href = "/auth?mode=login";
        return;
      }
      if (r.status === 402) {
        const j = await r.json().catch(() => null);
        if (!isAdmin) {
          window.location.href = j?.upgrade || "/date/upgrade";
          return;
        }
      }

      const j: ChatHistoryResp = await r
        .json()
        .catch(() => ({ ok: false, error: "bad_json" }) as ChatHistoryResp);

      if (!j.ok) {
        throw new Error(j.message || j.error || `HTTP ${r.status}`);
      }

      const items = (j.items || []).map((m) => ({
        ...m,
        kind: m.kind || inferKind(m.text),
      }));

      if (opts?.before) {
        if (!items.length) {
          setHasMore(false);
          return;
        }
        const sc = scrollRef.current;
        if (!sc) return;
        const oldH = sc.scrollHeight;
        setMsgs((prev) => [...items, ...prev]);
        setTimeout(() => {
          if (!scrollRef.current) return;
          scrollRef.current.scrollTop =
            scrollRef.current.scrollHeight - oldH - 8;
        }, 0);
      } else {
        setMsgs(items);
        setTimeout(
          () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
          20,
        );
      }
    } catch (e: any) {
      setError(e?.message || "שגיאה בטעינת הודעות");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (!peerId) return;
    setLoading(true);
    setError(null);
    setMsgs([]);
    setHasMore(true);
    void loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId, isAdmin]);

  // Infinite scroll – sentry למעלה
  React.useEffect(() => {
    const node = topSentryRef.current;
    const sc = scrollRef.current;
    if (!node || !sc) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && hasMore && filtered.length) {
            void loadMessages({ before: filtered[0].id });
          }
        });
      },
      { root: sc, threshold: 1 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [filtered, hasMore]); // eslint-disable-line react-hooks/exhaustive-deps

  // מצב "בתחתית"
  React.useEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    const onScroll = () => {
      const nearBottom = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 80;
      setAtBottom(nearBottom);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    return () => sc.removeEventListener("scroll", onScroll);
  }, []);

  // Socket.IO – הודעות חיות + typing
  React.useEffect(() => {
    let s: Socket | null = null;
    let mounted = true;

    (async () => {
      try {
        s = await getSocket();
      } catch {
        return;
      }
      if (!mounted) return;

      socketRef.current = s;

      s.on("connect", () => {
        setIsSocket(true);
        const meId = window.localStorage.getItem("me:id") || "me@example.com";
        s?.emit("hello", { meId, isAdmin: !!isAdmin });
        s?.emit("join", { peerId });
      });

      s.on("disconnect", () => setIsSocket(false));

      s.on("chat:new", (msg: any) => {
        const meId = window.localStorage.getItem("me:id") || "me@example.com";
        setMsgs((prev) => [
          ...prev,
          {
            id: String(msg.id),
            fromMe: msg.from === meId,
            text: msg.text,
            at: msg.at,
            kind: inferKind(msg.text),
          },
        ]);
        setTimeout(
          () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
          15,
        );
      });

      s.on("typing", (data: any) => {
        if (data?.peerId === peerId) {
          setPeerTyping(true);
          if (typingTimerRef.current)
            window.clearTimeout(typingTimerRef.current);
          typingTimerRef.current = window.setTimeout(
            () => setPeerTyping(false),
            1200,
          );
        }
      });
    })();

    return () => {
      mounted = false;
      if (s) {
        s.disconnect();
      }
      socketRef.current = null;
    };
  }, [peerId, isAdmin]);

  function emitTyping() {
    if (!socketRef.current || !isSocket) return;
    if (typingEmitRef.current) return;
    socketRef.current.emit("typing", { peerId });
    typingEmitRef.current = window.setTimeout(() => {
      if (typingEmitRef.current) window.clearTimeout(typingEmitRef.current);
      typingEmitRef.current = null;
    }, 800);
  }

  // שליחת הודעה
  async function sendText(textToSend?: string) {
    const baseText = typeof textToSend === "string" ? textToSend : text;
    const finalText =
      baseText.trim() +
      (attachedImg ? `\n\n📎 קובץ מצורף: ${attachedImg}` : "");

    const t = finalText.trim();
    if (!t) return;

    const tempId = "tmp-" + Math.random().toString(36).slice(2);
    const nowIso = new Date().toISOString();

    setMsgs((prev) => [
      ...prev,
      {
        id: tempId,
        fromMe: true,
        text: t,
        at: nowIso,
        kind: inferKind(t),
        replyToId: replyTo?.id,
        delivery: "sending",
      },
    ]);
    setText("");
    setReplyTo(null);
    setAttachedImg(null);
    setTimeout(
      () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
      10,
    );

    const markFailed = () => {
      setMsgs((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, delivery: "failed" } : m)),
      );
      savePending({
        id: tempId,
        fromMe: true,
        text: t,
        at: nowIso,
        delivery: "sending",
      } as Msg);
    };

    try {
      if (socketRef.current && isSocket) {
        socketRef.current.emit(
          "chat:send",
          { to: peerId, text: t, isAdmin: !!isAdmin },
          (resp: any) => {
            if (resp?.ok && resp.item) {
              setMsgs((prev) =>
                prev.map((m) =>
                  m.id === tempId
                    ? {
                        ...resp.item,
                        kind: inferKind(resp.item.text),
                        delivery: "sent",
                      }
                    : m,
                ),
              );
            } else if (resp?.status === 402 && isAdmin) {
              setMsgs((prev) =>
                prev.map((m) =>
                  m.id === tempId ? { ...m, delivery: "sent" } : m,
                ),
              );
            } else {
              markFailed();
            }
          },
        );
      } else {
        const r = await fetch(`/api/date/chat/${encodeURIComponent(peerId)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...adminHeaders,
          },
          body: JSON.stringify({ text: t, replyToId: replyTo?.id }),
        });

        if (r.status === 402) {
          const j = await r.json().catch(() => null);
          if (!isAdmin) {
            window.location.href = j?.upgrade || "/date/upgrade";
            return;
          }
        }

        const j: SendResp = await r
          .json()
          .catch(() => ({ ok: false, error: "bad_json" }) as SendResp);

        if (!j.ok || !j.item) {
          throw new Error(j.message || j.error || `HTTP ${r.status}`);
        }

        setMsgs((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...j.item,
                  kind: inferKind(j.item.text),
                  delivery: "sent",
                }
              : m,
          ),
        );
      }
    } catch {
      markFailed();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendText();
    } else {
      emitTyping();
    }
  }

  // תמונה מצורפת
  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await downscaleImageToUrl(f, 1280, 1280, 0.82);
    try {
      const blob = await fetch(url).then((r) => r.blob());
      const fd = new FormData();
      fd.append("file", blob, (f.name || "image") + ".jpg");
      const r = await fetch("/api/upload", {
        method: "POST",
        body: fd,
        headers: { ...adminHeaders },
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.ok && j.url) {
        setAttachedImg(j.url);
      } else {
        setAttachedImg(url);
      }
    } catch {
      setAttachedImg(url);
    }
  }

  async function downscaleImageToUrl(
    file: File,
    maxW: number,
    maxH: number,
    quality = 0.85,
  ) {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxW / bmp.width, maxH / bmp.height);
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", quality),
    );
    return await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onload = () => res(String(reader.result || ""));
      reader.readAsDataURL(blob || new Blob());
    });
  }

  // הקלטת קול
  async function toggleRec() {
    if (recState === "rec") {
      const rec = mediaRef.current;
      if (!rec) return;
      setRecState("saving");
      rec.stop();
      return;
    }
    if (recState !== "idle") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };

      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        setRecState("idle");

        const fd = new FormData();
        fd.append("file", blob, "voice.webm");

        let url = "";
        try {
          const r = await fetch("/api/upload", {
            method: "POST",
            body: fd,
            headers: { ...adminHeaders },
          });
          const j = await r.json().catch(() => null);
          url = r.ok && j?.ok && j.url ? j.url : URL.createObjectURL(blob);
        } catch {
          url = URL.createObjectURL(blob);
        }

        void sendText(`🎙 הודעה קולית\n\n📎 קובץ מצורף: ${url}`);
      };

      rec.start();
      setRecState("rec");
    } catch {
      // אין הרשאה
    }
  }

  // אוטו־ריסייז לטקסטאריאה
  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(160, ta.scrollHeight) + "px";
  }, [text]);

  // תור הודעות ממתינות (אופליין)
  function savePending(m: Msg) {
    const k = `maty:pending:${peerId}`;
    const arr: Msg[] = JSON.parse(localStorage.getItem(k) || "[]");
    arr.push(m);
    localStorage.setItem(k, JSON.stringify(arr));
  }

  async function flushPending() {
    const k = `maty:pending:${peerId}`;
    const arr: Msg[] = JSON.parse(localStorage.getItem(k) || "[]");
    if (!arr.length) return;
    localStorage.removeItem(k);
    for (const m of arr) {
      await sendText(m.text);
    }
  }

  React.useEffect(() => {
    function onOnline() {
      void flushPending();
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId]);

  const title =
    peerNameFromUrl || peer?.displayName?.trim() || peerId || "צ׳אט";
  const subtitle = [peer?.city, peer?.country].filter(Boolean).join(", ");

  /* ===================== UI ===================== */

  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-gradient-to-b from-violet-50 to-pink-50 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-white"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 backdrop-blur">
        <div className="mx-auto max-w-3xl px-3 md:px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) window.history.back();
                else window.location.href = "/date";
              }}
              className="h-9 w-9 rounded-full grid place-items-center hover:bg-black/5 dark:hover:bg-white/10"
              title="חזרה"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Avatar src={peer?.avatarUrl || null} alt={title} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold truncate">{title}</h1>
              </div>
              {subtitle && (
                <div className="text-xs opacity-70 truncate">{subtitle}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="hidden sm:flex items-center gap-1.5">
              <a
                href={`/date/video?to=${encodeURIComponent(peerId)}`}
                className="h-9 px-3 rounded-full bg-violet-600 text-white hover:bg-violet-700 inline-flex items-center gap-2 text-xs"
                title="וידאו"
              >
                <VideoIcon className="h-4 w-4" /> וידאו
              </a>
            </div>

            <button
              className="h-9 w-9 grid place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
              title="עוד"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mx-auto max-w-3xl px-3 md:px-4 pb-2">
          <div className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 px-3 py-1.5">
            <Search className="h-4 w-4 opacity-70" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="חפש/י בשיחה…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {peerTyping && (
              <div className="text-xs opacity-70 flex items-center gap-1">
                מקליד/ה… <Ellipsis className="h-4 w-4 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <section className="mx-auto max-w-3xl">
        <div
          ref={scrollRef}
          className="h-[calc(100dvh-220px)] md:h-[calc(100dvh-240px)] overflow-y-auto px-3 md:px-4 py-3 space-y-2 bg-white/60 dark:bg-neutral-900/60"
        >
          <div ref={topSentryRef} />

          {loading ? (
            <div className="opacity-60 text-sm">טוען הודעות…</div>
          ) : error ? (
            <div className="text-sm text-rose-600">{error}</div>
          ) : (
            <>
              {filtered.map((m, i) => {
                const prev = filtered[i - 1];
                const showDay = !prev || !sameDay(prev.at, m.at);
                const fromMe = m.fromMe;
                const delivery = m.delivery || "sent";

                const imgMatch =
                  m.kind === "image" &&
                  (m.text.match(/(data:image\/[a-zA-Z+]+;base64,[^)\s]+)/) ||
                    m.text.match(/https?:\/\/[^\s)]+/));
                const audioMatch =
                  m.kind === "audio" &&
                  (m.text.match(/(data:audio\/[a-zA-Z+]+;base64,[^)\s]+)/) ||
                    m.text.match(/https?:\/\/[^\s)]+/));

                const isImage = !!imgMatch;
                const isAudio = !!audioMatch;

                let content: React.ReactNode = q
                  ? highlight(m.text, q)
                  : linkify(m.text);

                if (isImage && imgMatch) {
                  const src = imgMatch[0];
                  content = (
                    <img
                      src={src}
                      className="mt-1 max-w-[min(520px,90vw)] rounded-xl border border-black/10 dark:border-white/10 cursor-zoom-in bg-black/5 dark:bg-white/5"
                      alt=""
                      onClick={() => setLightbox(src)}
                    />
                  );
                }

                if (isAudio && audioMatch) {
                  const src = audioMatch[0];
                  content = <AudioBubble url={src} fromMe={fromMe} />;
                }

                const key = `${m.id}-${m.at}-${i}`;
                const isMediaOnly = isImage || isAudio;

                const bubbleClass = [
                  "max-w-[78%] rounded-2xl px-3 py-2 text-[15px] leading-6 shadow-sm relative group",
                  fromMe
                    ? isMediaOnly
                      ? "bg-neutral-900 text-white rounded-br-sm border border-white/10"
                      : "bg-violet-600 text-white rounded-br-sm"
                    : isMediaOnly
                      ? "bg-neutral-100/90 dark:bg-neutral-900/90 border border-black/10 dark:border-white/10 rounded-bl-sm"
                      : "bg-white/90 dark:bg-neutral-900/80 border border-black/10 dark:border-white/10 rounded-bl-sm",
                ].join(" ");

                return (
                  <React.Fragment key={key}>
                    {showDay && <DayDivider label={fmtDate(m.at)} />}

                    <div
                      className={`relative ${
                        fromMe ? "text-right" : "text-left"
                      }`}
                    >
                      {m.replyToId && (
                        <div
                          className={[
                            "mb-1 text-[11px] px-2 py-1 rounded-xl max-w-[75%]",
                            fromMe
                              ? "bg-white/10 text-white/90 ms-auto"
                              : "bg-black/5 dark:bg-white/10",
                          ].join(" ")}
                        >
                          בתשובה להודעה #{m.replyToId.slice(-4)}
                        </div>
                      )}

                      <div
                        className={`flex ${
                          fromMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div className={bubbleClass} dir={dirForText(m.text)}>
                          <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                            {content}
                          </div>

                          <div
                            className={[
                              "mt-1 flex items-center gap-1 text-[10px]",
                              fromMe
                                ? "text-white/80"
                                : "text-neutral-500 dark:text-neutral-400",
                            ].join(" ")}
                          >
                            <span>{fmtTime(m.at)}</span>
                            {fromMe && (
                              <>
                                {delivery === "sending" && (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                )}
                                {delivery === "failed" && (
                                  <span className="text-rose-300">נכשל</span>
                                )}
                                {delivery === "sent" && (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                {delivery === "delivered" && (
                                  <CheckCheck className="h-3.5 w-3.5 opacity-70" />
                                )}
                                {delivery === "seen" && (
                                  <CheckCheck className="h-3.5 w-3.5" />
                                )}
                              </>
                            )}
                          </div>

                          {/* כפתורי תגובה/השב/נעץ/מועדף/מחיקה (לוקלי בלבד) */}
                          <div
                            className={`absolute ${
                              fromMe ? "left-0" : "right-0"
                            } -top-6 opacity-0 group-hover:opacity-100 transition`}
                          >
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setReactingId(m.id)}
                                className="h-7 w-7 grid place-items-center rounded-full bg-white/80 dark:bg-neutral-900/80 border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800"
                                title="תגובה"
                              >
                                🙂
                              </button>
                              <button
                                onClick={() => setReplyTo(m)}
                                className="h-7 w-7 grid place-items-center rounded-full bg-white/80 dark:bg-neutral-900/80 border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800"
                                title="השב"
                              >
                                <Undo2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setMsgs((prev) =>
                                    prev.map((x) =>
                                      x.id === m.id
                                        ? { ...x, pinned: !x.pinned }
                                        : x,
                                    ),
                                  )
                                }
                                className="h-7 w-7 grid place-items-center rounded-full bg-white/80 dark:bg-neutral-900/80 border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800"
                                title="נעץ"
                              >
                                <Pin className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setMsgs((prev) =>
                                    prev.map((x) =>
                                      x.id === m.id
                                        ? { ...x, starred: !x.starred }
                                        : x,
                                    ),
                                  )
                                }
                                className="h-7 w-7 grid place-items-center rounded-full bg-white/80 dark:bg-neutral-900/80 border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800"
                                title="מועדף"
                              >
                                <Star className="h-4 w-4" />
                              </button>
                              {fromMe && (
                                <button
                                  onClick={() =>
                                    setMsgs((prev) =>
                                      prev.filter((x) => x.id !== m.id),
                                    )
                                  }
                                  className="h-7 w-7 grid place-items-center rounded-full bg-white/80 dark:bg-neutral-900/80 border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800"
                                  title="מחק מקומית"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {reactingId === m.id && (
                            <ReactionBar
                              onReact={(emoji) => {
                                setMsgs((prev) =>
                                  prev.map((x) =>
                                    x.id === m.id
                                      ? {
                                          ...x,
                                          reactions: [
                                            ...(x.reactions || []),
                                            { emoji, byMe: true },
                                          ],
                                        }
                                      : x,
                                  ),
                                );
                                setReactingId(null);
                              }}
                            />
                          )}

                          {!!m.reactions?.length && (
                            <div
                              className={[
                                "mt-1 flex flex-wrap gap-1",
                                fromMe ? "justify-end" : "justify-start",
                              ].join(" ")}
                            >
                              {m.reactions.map((r, idx) => (
                                <span
                                  key={`${m.id}-rx-${idx}`}
                                  className={[
                                    "h-6 px-2 rounded-full text-sm border",
                                    fromMe
                                      ? "border-white/20 bg-white/10"
                                      : "border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-800/80",
                                  ].join(" ")}
                                >
                                  {r.emoji}
                                </span>
                              ))}
                            </div>
                          )}

                          {(m.pinned || m.starred) && (
                            <div className="absolute -bottom-3 text-[10px] opacity-80 flex gap-2">
                              {m.pinned && <span>📌 נעוץ</span>}
                              {m.starred && <span>★ מועדף</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {filtered.length === 0 && (
                <div className="opacity-70 text-sm text-center mt-10">
                  {q
                    ? "לא נמצאו תוצאות בחיפוש."
                    : "אין הודעות עדיין. כתבו שלום! 👋"}
                </div>
              )}

              <div ref={endRef} />
            </>
          )}
        </div>

        {!atBottom && (
          <button
            onClick={() =>
              endRef.current?.scrollIntoView({ behavior: "smooth" })
            }
            className="fixed bottom-24 right-4 md:right-[calc(50%-22rem)] h-9 px-3 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow text-xs"
          >
            להודעה האחרונה
          </button>
        )}
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            className="max-h-[90dvh] max-w-[90vw] rounded-xl"
            alt=""
          />
        </div>
      )}

      {/* Footer – שורת כתיבה */}
      <footer className="sticky bottom-0 z-10 border-t border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 backdrop-blur">
        <div className="mx-auto max-w-3xl px-3 md:px-4 py-2">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 px-3 py-2 text-xs">
              <div className="truncate">
                בתשובה להודעה #{replyTo.id.slice(-4)} —{" "}
                {replyTo.text.slice(0, 60)}
              </div>
              <button
                className="underline opacity-80 hover:opacity-100"
                onClick={() => setReplyTo(null)}
              >
                ביטול
              </button>
            </div>
          )}

          {attachedImg && (
            <div className="mb-2 flex items-center gap-2 text-xs">
              <img
                src={attachedImg}
                alt=""
                className="h-16 w-16 rounded-xl object-cover border border-black/10 dark:border-white/10"
              />
              <button
                onClick={() => setAttachedImg(null)}
                className="underline opacity-80 hover:opacity-100"
              >
                הסרה
              </button>
              <div className="opacity-70">* התמונה מוכנה לשליחה.</div>
            </div>
          )}

          <div className="relative flex items-end gap-2">
            <button
              onClick={() => {}}
              className="h-10 w-10 rounded-xl grid place-items-center border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 hover:bg-white dark:hover:bg-neutral-800"
              title="אמוג׳י"
            >
              <Smile className="h-5 w-5" />
            </button>

            <label
              title="צרף תמונה"
              className="h-10 w-10 rounded-xl grid place-items-center border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 hover:bg-white dark:hover:bg-neutral-800 cursor-pointer"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickImage}
              />
              <ImageIcon className="h-5 w-5" />
            </label>

            <button
              onClick={toggleRec}
              className={[
                "h-10 w-10 rounded-xl grid place-items-center border border-black/10 dark:border-white/10",
                recState === "rec"
                  ? "bg-rose-600 text-white"
                  : "bg-white/80 dark:bg-neutral-900/80 hover:bg-white dark:hover:bg-neutral-800",
              ].join(" ")}
              title="הקלטה קולית"
            >
              {recState === "rec" ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 px-3 py-1">
                <textarea
                  ref={taRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  placeholder="הקלד/י הודעה…"
                  className="w-full resize-none bg-transparent outline-none leading-6 max-h-40 text-sm"
                />
                <div className="mt-1 flex items-center justify-between text-[11px] opacity-60">
                  <div className="hidden sm:flex items-center gap-1">
                    Enter לשליחה · Shift+Enter לשורה חדשה
                  </div>
                  <div className="flex items-center gap-2">
                    {recState === "rec" && (
                      <span className="text-rose-500">● מקליט/ה…</span>
                    )}
                    {recState === "saving" && (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> שומר…
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => void sendText()}
              className="h-10 px-4 rounded-xl bg-violet-600 text-white hover:bg-violet-700 font-semibold inline-flex items-center gap-2 text-sm"
              title="שליחה"
            >
              <Send className="h-5 w-5" />
              שליחה
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
