// src/components/maty-date/VideoCall.tsx
"use client";

import { dmRoomId } from "@/lib/date/room-id";
import {
  Camera,
  Clock,
  Download,
  Eye,
  Loader2,
  Mic,
  Pause,
  Sparkles,
  Trash2,
  Video as VideoIcon,
  Wand2,
} from "lucide-react";
import * as React from "react";

type StoryClip = {
  id: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  aiTitle?: string;
  aiSummary?: string;
  views?: number;
};

type AiTip = {
  id: string;
  text: string;
};

export default function VideoCall({
  meId,
  otherId,
}: {
  meId: string;
  otherId: string;
}) {
  const room = dmRoomId(meId, otherId);

  /* ------------ טאב נוכחי ------------ */
  const [tab, setTab] = React.useState<"live" | "story">("live");

  /* ------------ WebRTC לייב ------------ */
  const [liveActive, setLiveActive] = React.useState(false);
  const [ws, setWs] = React.useState<WebSocket | null>(null);
  const pcRef = React.useRef<RTCPeerConnection | null>(null);
  const localRef = React.useRef<HTMLVideoElement | null>(null);
  const remoteRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${location.host}/api/ws?room=${encodeURIComponent(
      room,
    )}&user=${encodeURIComponent(meId)}`;
    const sock = new WebSocket(url);
    sock.onmessage = async (e) => {
      try {
        const msg = JSON.parse(String(e.data));
        if (!pcRef.current) return;
        if (msg.type === "sdp-offer" && msg.to === meId) {
          await pcRef.current.setRemoteDescription(msg.sdp);
          const ans = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(ans);
          sock.send(
            JSON.stringify({
              type: "sdp-answer",
              room,
              from: meId,
              to: msg.from,
              sdp: ans,
            }),
          );
        }
        if (msg.type === "sdp-answer" && msg.to === meId) {
          await pcRef.current.setRemoteDescription(msg.sdp);
        }
        if (msg.type === "ice" && msg.to === meId && msg.candidate) {
          try {
            await pcRef.current.addIceCandidate(msg.candidate);
          } catch {}
        }
      } catch {}
    };
    setWs(sock);
    return () => sock.close();
  }, [room, meId]);

  async function setupPc() {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    pc.onicecandidate = (ev) => {
      if (ev.candidate && ws?.readyState === ws.OPEN) {
        ws.send(
          JSON.stringify({
            type: "ice",
            room,
            from: meId,
            to: otherId,
            candidate: ev.candidate,
          }),
        );
      }
    };
    pc.ontrack = (ev) => {
      if (remoteRef.current) remoteRef.current.srcObject = ev.streams[0];
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    if (localRef.current) localRef.current.srcObject = stream;
    for (const t of stream.getTracks()) pc.addTrack(t, stream);
    setLiveActive(true);
    return pc;
  }

  async function call() {
    const pc = await setupPc();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws?.send(
      JSON.stringify({
        type: "sdp-offer",
        room,
        from: meId,
        to: otherId,
        sdp: offer,
      }),
    );
  }

  function hangup() {
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    setLiveActive(false);
  }

  React.useEffect(
    () => () => {
      // ניקוי כשעוזבים את הדף
      hangup();
    },
    [],
  );

  /* ------------ הקלטת סטורי עצמי ------------ */

  const [storyStream, setStoryStream] = React.useState<MediaStream | null>(
    null,
  );
  const storyVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const [storyState, setStoryState] = React.useState<
    "idle" | "rec" | "preview" | "saving"
  >("idle");
  const [storyPreviewUrl, setStoryPreviewUrl] = React.useState<string | null>(
    null,
  );
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(
    null,
  );
  const [stories, setStories] = React.useState<StoryClip[]>([]);
  const [aiBusy, setAiBusy] = React.useState(false);

  // טוען את הסטוריז שלי
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch("/api/date/stories/me", { cache: "no-store" });
        const j = await r.json().catch(() => null);
        if (!dead && j?.ok && Array.isArray(j.items)) {
          setStories(j.items);
        }
      } catch {}
    })();
    return () => {
      dead = true;
    };
  }, []);

  async function startStoryRec() {
    if (storyState === "rec") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStoryStream(stream);
      if (storyVideoRef.current) {
        storyVideoRef.current.srcObject = stream;
      }
      const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) =>
        e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        chunksRef.current = [];
        const url = URL.createObjectURL(blob);
        setStoryPreviewUrl(url);
        setStoryState("preview");
        // עוצרים מצלמה
        stream.getTracks().forEach((t) => t.stop());
        setStoryStream(null);
      };
      rec.start();
      setStoryState("rec");
    } catch (e) {
      console.error("story rec error", e);
    }
  }

  function stopStoryRec() {
    if (storyState !== "rec") return;
    setStoryState("saving");
    recorderRef.current?.stop();
  }

  function discardStory() {
    if (storyPreviewUrl) {
      URL.revokeObjectURL(storyPreviewUrl);
    }
    setStoryPreviewUrl(null);
    setStoryState("idle");
    setUploadProgress(null);
  }

  async function saveStory() {
    if (!storyPreviewUrl || storyState !== "preview") return;
    setStoryState("saving");
    setUploadProgress(5);

    try {
      // ממירים את ה־blob חזרה
      const blob = await fetch(storyPreviewUrl).then((r) => r.blob());
      const fd = new FormData();
      fd.append("file", blob, "story.webm");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/date/stories", true);

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const p = Math.round((ev.loaded / ev.total) * 100);
          setUploadProgress(p);
        }
      };

      const done = new Promise<any>((res, rej) => {
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                res(JSON.parse(xhr.responseText));
              } catch {
                res(null);
              }
            } else {
              rej(new Error("upload failed"));
            }
          }
        };
      });

      xhr.send(fd);
      const j = await done;

      if (j?.ok && j.item) {
        setStories((s) => [j.item as StoryClip, ...s]);
        discardStory();
      } else {
        setStoryState("preview");
      }
    } catch (e) {
      console.error("saveStory error", e);
      setStoryState("preview");
    } finally {
      setUploadProgress(null);
    }
  }

  /* ------------ AI: כותרת ותיאור לסטורי ------------ */

  async function enrichStoryWithAi(clip: StoryClip) {
    if (!clip?.id) return;
    setAiBusy(true);
    try {
      const r = await fetch(`/api/date/stories/${clip.id}/ai-meta`, {
        method: "POST",
      });
      const j = await r.json().catch(() => null);
      if (j?.ok && j.meta) {
        setStories((arr) =>
          arr.map((s) =>
            s.id === clip.id
              ? { ...s, aiTitle: j.meta.title, aiSummary: j.meta.summary }
              : s,
          ),
        );
      }
    } catch (e) {
      console.error("ai meta error", e);
    } finally {
      setAiBusy(false);
    }
  }

  /* ------------ AI: טיפים לשיחה ------------ */

  const [aiTips, setAiTips] = React.useState<AiTip[]>([]);
  const [aiTipsLoading, setAiTipsLoading] = React.useState(false);

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        setAiTipsLoading(true);
        const r = await fetch(
          `/api/date/chat-ai-tips?peer=${encodeURIComponent(otherId)}`,
          { cache: "no-store" },
        );
        const j = await r.json().catch(() => null);
        if (!dead && j?.ok && Array.isArray(j.tips)) {
          setAiTips(j.tips);
        }
      } catch {
        // לא קריטי
      } finally {
        if (!dead) setAiTipsLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, [otherId]);

  /* ------------ UI ------------ */

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] rounded-3xl border border-black/10 dark:border-white/10 bg-neutral-950/70 text-white p-4 md:p-5 backdrop-blur-xl">
      {/* צד שמאל – וידאו לייב + סטורי */}
      <div className="grid gap-3">
        {/* Tabs */}
        <div className="flex gap-2 rounded-full bg-white/5 p-1 text-xs">
          <button
            onClick={() => setTab("live")}
            className={`flex-1 h-8 rounded-full inline-flex items-center justify-center gap-1 ${
              tab === "live"
                ? "bg-violet-600 text-white"
                : "hover:bg-white/5 text-neutral-200"
            }`}
          >
            <VideoIcon className="h-3.5 w-3.5" />
            לייב עם הצד השני
          </button>
          <button
            onClick={() => setTab("story")}
            className={`flex-1 h-8 rounded-full inline-flex items-center justify-center gap-1 ${
              tab === "story"
                ? "bg-pink-600 text-white"
                : "hover:bg-white/5 text-neutral-200"
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            סטורי וידאו שלי
          </button>
        </div>

        {/* תוכן הטאב */}
        {tab === "live" ? (
          <LiveSection
            liveActive={liveActive}
            call={call}
            hangup={hangup}
            localRef={localRef}
            remoteRef={remoteRef}
          />
        ) : (
          <StorySection
            storyState={storyState}
            storyVideoRef={storyVideoRef}
            storyPreviewUrl={storyPreviewUrl}
            uploadProgress={uploadProgress}
            startStoryRec={startStoryRec}
            stopStoryRec={stopStoryRec}
            discardStory={discardStory}
            saveStory={saveStory}
          />
        )}

        {/* AI טיפ / בנר קטן מתחת */}
        <div className="rounded-2xl border border-dashed border-violet-500/60 bg-violet-900/40 px-3 py-2 flex gap-2 text-xs">
          <Sparkles className="h-4 w-4 mt-0.5 text-violet-200" />
          <div>
            <div className="font-semibold mb-0.5">AI Match Helper</div>
            <div className="opacity-80">
              בזמן השיחה אפשר לצפות בטיפים של AI לנושאי שיחה, משפט פתיחה, ושאלות
              המשך – הכל מותאם לפרופיל של הצד השני.
            </div>
          </div>
        </div>
      </div>

      {/* צד ימין – סטוריז קיימים + טיפים של AI */}
      <div className="grid gap-3">
        {/* רשימת סטוריז */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Camera className="h-4 w-4" />
              <div className="text-sm font-semibold">הסטוריז שלי</div>
            </div>
            <div className="text-[11px] opacity-70">
              יופיעו בפרופיל האישי שלך ב־MATY-DATE
            </div>
          </div>

          {stories.length === 0 ? (
            <div className="text-xs opacity-70 py-6 text-center">
              עדיין אין סטוריז. הקלט/י סטורי ראשון בטאב &quot;סטורי וידאו&quot;.
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 text-xs">
              {stories.map((s) => (
                <div
                  key={s.id}
                  className="flex gap-2 rounded-xl bg-black/30 border border-white/10 p-2"
                >
                  <video
                    src={s.url}
                    className="h-20 w-24 rounded-lg object-cover bg-black/60"
                    controls
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Clock className="h-3 w-3 opacity-70" />
                      <span className="opacity-70">
                        {new Date(s.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[13px] font-semibold truncate">
                      {s.aiTitle || "סטורי ללא כותרת (עדיין)"}
                    </div>
                    {s.aiSummary && (
                      <div className="text-[11px] opacity-80 line-clamp-2">
                        {s.aiSummary}
                      </div>
                    )}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px] opacity-70">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {s.views ?? 0} צפיות
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => enrichStoryWithAi(s)}
                          className="h-7 px-2 rounded-full bg-violet-600 text-[11px] inline-flex items-center gap-1 hover:bg-violet-700 disabled:opacity-40"
                          disabled={aiBusy}
                        >
                          <Wand2 className="h-3.5 w-3.5" />
                          AI כותרת/תיאור
                        </button>
                        <a
                          href={s.url}
                          download
                          className="h-7 w-7 grid place-items-center rounded-full bg-white/10 hover:bg-white/20"
                          title="הורדה"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* טיפים מה-AI לשיחה */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-4 w-4 text-pink-300" />
            <div className="text-sm font-semibold">המלצות שיחה מה-AI</div>
          </div>
          {aiTipsLoading ? (
            <div className="flex items-center gap-1.5 opacity-80">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              טוען רעיונות לשיחה…
            </div>
          ) : aiTips.length === 0 ? (
            <div className="opacity-70">
              עדיין אין הצעות. נסה/י לרענן את הדף או להתחיל שיחה כדי שה-AI ינתח
              מידע.
            </div>
          ) : (
            <ul className="space-y-1.5 list-disc pr-4">
              {aiTips.map((t) => (
                <li key={t.id}>{t.text}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------ קומפוננטות משנה (UI לייב וסטורי) ------------ */

function LiveSection(props: {
  liveActive: boolean;
  call: () => void;
  hangup: () => void;
  localRef: React.RefObject<HTMLVideoElement>;
  remoteRef: React.RefObject<HTMLVideoElement>;
}) {
  const { liveActive, call, hangup, localRef, remoteRef } = props;
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-3 md:p-4 grid gap-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <VideoIcon className="h-4 w-4" />
          <span className="font-semibold">שיחת וידאו בלייב</span>
        </div>
        <div className="text-[11px] opacity-70">
          מצב:{" "}
          {liveActive ? (
            <span className="text-emerald-400">מחובר/ת</span>
          ) : (
            "ממתין לחיבור…"
          )}
        </div>
      </div>

      <div className="grid gap-2 md:gap-3 md:grid-cols-[2fr,1fr]">
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className="rounded-2xl bg-black/80 aspect-video w-full border border-white/10 object-cover"
        />
        <div className="grid gap-2">
          <video
            ref={localRef}
            autoPlay
            muted
            playsInline
            className="rounded-2xl bg-black/70 aspect-video border border-white/10 object-cover"
          />
          <div className="flex items-center justify-end gap-2">
            {!liveActive ? (
              <button
                onClick={call}
                className="h-9 px-4 rounded-full bg-emerald-500 text-sm font-semibold text-black hover:bg-emerald-400 inline-flex items-center gap-2"
              >
                <VideoIcon className="h-4 w-4" />
                התחלת שיחה
              </button>
            ) : (
              <button
                onClick={hangup}
                className="h-9 px-4 rounded-full bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700 inline-flex items-center gap-2"
              >
                ניתוק
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StorySection(props: {
  storyState: "idle" | "rec" | "preview" | "saving";
  storyVideoRef: React.RefObject<HTMLVideoElement>;
  storyPreviewUrl: string | null;
  uploadProgress: number | null;
  startStoryRec: () => void;
  stopStoryRec: () => void;
  discardStory: () => void;
  saveStory: () => void;
}) {
  const {
    storyState,
    storyVideoRef,
    storyPreviewUrl,
    uploadProgress,
    startStoryRec,
    stopStoryRec,
    discardStory,
    saveStory,
  } = props;

  const isRec = storyState === "rec";
  const isPreview = storyState === "preview";
  const isSaving = storyState === "saving";

  return (
    <div className="rounded-3xl border border-pink-500/60 bg-gradient-to-br from-pink-900 via-neutral-950 to-black p-3 md:p-4 grid gap-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          <span className="font-semibold">הקלטת סטורי אישי</span>
        </div>
        <div className="text-[11px] opacity-80">
          עד 60 שניות, נשמר בפרופיל האישי
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-[2fr,1fr]">
        <div className="relative">
          {!isPreview ? (
            <video
              ref={storyVideoRef}
              autoPlay
              muted
              playsInline
              className="rounded-2xl bg-black/80 aspect-video w-full border border-white/10 object-cover"
            />
          ) : (
            <video
              src={storyPreviewUrl || undefined}
              controls
              className="rounded-2xl bg-black/80 aspect-video w-full border border-white/10 object-cover"
            />
          )}

          {isRec && (
            <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-rose-600 text-white shadow">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              מקליט/ה…
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 text-xs">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-2">
            <div className="font-semibold mb-1">איך זה עובד?</div>
            <ul className="space-y-0.5 list-disc pr-4 opacity-80">
              <li>לחיצה על &quot;התחל הקלטה&quot; – והמצלמה תתחיל לצלם.</li>
              <li>סיום ע&quot;י לחיצה על &quot;עצור&quot; לקבלת Preview.</li>
              <li>אם מרוצים – &quot;שמור כסטורי&quot; לפרופיל.</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 mt-auto">
            {!isPreview && !isSaving && (
              <button
                onClick={isRec ? stopStoryRec : startStoryRec}
                className={`flex-1 h-9 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2 ${
                  isRec
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-pink-500 text-black hover:bg-pink-400"
                }`}
              >
                {isRec ? (
                  <>
                    <Pause className="h-4 w-4" />
                    עצור והצג Preview
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    התחל הקלטה
                  </>
                )}
              </button>
            )}

            {isPreview && (
              <>
                <button
                  onClick={saveStory}
                  disabled={isSaving}
                  className="flex-1 h-9 rounded-full bg-emerald-500 text-black text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      שומר…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      שמור כסטורי
                    </>
                  )}
                </button>
                <button
                  onClick={discardStory}
                  disabled={isSaving}
                  className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center"
                  title="בטל"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {uploadProgress !== null && (
            <div className="text-[11px] opacity-80 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span>{uploadProgress}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
