// src/components/maty-date/DateChatPage.tsx

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
import * as React from "react";
import type { Socket } from "socket.io-client";

/* ===================== Types ===================== */

export type ChatItem = {
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

type ApiListResponse =
  | {
      ok: true;
      items: ChatItem[];
      nextCursor?: string | null;
      matchId?: string;
    }
  | {
      ok: false;
      error: string;
      message?: string;
      upgrade?: string;
    };

type ApiPostResponse =
  | {
      ok: true;
      item: ChatItem;
      matchId?: string;
    }
  | {
      ok: false;
      error: string;
      message?: string;
      upgrade?: string;
    };

type Props = {
  peerId: string;
  peerName: string;
};

/* ===================== Utils ===================== */

function fmtTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function fmtDate(iso: string) {
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
}

function sameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

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

// ניחוש סוג הודעה
function inferKind(text: string): ChatItem["kind"] {
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

// הדגשת חיפוש
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

/* ===================== Component ===================== */

export default function DateChatPage({ peerId, peerName }: Props) {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [msgs, setMsgs] = React.useState<ChatItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [noMatch, setNoMatch] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  const [text, setText] = React.useState("");
  const [q, setQ] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<ChatItem | null>(null);
  const [reactingId, setReactingId] = React.useState<string | null>(null);
  const [attachedImg, setAttachedImg] = React.useState<string | null>(null);
  const [lightbox, setLightbox] = React.useState<string | null>(null);
  const [showEmoji, setShowEmoji] = React.useState(false);

  const [recState, setRecState] = React.useState<"idle" | "rec" | "saving">(
    "idle",
  );

  const [peerTyping, setPeerTyping] = React.useState(false);
  const [atBottom, setAtBottom] = React.useState(true);

  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isSocket, setIsSocket] = React.useState(false);

  const listRef = React.useRef<HTMLDivElement | null>(null);
  const topSentryRef = React.useRef<HTMLDivElement | null>(null);
  const endRef = React.useRef<HTMLDivElement | null>(null);
  const taRef = React.useRef<HTMLTextAreaElement | null>(null);
  const mediaRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const socketRef = React.useRef<Socket | null>(null);
  const typingTimerRef = React.useRef<number | null>(null);
  const typingEmitRef = React.useRef<number | null>(null);

  // admin detection בצד לקוח
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

  // רשימת הודעות עם חיפוש + דה־דופליקציה
  const filtered = React.useMemo(() => {
    const base = !q
      ? msgs
      : msgs.filter((m) => m.text.toLowerCase().includes(q.toLowerCase()));

    const seen = new Set<string>();
    const uniq: ChatItem[] = [];

    for (const m of base) {
      const key = `${m.id}-${m.at}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(m);
    }
    return uniq;
  }, [msgs, q]);

  const scrollToBottom = (smooth = true) => {
    const el = listRef.current;
    if (!el) return;
    if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    else el.scrollTop = el.scrollHeight;
  };

  /* ========= טעינת פרופיל של הצד השני ========= */
  React.useEffect(() => {
    if (!peerId) return;
    let dead = false;
    (async () => {
      try {
        const r = await fetch(
          `/api/date/profile/${encodeURIComponent(peerId)}`,
          {
            cache: "no-store",
            headers: { ...adminHeaders },
          },
        );
        const j = await r.json().catch(() => null);
        if (!dead && j?.ok && j.profile) {
          setProfile({
            userId: j.profile.userId,
            displayName: j.profile.displayName || j.profile.name || peerName,
            avatarUrl:
              (j.profile.photos?.[0] as string) || j.profile.avatarUrl || null,
            city: j.profile.city || null,
            country: j.profile.country || null,
            verified: !!j.profile.verified,
          });
        }
      } catch {
        // לא קריטי לצ'אט
      }
    })();
    return () => {
      dead = true;
    };
  }, [peerId, adminHeaders, peerName]);

  /* ========= טעינת הודעות ========= */
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

      const j: ApiListResponse = await r
        .json()
        .catch(() => ({ ok: false, error: "bad_json" }) as ApiListResponse);

      if (!j.ok) {
        if (j.error === "no_match") {
          setNoMatch(true);
          setError(j.message || "אין מאץ׳ הדדי, אי אפשר לפתוח צ׳אט.");
        } else if (r.status === 401) {
          setError("צריך להתחבר כדי להשתמש בצ׳אט.");
        } else if (r.status === 402 && j.upgrade && !isAdmin) {
          window.location.href = j.upgrade;
          return;
        } else {
          setError(j.message || "שגיאה בטעינת ההודעות.");
        }
        setMsgs([]);
        setHasMore(false);
        setLoading(false);
        return;
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
        const sc = listRef.current;
        if (!sc) return;
        const oldH = sc.scrollHeight;
        setMsgs((prev) => [...items, ...prev]);
        setTimeout(() => {
          if (!listRef.current) return;
          listRef.current.scrollTop = listRef.current.scrollHeight - oldH - 8;
        }, 0);
      } else {
        setMsgs(items);
        setHasMore(true);
        setTimeout(() => scrollToBottom(false), 30);
      }

      setLoading(false);
    } catch (e: any) {
      console.error(e);
      setError("שגיאת רשת בטעינת הצ׳אט.");
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (!peerId) return;
    setLoading(true);
    setError(null);
    setNoMatch(false);
    setMsgs([]);
    setHasMore(true);
    void loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId, isAdmin]);

  /* ========= אינסוף־סקול למעלה ========= */
  React.useEffect(() => {
    const node = topSentryRef.current;
    const sc = listRef.current;
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

  /* ========= מצב "בתחתית" ========= */
  React.useEffect(() => {
    const sc = listRef.current;
    if (!sc) return;
    const onScroll = () => {
      const nearBottom = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 80;
      setAtBottom(nearBottom);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    return () => sc.removeEventListener("scroll", onScroll);
  }, []);

  /* ========= Socket.IO ========= */
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
      if (s) s.disconnect();
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

  /* ========= שליחת טקסט ========= */

  async function sendText(textToSend: string) {
    const t = textToSend.trim();
    if (!t || noMatch) return;

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
    setShowEmoji(false);
    setAttachedImg(null);

    setTimeout(
      () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
      10,
    );

    const markFailed = () => {
      setMsgs((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, delivery: "failed" } : m)),
      );
    };

    try {
      // עדיפות ל־Socket אם קיים
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
            } else if (resp?.status === 402 && resp.upgrade && !isAdmin) {
              window.location.href = resp.upgrade;
            } else {
              markFailed();
            }
          },
        );
      } else {
        // Fallback ל־HTTP
        const r = await fetch(`/api/date/chat/${encodeURIComponent(peerId)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...adminHeaders,
          },
          body: JSON.stringify({ text: t, replyToId: replyTo?.id }),
        });
        if (r.status === 401) {
          setError("צריך להתחבר כדי לשלוח הודעות.");
          markFailed();
          return;
        }
        const j: ApiPostResponse = await r
          .json()
          .catch(() => ({ ok: false, error: "bad_json" }) as ApiPostResponse);

        if (!j.ok || !j.item) {
          if ((j as any).error === "no_match") {
            setNoMatch(true);
            setError(j.message || "אין מאץ׳ הדדי, אי אפשר לשלוח הודעה.");
          } else if (r.status === 402 && j.upgrade && !isAdmin) {
            window.location.href = j.upgrade;
            return;
          } else {
            setError(j.message || "שגיאה בשליחת ההודעה.");
          }
          markFailed();
          return;
        }

        setMsgs((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...j.item!,
                  kind: inferKind(j.item!.text),
                  delivery: "sent",
                }
              : m,
          ),
        );
      }
    } catch (e) {
      console.error(e);
      markFailed();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendText(
        text + (attachedImg ? `\n\n📎 קובץ מצורף: ${attachedImg}` : ""),
      );
    } else {
      emitTyping();
    }
  }

  /* ========= תמונה מצורפת ========= */

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

  /* ========= הקלטה קולית ========= */

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
      // אין הרשאה/מיקרופון – מתעלמים
    }
  }

  /* ========= Textarea auto-resize ========= */

  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(160, ta.scrollHeight) + "px";
  }, [text]);

  /* ========= תצוגה ========= */

  const title = profile?.displayName?.trim() || peerName || "צ׳אט";
  const subtitle = [profile?.city, profile?.country].filter(Boolean).join(", ");

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col bg-gradient-to-b from-neutral-100 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-white"
    >
      {/* Header */}
      <header className="border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  if (window.history.length > 1) window.history.back();
                  else window.location.href = "/date";
                }
              }}
              className="h-9 w-9 rounded-full grid place-items-center border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-xs"
              title="חזרה"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Avatar src={profile?.avatarUrl || null} alt={title} />
            <div className="text-right min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold truncate">
                  צ׳אט עם {title}
                </h1>
              </div>
              <div className="text-[11px] opacity-75 truncate">
                {subtitle || "הודעות פרטיות לאחר מאץ׳ הדדי ב־MATY-DATE"}
              </div>
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
        <div className="mx-auto max-w-3xl px-4 pb-2">
          <div className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 px-3 py-1.5 text-sm">
            <Search className="h-4 w-4 opacity-70" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="חפש/י בשיחה…"
              className="flex-1 bg-transparent outline-none"
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
      <main className="flex-1 flex justify-center">
        <div className="w-full max-w-3xl flex flex-col px-3 sm:px-4 py-3 sm:py-4">
          {error && (
            <div className="mb-2 text-xs rounded-2xl bg-rose-600/90 text-white px-3 py-2">
              {error}
            </div>
          )}

          {noMatch && (
            <div className="mb-2 text-xs rounded-2xl bg-amber-500/90 text-black px-3 py-2">
              אין כרגע מאץ׳ הדדי בינך לבין {peerName}. אפשר לשלוח קריצה/בקשת קשר
              מהעמוד הראשי של MATY-DATE, וכשיהיה מאץ׳ – הצ׳אט ייפתח.
            </div>
          )}

          <div
            ref={listRef}
            className="flex-1 min-h-[260px] max-h-[calc(100vh-210px)] overflow-y-auto rounded-2xl bg-white/70 dark:bg-neutral-900/80 border border-black/10 dark:border-white/10 px-3 py-3 space-y-1.5"
          >
            <div ref={topSentryRef} />

            {loading && !msgs.length && (
              <div className="h-full flex items-center justify-center text-xs opacity-70">
                טוען הודעות...
              </div>
            )}

            {!loading && !filtered.length && !error && !noMatch && (
              <div className="h-full flex items-center justify-center text-xs opacity-70 text-center">
                עדיין אין הודעות בינך לבין {peerName}.<br />
                תהיה ההודעה הראשונה 🤝
              </div>
            )}

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
                "max-w-[78%] rounded-2xl px-3 py-2 text-[14px] leading-6 shadow-sm relative group",
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

                        {/* כפתורי פעולה על בועה */}
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

            <div ref={endRef} />
          </div>

          {!atBottom && filtered.length > 0 && (
            <button
              onClick={() =>
                endRef.current?.scrollIntoView({ behavior: "smooth" })
              }
              className="fixed bottom-24 right-4 md:right-[calc(50%-22rem)] h-9 px-3 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow text-xs"
              title="למטה"
            >
              להודעה האחרונה
            </button>
          )}
        </div>
      </main>

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

      {/* Footer / Input */}
      <footer className="border-t border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur sticky bottom-0 z-20">
        <div className="mx-auto max-w-3xl px-3 md:px-4 py-2">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 px-3 py-2 text-[11px]">
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
            <div className="mb-2 flex items-center gap-2 text-[11px]">
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
              <div className="opacity-70">
                * התמונה מוכנה לשליחה בהודעה הבאה.
              </div>
            </div>
          )}

          <div className="relative flex items-end gap-2">
            <button
              onClick={() => setShowEmoji((v) => !v)}
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
              title="הודעה קולית"
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
                  placeholder={
                    noMatch
                      ? "אי אפשר לשלוח הודעה בלי מאץ׳ הדדי."
                      : `כתוב/י הודעה ל־${peerName}...`
                  }
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
              onClick={() =>
                sendText(
                  text +
                    (attachedImg ? `\n\n📎 קובץ מצורף: ${attachedImg}` : ""),
                )
              }
              disabled={!text.trim() && !attachedImg}
              className="h-10 px-4 rounded-xl bg-violet-600 text-white hover:bg-violet-700 font-semibold inline-flex items-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              title="שליחה"
            >
              <Send className="h-5 w-5" />
              שליחה
            </button>

            {showEmoji && (
              <div className="absolute bottom-12 right-2 z-30 w-64 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-lg p-2 grid grid-cols-8 gap-1">
                {[
                  "😀",
                  "😁",
                  "😂",
                  "🤣",
                  "😊",
                  "😍",
                  "😘",
                  "🤗",
                  "😎",
                  "🤙",
                  "👍",
                  "🙏",
                  "✨",
                  "🔥",
                  "🎵",
                  "🎧",
                  "💃",
                  "🕺",
                  "🌟",
                  "🌸",
                  "💖",
                  "💬",
                  "🎉",
                  "🥰",
                  "😉",
                  "😇",
                  "😅",
                ].map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      setText((t) => t + e);
                      setShowEmoji(false);
                      taRef.current?.focus();
                    }}
                    className="h-8 w-8 rounded hover:bg-black/5 dark:hover:bg:white/10"
                    title={e}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
