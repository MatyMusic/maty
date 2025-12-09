// src/app/(date)/date/profile/[userId]/page.tsx
"use client";

import {
  Camera,
  Check,
  Clock,
  Crown,
  Edit3,
  Globe,
  Image as ImageIcon,
  Info,
  Loader2,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Pause,
  Phone,
  Play,
  Save,
  ShieldCheck,
  Star,
  UploadCloud,
  Video as VideoIcon,
  X,
  XCircle,
} from "lucide-react";
import { useParams } from "next/navigation";
import * as React from "react";

/** ===================== Types ===================== */
type Tier = "free" | "plus" | "pro" | "vip";
type SubStatus = "active" | "inactive";
type Direction =
  | "orthodox"
  | "haredi"
  | "chasidic"
  | "chassidic"
  | "modern"
  | "conservative"
  | "reform"
  | "reconstructionist"
  | "secular";

type Profile = {
  userId: string;
  displayName?: string | null;
  email?: string | null;
  city?: string | null;
  country?: string | null;
  birthDate?: string | null;
  gender?: "male" | "female" | "other" | null;
  languages?: string[];
  judaism_direction?: Direction | null;
  kashrut_level?: "strict" | "partial" | "none" | null;
  shabbat_level?: "strict" | "partial" | "none" | null;
  tzniut_level?: "strict" | "partial" | "none" | null;
  goals?: "serious" | "marriage" | "friendship" | null;
  about_me?: string | null;
  photos?: string[];
  avatarUrl?: string | null;
  verified?: boolean;
  online?: boolean;
  subscription?: {
    status: SubStatus;
    tier: Tier;
    expiresAt?: string | null;
  } | null;
  updatedAt?: string | null;
  audioGreetingUrl?: string | null;
  distanceKm?: number | null;
  trust?: number | null;
};

type ApiOk = {
  ok: true;
  profile: Profile;
  music?: Array<{ title: string; artist?: string }>;
};
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

/** ==== מצב בקשת וידאו (שידוך אחד־על־אחד) ==== */
type VideoRequestState =
  | { state: "none" }
  | {
      state: "outgoing_pending";
      requestedAt: string;
      roomId?: string | null;
    }
  | {
      state: "incoming_pending";
      requestedAt: string;
      fromUserId: string;
      fromName?: string | null;
      roomId?: string | null;
    }
  | {
      state: "accepted";
      roomId: string;
    }
  | {
      state: "rejected";
      reason?: string | null;
    };

type VideoStatusApiOk = { ok: true; status: VideoRequestState };
type VideoStatusApiErr = { ok: false; error: string };
type VideoStatusApiResp = VideoStatusApiOk | VideoStatusApiErr;

/** ===================== Admin (client) ===================== */
/** קריאה מהירה לדגלי אדמין שנשלחו ב-SSR/קוקי/לוקאל-סטורג' */
function readIsAdminQuick(): boolean {
  try {
    const w = window as any;
    if (w.__MM_IS_ADMIN__ === true) return true; // מה-layout
    if (document.documentElement?.dataset?.admin === "1") return true; // <html data-admin="1">
    if (localStorage.getItem("mm:admin") === "1") return true; // bypass ידני לפיתוח
    const role = (
      document.cookie.match(/(?:^|;)\s*mm_role=([^;]+)/)?.[1] || ""
    ).toLowerCase();
    if (role === "admin" || role === "superadmin") return true;
    if (process.env.NEXT_PUBLIC_ALLOW_UNSAFE_ADMIN === "1") return true; // DEV בלבד
  } catch {}
  return false;
}
function useIsAdmin(override?: boolean) {
  const [isAdmin, setIsAdmin] = React.useState<boolean>(!!override);
  React.useEffect(() => {
    if (typeof override === "boolean") {
      setIsAdmin(override);
      return;
    }
    setIsAdmin(readIsAdminQuick());
    const onStorage = (e: StorageEvent) => {
      if (e.key === "mm:admin") setIsAdmin(readIsAdminQuick());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [override]);
  return isAdmin;
}

/** ===================== Helpers ===================== */
const DIR_LABEL: Record<Direction, string> = {
  orthodox: "אורתודוקסי",
  haredi: "חרדי",
  chasidic: "חסידי",
  chassidic: "חסידי",
  modern: "אורתודוקסי מודרני",
  conservative: "קונסרבטיבי",
  reform: "רפורמי",
  reconstructionist: "רקונסטרוקטיבי",
  secular: "חילוני/תרבותי",
};

const LEVEL_LABEL: Record<NonNullable<Profile["kashrut_level"]>, string> = {
  strict: "מחמיר/ה",
  partial: "חלקי",
  none: "לא שומר/ת",
};

const GENDER_LABEL: Record<Exclude<Profile["gender"], null>, string> = {
  male: "זכר",
  female: "נקבה",
  other: "אחר",
};

function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}
function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(+dt) ? "" : dt.toLocaleDateString();
}
function toast(setter: (s: string | null) => void, msg: string) {
  setter(msg);
  setTimeout(() => setter(null), 1900);
}
function safeDisplayName(p?: Profile | null) {
  if (!p) return "";
  if (p?.displayName?.trim()) return p.displayName.trim();
  if (p?.email?.includes("@")) return p.email.split("@")[0];
  return `משתמש ${p?.userId?.slice?.(0, 6) || ""}`;
}

/** זכאות בסיסית: chat/video למנוי פעיל PRO/VIP */
function canUse(feature: "chat" | "video", tier: Tier, status: SubStatus) {
  if (status !== "active") return false;
  if (feature === "chat" || feature === "video") {
    return tier === "pro" || tier === "vip";
  }
  return false;
}

/** ===================== Micro UI ===================== */
function Chip({
  children,
  tone = "default" as "default" | "brand" | "ok" | "warn",
}) {
  const toneCls =
    tone === "brand"
      ? "border-violet-300/60 text-violet-700 dark:text-violet-300 bg-violet-50/70 dark:bg-violet-500/10"
      : tone === "ok"
        ? "border-emerald-300/60 text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-500/10"
        : tone === "warn"
          ? "border-amber-300/60 text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-500/10"
          : "border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70";
  return (
    <span className={cls("px-2 py-1 rounded-full text-[11px] border", toneCls)}>
      {children}
    </span>
  );
}

function SectionCard({
  title,
  icon,
  children,
  footer,
}: {
  title: string | React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section
      className={cls(
        "rounded-3xl border border-black/10 dark:border-white/10",
        "bg-white/80 dark:bg-neutral-900/70 p-5",
        "relative overflow-hidden",
      )}
    >
      <div className="pointer-events-none absolute -top-10 -left-10 size-40 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-violet-400 to-amber-300 animate-pulse" />
      <div className="flex items-center gap-2 text-lg font-bold">
        {icon} {title}
      </div>
      <div className="mt-3">{children}</div>
      {footer && (
        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
          {footer}
        </div>
      )}
    </section>
  );
}

function ToolbarButton({
  onClick,
  children,
  primary = false,
  disabled = false,
  title,
  attention = false, // זוהר כשTRUE
  locked = false, // מצב נעול
}: {
  onClick?: () => void;
  children: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  title?: string;
  attention?: boolean;
  locked?: boolean;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cls(
        "h-10 px-4 rounded-full inline-flex items-center gap-2 transition",
        "hover:scale-[1.02] active:scale-[0.98]",
        disabled && "opacity-60 cursor-not-allowed",
        primary
          ? "bg-gradient-to-r from-neutral-900 to-neutral-700 text-white dark:from-white dark:to-neutral-300 dark:text-neutral-900 shadow-sm"
          : "border bg-white/85 dark:bg-neutral-900/85 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800",
        attention && "btn-glow btn-wiggle",
        locked && "gate-locked",
      )}
      type="button"
    >
      {children}
    </button>
  );
}

/** ===================== Page ===================== */
export default function ProfileMegaPage() {
  const { userId } = useParams<{ userId: string }>();
  const isAdmin = useIsAdmin(); // ⬅️ אדמין מהיר בצד לקוח

  const [data, setData] = React.useState<Profile | null>(null);
  const [music, setMusic] = React.useState<
    Array<{ title: string; artist?: string }>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  // Editing state
  const [edit, setEdit] = React.useState<Partial<Profile>>({});
  const [busySave, setBusySave] = React.useState(false);

  // Photos
  const [uploading, setUploading] = React.useState(false);
  const [localPreviews, setLocalPreviews] = React.useState<string[]>([]);
  const [avatarBusy, setAvatarBusy] = React.useState<string | null>(null);

  // Reorder (DnD)
  const [dragging, setDragging] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState<string | null>(null);
  const [reorderSaving, setReorderSaving] = React.useState(false);
  const [reorderDirty, setReorderDirty] = React.useState(false);
  const saveTimer = React.useRef<any>(null);

  // Music add
  const [newSong, setNewSong] = React.useState({ title: "", artist: "" });

  // Lead form
  const [leadName, setLeadName] = React.useState("");
  const [leadPhone, setLeadPhone] = React.useState("");
  const [leadAbout, setLeadAbout] = React.useState("");

  // UI
  const [tab, setTab] = React.useState<
    "overview" | "gallery" | "values" | "prefs" | "activity" | "edit"
  >("overview");
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  // Audio
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false);

  // Entitlements (המשתמש הנוכחי)
  const [myTier, setMyTier] = React.useState<Tier>("free");
  const [myStatus, setMyStatus] = React.useState<SubStatus>("inactive");
  const [paywall, setPaywall] = React.useState<null | {
    feature: "chat" | "video";
  }>(null);

  // ==== מצב בקשת הווידאו ====
  const [videoReq, setVideoReq] = React.useState<VideoRequestState>({
    state: "none",
  });
  const [videoBusy, setVideoBusy] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // פרופיל
        const r = await fetch(
          `/api/date/profile/${encodeURIComponent(userId)}`,
          { cache: "no-store" },
        );
        const j: ApiResp = await r.json();
        if (!r.ok || !("ok" in j) || !j.ok)
          throw new Error((j as any).error || `HTTP ${r.status}`);
        setData(j.profile);
        setMusic(j.music || []);
        setEdit({
          about_me: j.profile.about_me || "",
          goals: j.profile.goals || null,
          languages: j.profile.languages || [],
          judaism_direction: j.profile.judaism_direction || null,
          kashrut_level: j.profile.kashrut_level || null,
          shabbat_level: j.profile.shabbat_level || null,
          tzniut_level: j.profile.tzniut_level || null,
        });
      } catch (e: any) {
        setErr(e?.message || "שגיאה בטעינת הפרופיל");
      } finally {
        setLoading(false);
      }

      // זכאות / מסלול שלי
      try {
        const me = await fetch("/api/date/me", { cache: "no-store" });
        const mj = await me.json().catch(() => null);
        if (me.ok && mj?.ok) {
          setMyTier((mj.tier as Tier) || "free");
          setMyStatus((mj.status as SubStatus) || "inactive");
        }
      } catch {}
    })();
  }, [userId]);

  // טעינת סטטוס בקשת וידאו עבור פרופיל זה
  React.useEffect(() => {
    if (!userId) return;
    let dead = false;
    (async () => {
      try {
        const qs = new URLSearchParams();
        qs.set("peerId", String(userId));
        const r = await fetch(
          `/api/date/video-request/status?${qs.toString()}`,
          { cache: "no-store" },
        );
        const j: VideoStatusApiResp = await r.json().catch(() => {
          throw new Error(`HTTP ${r.status}`);
        });
        if (!r.ok || !j.ok) throw new Error((j as any).error || "bad_status");
        if (!dead) setVideoReq(j.status || { state: "none" });
      } catch {
        if (!dead) setVideoReq({ state: "none" });
      }
    })();
    return () => {
      dead = true;
    };
  }, [userId]);

  const photos = React.useMemo(
    () =>
      (data?.photos?.length
        ? data.photos
        : data?.avatarUrl
          ? [data.avatarUrl]
          : []) as string[],
    [data],
  );

  const displayName = safeDisplayName(data);
  const tier = data?.subscription?.tier || "free";
  const subActive = data?.subscription?.status === "active";

  /** ============ Actions (עם בייפאס אדמין) ============ */
  function goChat() {
    const allow = isAdmin || canUse("chat", myTier, myStatus);
    if (!allow) {
      setPaywall({ feature: "chat" });
      return;
    }
    window.location.href = `/date/chat/${encodeURIComponent(userId)}`;
  }

  // כניסה בפועל לחדר וידאו – רק אחרי אישור הדדי / אדמין
  function goVideoRoom(roomId?: string | null) {
    const allow = isAdmin || canUse("video", myTier, myStatus);
    if (!allow) {
      setPaywall({ feature: "video" });
      return;
    }
    const base = "/date/video";
    const qs = new URLSearchParams();
    if (roomId) qs.set("room", roomId);
    else qs.set("to", String(userId));
    window.location.href = `${base}?${qs.toString()}`;
  }

  // בקשת שיחת וידאו (שידוך) – צד יוזם
  async function requestVideoCall() {
    const allow = isAdmin || canUse("video", myTier, myStatus);
    if (!allow) {
      setPaywall({ feature: "video" });
      return;
    }
    try {
      setVideoBusy(true);
      const r = await fetch(`/api/date/video-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: userId }),
      });
      const j: VideoStatusApiResp = await r.json().catch(() => null as any);
      if (!r.ok || !j?.ok)
        throw new Error((j as any)?.error || `HTTP ${r.status}`);
      setVideoReq(j.status || { state: "outgoing_pending", requestedAt: "" });
      toast(
        setToastMsg,
        "הבקשה לשיחת וידאו נשלחה. רק אם שני הצדדים יאשרו תיפתח שיחה ✅",
      );
    } catch (e: any) {
      toast(setToastMsg, e?.message || "שגיאה בשליחת בקשת וידאו");
    } finally {
      setVideoBusy(false);
    }
  }

  // ביטול בקשה יוצאת
  async function cancelVideoRequest() {
    try {
      setVideoBusy(true);
      const r = await fetch(`/api/date/video-request`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: userId }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setVideoReq({ state: "none" });
      toast(setToastMsg, "בקשת הווידאו בוטלה");
    } catch (e: any) {
      toast(setToastMsg, e?.message || "שגיאה בביטול בקשה");
    } finally {
      setVideoBusy(false);
    }
  }

  // אישור בקשה נכנסת
  async function acceptVideoRequest() {
    try {
      setVideoBusy(true);
      const r = await fetch(`/api/date/video-request/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: userId }),
      });
      const j: VideoStatusApiResp = await r.json().catch(() => null as any);
      if (!r.ok || !j?.ok)
        throw new Error((j as any)?.error || `HTTP ${r.status}`);
      if (j.status?.state === "accepted") {
        setVideoReq(j.status);
        goVideoRoom(j.status.roomId);
      } else {
        setVideoReq(j.status || { state: "accepted", roomId: "" });
      }
    } catch (e: any) {
      toast(setToastMsg, e?.message || "שגיאה באישור בקשת וידאו");
    } finally {
      setVideoBusy(false);
    }
  }

  // דחיית בקשה נכנסת
  async function rejectVideoRequest() {
    try {
      setVideoBusy(true);
      const r = await fetch(`/api/date/video-request/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: userId }),
      });
      const j: VideoStatusApiResp = await r.json().catch(() => null as any);
      if (!r.ok || !j?.ok)
        throw new Error((j as any)?.error || `HTTP ${r.status}`);
      setVideoReq(j.status || { state: "rejected" });
      toast(setToastMsg, "בקשת הווידאו נדחתה");
    } catch (e: any) {
      toast(setToastMsg, e?.message || "שגיאה בדחיית בקשה");
    } finally {
      setVideoBusy(false);
    }
  }

  // לחיצה על כפתור הווידאו בפרופיל
  function handleVideoClick() {
    if (isAdmin) {
      goVideoRoom();
      return;
    }
    switch (videoReq.state) {
      case "none":
      case "rejected":
        return requestVideoCall();
      case "outgoing_pending":
        return;
      case "incoming_pending":
        return;
      case "accepted":
        return goVideoRoom(videoReq.roomId);
      default:
        return;
    }
  }

  async function saveProfile() {
    try {
      setBusySave(true);
      const body = {
        about_me: (edit.about_me || "").toString(),
        goals: edit.goals || null,
        languages: Array.isArray(edit.languages) ? edit.languages : [],
        judaism_direction: edit.judaism_direction || null,
        kashrut_level: edit.kashrut_level || null,
        shabbat_level: edit.shabbat_level || null,
        tzniut_level: edit.tzniut_level || null,
      };
      const r = await fetch(
        `/api/date/profile/${encodeURIComponent(userId)}/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setData((p) => (p ? { ...p, ...body } : p));
      toast(setToastMsg, "השינויים נשמרו ✅");
    } catch (e: any) {
      toast(setToastMsg, e?.message || "שגיאת שמירה");
    } finally {
      setBusySave(false);
    }
  }

  async function addSong() {
    const t = newSong.title.trim();
    const a = newSong.artist.trim();
    if (!t) return toast(setToastMsg, "שם שיר נדרש");
    try {
      const r = await fetch(
        `/api/date/profile/${encodeURIComponent(userId)}/music`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: t, artist: a }),
        },
      );
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setMusic((p) =>
        [{ title: t, artist: a || undefined }, ...p].slice(0, 24),
      );
      setNewSong({ title: "", artist: "" });
      toast(setToastMsg, "השיר נוסף 🎵");
    } catch (e: any) {
      toast(setToastMsg, e?.message || "שגיאה בהוספת שיר");
    }
  }

  async function sendLead() {
    const name = leadName.trim();
    const phone = leadPhone.trim();
    if (!name || !phone) return toast(setToastMsg, "שם וטלפון חובה");
    try {
      const r = await fetch(
        `/api/date/profile/${encodeURIComponent(userId)}/lead`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, about: leadAbout }),
        },
      );
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setLeadName("");
      setLeadPhone("");
      setLeadAbout("");
      toast(setToastMsg, "הפנייה נשלחה לשדכנית ✅");
    } catch (e: any) {
      toast(setToastMsg, e?.message || "שגיאה בשליחת הפנייה");
    }
  }

  function toggleAudio() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play()
        .then(() => setPlaying(true))
        .catch(() => {});
      a.onended = () => setPlaying(false);
    }
  }

  /* ============ Upload / Gallery ============ */
  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const list = Array.from(files).slice(0, 12);

    const previews = await Promise.all(
      list.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res((r.result as string) || "");
            r.readAsDataURL(f);
          }),
      ),
    );
    setLocalPreviews(previews);

    try {
      setUploading(true);
      const fd = new FormData();
      list.forEach((f) => {
        fd.append("files[]", f);
        fd.append("files", f);
      });
      const r = await fetch(
        `/api/date/profile/${encodeURIComponent(userId)}/photos`,
        { method: "POST", body: fd },
      );
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      const urls: string[] = Array.isArray(j.urls) ? j.urls : [];
      setData((p) =>
        p ? { ...p, photos: [...(p.photos || []), ...urls] } : p,
      );
      setLocalPreviews([]);
      toast(setToastMsg, "התמונות הועלו ✅");
    } catch (e: any) {
      toast(setToastMsg, e?.message || "שגיאה בהעלאה");
    } finally {
      setUploading(false);
    }
  }

  async function setAsAvatar(url: string) {
    try {
      setAvatarBusy(url);
      const r = await fetch(
        `/api/date/profile/${encodeURIComponent(userId)}/avatar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        },
      );
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setData((p) => (p ? { ...p, avatarUrl: url } : p));
      toast(setToastMsg, "עודכנה תמונת פרופיל ⭐");
    } catch (e: any) {
      toast(setToastMsg, e?.message || "שגיאה בעדכון תמונת פרופיל");
    } finally {
      setAvatarBusy(null);
    }
  }

  async function deletePhoto(url: string) {
    try {
      const r = await fetch(
        `/api/date/profile/${encodeURIComponent(userId)}/photos`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        },
      );
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setData((p) =>
        p ? { ...p, photos: (p.photos || []).filter((x) => x !== url) } : p,
      );
      setData((p) =>
        p?.avatarUrl === url ? { ...(p as Profile), avatarUrl: null } : p,
      );
      toast(setToastMsg, "התמונה הוסרה");
    } catch (e: any) {
      toast(setToastMsg, e?.message || "שגיאה במחיקה");
    }
  }

  /* ============ Reorder (DnD) ============ */
  function reorderLocal(list: string[], fromUrl: string, toUrl: string) {
    const srcIdx = list.indexOf(fromUrl);
    const dstIdx = list.indexOf(toUrl);
    if (srcIdx < 0 || dstIdx < 0 || srcIdx === dstIdx) return list;
    const next = list.slice();
    const [moved] = next.splice(srcIdx, 1);
    next.splice(dstIdx, 0, moved);
    return next;
  }
  function scheduleAutoSave() {
    setReorderDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveReorder(), 700);
  }
  async function saveReorder() {
    try {
      setReorderSaving(true);
      const order = photos;
      const r = await fetch(
        `/api/date/profile/${encodeURIComponent(userId)}/photos/reorder`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order }),
        },
      );
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setReorderDirty(false);
      toast(setToastMsg, "סדר התמונות נשמר ✅");
    } catch (e: any) {
      toast(setToastMsg, e?.message || "שגיאה בשמירת הסדר");
    } finally {
      setReorderSaving(false);
    }
  }

  /** ============ Controls ============ */
  function TabBtn({
    id,
    children,
  }: {
    id: typeof tab;
    children: React.ReactNode;
  }) {
    const active = tab === id;
    return (
      <button
        onClick={() => setTab(id)}
        className={cls(
          "h-10 px-4 rounded-full text-sm border transition",
          "hover:translate-y-[-1px]",
          active
            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
            : "bg-white/80 dark:bg-neutral-900/80",
        )}
        type="button"
      >
        {children}
      </button>
    );
  }

  /** זכאות עם בייפאס אדמין */
  const chatAllowed = isAdmin || canUse("chat", myTier, myStatus);
  const videoAllowed = isAdmin || canUse("video", myTier, myStatus);

  const videoLabel = (() => {
    if (!videoAllowed && !isAdmin) return "וידאו (נדרש שדרוג)";
    switch (videoReq.state) {
      case "none":
        return "בקשת שיחת וידאו";
      case "outgoing_pending":
        return "בקשה ממתינה";
      case "incoming_pending":
        return "בקשת וידאו חדשה";
      case "accepted":
        return "הצטרף לשיחת הווידאו";
      case "rejected":
        return "בקשה נדחתה – אפשר לבקש שוב";
      default:
        return "וידאו";
    }
  })();

  /** ============ UI ============ */
  return (
    <main dir="rtl" className="mx-auto max-w-6xl p-4 md:p-8 pb-safe">
      {loading && (
        <div className="opacity-70 text-sm animate-pulse">טוען פרופיל…</div>
      )}
      {err && !loading && (
        <div className="rounded-xl border border-red-200/40 bg-red-50/60 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          {err}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Header */}
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs opacity-70">פרופיל משתמש</div>
              <h1 className="text-3xl font-extrabold flex items-center gap-2 truncate">
                {displayName}
                {data.verified && (
                  <ShieldCheck
                    className="h-5 w-5 text-sky-500"
                    title="מאומת/ת"
                  />
                )}
                {isAdmin && (
                  <span
                    title="Admin bypass"
                    className="ms-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border border-amber-400 bg-amber-50/70 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                  >
                    ⭐ Admin
                  </span>
                )}
              </h1>
              <div className="mt-1 text-sm opacity-70 flex flex-wrap items-center gap-2">
                {(data.city || data.country) && (
                  <>
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">
                      {[data.city, data.country].filter(Boolean).join(", ")}
                    </span>
                  </>
                )}
                {data.distanceKm != null && (
                  <Chip tone="brand">
                    {`${data.distanceKm?.toFixed?.(
                      data.distanceKm < 10 ? 1 : 0,
                    )} ק״מ ממך`}
                  </Chip>
                )}
                {!!data.languages?.length && (
                  <Chip>{data.languages.join(", ")}</Chip>
                )}
                {!!data.judaism_direction && (
                  <Chip tone="ok">
                    {DIR_LABEL[data.judaism_direction] ||
                      String(data.judaism_direction)}
                  </Chip>
                )}
                {subActive && (
                  <Chip tone="warn">{(tier || "free").toUpperCase()}</Chip>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <ToolbarButton
                primary
                onClick={goChat}
                title={chatAllowed ? "צ׳אט" : "צ׳אט (נדרש שדרוג)"}
                attention={chatAllowed}
                locked={!chatAllowed}
              >
                <MessageCircle className="h-4 w-4" />
                צ׳אט
                {!chatAllowed && <LockKeyhole className="h-4 w-4 opacity-80" />}
              </ToolbarButton>

              <ToolbarButton
                onClick={handleVideoClick}
                title={videoLabel}
                attention={videoAllowed || isAdmin}
                locked={!videoAllowed && !isAdmin}
                disabled={videoBusy}
              >
                <VideoIcon className="h-4 w-4" />
                {videoLabel}
                {videoBusy && (
                  <Loader2 className="h-4 w-4 animate-spin opacity-80" />
                )}
                {!videoAllowed && !isAdmin && (
                  <LockKeyhole className="h-4 w-4 opacity-80" />
                )}
              </ToolbarButton>

              <ToolbarButton onClick={() => setTab("edit")} title="עריכה">
                <Edit3 className="h-4 w-4" /> עריכה
              </ToolbarButton>
            </div>
          </header>

          {/* Tabs */}
          <div className="mt-5 flex flex-wrap gap-2">
            <TabBtn id="overview">סקירה</TabBtn>
            <TabBtn id="gallery">גלריה</TabBtn>
            <TabBtn id="values">ערכים</TabBtn>
            <TabBtn id="prefs">העדפות</TabBtn>
            <TabBtn id="activity">פעילות</TabBtn>
            <TabBtn id="edit">עריכה</TabBtn>
          </div>

          {/* CONTENT */}
          {tab === "overview" && (
            <div className="mt-6 grid gap-6 md:grid-cols-[2fr,1fr]">
              {/* Media + About */}
              <SectionCard
                title={
                  <span className="inline-flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    <span className="font-bold">{displayName}</span>
                    {data.verified && (
                      <ShieldCheck
                        className="h-4 w-4 text-sky-500"
                        title="מאומת/ת"
                      />
                    )}
                  </span>
                }
              >
                {/* תמונה + “לוח היילייטס” בצד */}
                <div className="grid gap-4 lg:grid-cols-[1.4fr,0.8fr]">
                  <div className="grid md:grid-cols-2 gap-3">
                    {photos.length ? (
                      <>
                        <div className="relative overflow-hidden rounded-2xl group">
                          <img
                            src={photos[0]}
                            alt=""
                            className="rounded-2xl w-full aspect-[4/3] object-cover border border-black/10 dark:border-white/10 transition-transform group-hover:scale-[1.02]"
                          />
                          {data.avatarUrl === photos[0] && (
                            <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-black/70 text-white">
                              <Star className="h-3 w-3" /> תמונת פרופיל
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {photos.slice(1, 5).map((p, i) => (
                            <div
                              key={p + i}
                              className="relative overflow-hidden rounded-2xl group"
                            >
                              <img
                                src={p}
                                alt=""
                                className="rounded-2xl w-full aspect-square object-cover border border-black/10 dark:border-white/10 transition-transform group-hover:scale-[1.03]"
                              />
                              {data.avatarUrl === p && (
                                <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-black/70 text-white">
                                  <Star className="h-3 w-3" /> פרופיל
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="হ-64 rounded-2xl grid place-items-center bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-neutral-800 dark:to-neutral-700">
                        אין תמונות
                      </div>
                    )}
                  </div>

                  {/* לוח היילייטס + סטטוס וידאו */}
                  <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-900/70 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm opacity-70">
                        סטטוס: {data.online ? "מחובר/ת" : "לא מחובר/ת"}
                      </span>
                      {data.trust != null && (
                        <Chip tone="ok">אמון {Math.round(data.trust)}%</Chip>
                      )}
                    </div>

                    <div className="mt-1">
                      <div className="text-xs opacity-70 mb-1">מד אמון</div>
                      <div className="h-2 rounded-full bg-black/10 dark:bg:white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, data.trust ?? 0),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* סטטוס בקשת וידאו – ברור לשידוך בלבד */}
                    <div className="mt-3 rounded-2xl border border-violet-200/40 dark:border-violet-500/30 bg-violet-50/80 dark:bg-violet-900/10 p-3 text-xs sm:text-sm space-y-2">
                      <div className="flex items-center gap-2 font-semibold">
                        <VideoIcon className="h-4 w-4" />
                        שיחת וידאו לשידוך
                      </div>
                      <p className="opacity-80 leading-5">
                        שיחת וידאו נפתחת רק אם <b>שני הצדדים מאשרים</b> את
                        הבקשה. השיחה היא <b>פרטית לגמרי</b> – רק אתה והצד השני
                        יכולים לראות אחד את השני.
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={handleVideoClick}
                          disabled={videoBusy}
                          className={cls(
                            "h-9 px-3 rounded-full text-xs sm:text-sm inline-flex items-center gap-2 font-semibold",
                            videoReq.state === "accepted"
                              ? "bg-emerald-600 text-white hover:bg-emerald-500"
                              : videoReq.state === "incoming_pending"
                                ? "bg-amber-500 text-white hover:bg-amber-400"
                                : videoReq.state === "outgoing_pending"
                                  ? "bg-violet-500 text-white hover:bg-violet-400"
                                  : "bg-violet-600 text-white hover:bg-violet-500",
                          )}
                          type="button"
                          title={videoLabel}
                        >
                          {videoReq.state === "accepted" && (
                            <Check className="h-4 w-4" />
                          )}
                          {(videoReq.state === "incoming_pending" ||
                            videoReq.state === "outgoing_pending") && (
                            <Clock className="h-4 w-4" />
                          )}
                          {videoReq.state === "rejected" && (
                            <XCircle className="h-4 w-4" />
                          )}
                          {videoLabel}
                          {videoBusy && (
                            <Loader2 className="h-4 w-4 animate-spin opacity-80" />
                          )}
                        </button>

                        {videoReq.state === "outgoing_pending" && (
                          <button
                            onClick={cancelVideoRequest}
                            disabled={videoBusy}
                            className="h-9 px-3 rounded-full text-xs border border-white/40 bg-white/70 text-neutral-800 dark:bg-neutral-900 dark:text-white"
                            type="button"
                          >
                            ביטול בקשה
                          </button>
                        )}

                        {videoReq.state === "incoming_pending" && (
                          <>
                            <button
                              onClick={acceptVideoRequest}
                              disabled={videoBusy}
                              className="h-9 px-3 rounded-full text-xs bg-emerald-600 text-white hover:bg-emerald-500 inline-flex items-center gap-1"
                              type="button"
                            >
                              <Check className="h-4 w-4" />
                              אישור
                            </button>
                            <button
                              onClick={rejectVideoRequest}
                              disabled={videoBusy}
                              className="h-9 px-3 rounded-full text-xs bg-red-600 text-white hover:bg-red-500 inline-flex items-center gap-1"
                              type="button"
                            >
                              <X className="h-4 w-4" />
                              דחייה
                            </button>
                          </>
                        )}
                      </div>

                      {videoReq.state === "accepted" && (
                        <p className="text-[11px] opacity-80">
                          השיחה אושרה – אפשר להיכנס לחדר הווידאו המשותף.
                        </p>
                      )}
                      {videoReq.state === "rejected" && (
                        <p className="text-[11px] opacity-80">
                          הבקשה נדחתה. אפשר לנסות שוב בעתיד אם זה מתאים לשני
                          הצדדים.
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2 text-sm mt-2">
                      {!!music?.length && (
                        <div className="flex items-center justify-between">
                          <span className="opacity-70">שירים בפרופיל</span>
                          <span className="font-medium">{music.length}</span>
                        </div>
                      )}
                      {data.subscription?.tier && (
                        <div className="flex items-center justify-between">
                          <span className="opacity-70">מנוי</span>
                          <span className="font-medium">
                            {(tier || "free").toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {data.audioGreetingUrl && (
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={toggleAudio}
                      className="h-9 px-3 rounded-full border bg-white/85 dark:bg-neutral-900/85 border-black/10 dark:border-white/10 inline-flex items-center gap-2"
                      type="button"
                    >
                      {playing ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      הקדמה קולית
                    </button>
                    <audio
                      ref={audioRef}
                      src={data.audioGreetingUrl}
                      preload="none"
                    />
                  </div>
                )}

                <div className="mt-5">
                  <div className="text-sm opacity-70">אודות</div>
                  <p className="mt-1 whitespace-pre-wrap leading-7 opacity-90">
                    {data.about_me || "—"}
                  </p>
                </div>
              </SectionCard>

              {/* Quick facts + Lead */}
              <div className="grid gap-6">
                <SectionCard
                  title="עובדות מהירות"
                  icon={<Info className="h-5 w-5" />}
                >
                  <div className="text-sm grid gap-2">
                    {data.gender && (
                      <div className="flex items-center justify-between">
                        <span className="opacity-70">מין</span>
                        <span>{GENDER_LABEL[data.gender]}</span>
                      </div>
                    )}
                    {data.birthDate && (
                      <div className="flex items-center justify-between">
                        <span className="opacity-70">תאריך לידה</span>
                        <span>{fmtDate(data.birthDate)}</span>
                      </div>
                    )}
                    {data.judaism_direction && (
                      <div className="flex items-center justify-between">
                        <span className="opacity-70">זרם</span>
                        <span>
                          {DIR_LABEL[data.judaism_direction] ||
                            data.judaism_direction}
                        </span>
                      </div>
                    )}
                    {!!data.languages?.length && (
                      <div className="flex items-center justify-between">
                        <span className="opacity-70">שפות</span>
                        <span className="truncate">
                          {data.languages.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </SectionCard>

                <SectionCard
                  title="צריך/ה עזרה משדכנית?"
                  icon={<Phone className="h-5 w-5" />}
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="שם מלא"
                      className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90 w-full"
                    />
                    <input
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="טלפון"
                      className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90 w-full"
                    />
                    <button
                      onClick={sendLead}
                      className="h-11 rounded-xl bg-rose-600 text-white font-semibold"
                      type="button"
                    >
                      שליחה לשדכנית
                    </button>
                  </div>
                  <textarea
                    value={leadAbout}
                    onChange={(e) => setLeadAbout(e.target.value)}
                    className="mt-3 w-full rounded-xl border px-3 py-2 bg-white/95 dark:bg-neutral-900/90"
                    rows={3}
                    placeholder="כמה מילים על מה מחפשים / הערות…"
                  />
                </SectionCard>
              </div>
            </div>
          )}

          {tab === "gallery" && (
            <div className="mt-6 grid gap-6">
              <SectionCard
                title="גלריית תמונות"
                icon={<Camera className="h-5 w-5" />}
                footer={
                  uploading ? (
                    <div className="inline-flex items-center gap-2 text-sm opacity-80">
                      <Loader2 className="h-4 w-4 animate-spin" /> מעלה…
                    </div>
                  ) : null
                }
              >
                {/* Upload zone */}
                <label
                  className={cls(
                    "mt-1 grid place-items-center rounded-2xl border-2 border-dashed p-6 cursor-pointer text-center transition",
                    "hover:bg-black/[0.03] dark:hover:bg-white/[0.03]",
                    uploading && "opacity-70",
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud className="h-7 w-7 opacity-70" />
                    <div className="text-sm opacity-80">
                      גרור/י לכאן תמונות או לחצו להעלאה
                    </div>
                  </div>
                </label>

                {/* Previews */}
                {localPreviews.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs opacity-70">תצוגה מקדימה</div>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {localPreviews.map((src, i) => (
                        <div key={i} className="relative">
                          <img
                            src={src}
                            className="rounded-xl w-full aspect-square object-cover border border-black/10 dark:border-white/10"
                            alt=""
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing photos – DnD */}
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photos.map((p) => {
                    const isAvatar = data?.avatarUrl === p;
                    const busy = avatarBusy === p;
                    const isDragging = dragging === p;
                    const isOver = dragOver === p;

                    return (
                      <div
                        key={p}
                        className={cls(
                          "relative group rounded-xl overflow-hidden border",
                          isOver
                            ? "ring-2 ring-violet-500"
                            : "border-black/10 dark:border-white/10",
                          isDragging ? "opacity-60" : "opacity-100",
                        )}
                        draggable
                        onDragStart={(e) => {
                          setDragging(p);
                          e.dataTransfer.setData("text/plain", p);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          if (p !== dragging) setDragOver(p);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (p !== dragging && dragOver !== p) setDragOver(p);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const src =
                            dragging || e.dataTransfer.getData("text/plain");
                          const dst = p;
                          if (!src || !dst || src === dst) return;
                          setData((prev) => {
                            if (!prev) return prev;
                            const cur = Array.isArray(prev.photos)
                              ? prev.photos
                              : [];
                            const next = reorderLocal(cur, src, dst);
                            return { ...prev, photos: next };
                          });
                          setDragging(null);
                          setDragOver(null);
                          scheduleAutoSave();
                        }}
                        onDragEnd={() => {
                          setDragging(null);
                          setDragOver(null);
                        }}
                      >
                        <img
                          src={p}
                          className="w-full aspect-square object-cover transition-transform group-hover:scale-[1.03]"
                          alt=""
                        />
                        <div className="absolute top-2 left-2 flex gap-2">
                          {isAvatar ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-black/70 text-white">
                              <Star className="h-3 w-3" /> פרופיל
                            </span>
                          ) : (
                            <button
                              onClick={() => setAsAvatar(p)}
                              disabled={busy}
                              className={cls(
                                "h-8 px-2 rounded-full grid place-items-center bg-white/90 dark:bg-neutral-900/90 border border-black/10 dark:border-white/10 text-[12px] font-medium",
                                busy && "opacity-60",
                              )}
                              title="קבע כתמונת פרופיל"
                              type="button"
                            >
                              {busy ? "שומר…" : "קבע כפרופיל"}
                            </button>
                          )}
                          <button
                            onClick={() => deletePhoto(p)}
                            className="h-8 px-2 rounded-full grid place-items-center bg-white/90 dark:bg-neutral-900/90 border border-black/10 dark:border-white/10 text-[12px]"
                            title="מחק"
                            type="button"
                          >
                            מחק
                          </button>
                        </div>
                        {isDragging && (
                          <span className="absolute bottom-2 right-2 text-[11px] px-2 py-1 rounded-full bg-black/70 text-white">
                            גורר…
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {photos.length === 0 && (
                    <div className="opacity-60 text-sm">
                      אין עדיין תמונות בפרופיל.
                    </div>
                  )}
                </div>

                {/* פס פעולה לסדר */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="text-xs opacity-70">
                    {reorderSaving
                      ? "שומר סדר…"
                      : reorderDirty
                        ? "יש שינויים שלא נשמרו"
                        : "הסדר מעודכן"}
                  </div>
                  <button
                    disabled={!reorderDirty || reorderSaving}
                    onClick={saveReorder}
                    className={cls(
                      "ह-9 px-3 rounded-full text-sm",
                      reorderDirty
                        ? "bg-violet-600 text-white"
                        : "bg-black/5 dark:bg-white/5 opacity-60 cursor-not-allowed",
                    )}
                    type="button"
                    title="שמור סדר"
                  >
                    שמור סדר
                  </button>
                </div>
              </SectionCard>
            </div>
          )}

          {tab === "values" && (
            <div className="mt-6 grid gap-6">
              <SectionCard
                title="ערכים יהודיים"
                icon={<Globe className="h-5 w-5" />}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-1">
                    <span className="text-sm opacity-70">זרם ביהדות</span>
                    <select
                      value={edit.judaism_direction || ""}
                      onChange={(e) =>
                        setEdit((p) => ({
                          ...p,
                          judaism_direction:
                            (e.target.value as Direction) || null,
                        }))
                      }
                      className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90 w-full"
                    >
                      <option value="">—</option>
                      {Object.keys(DIR_LABEL).map((k) => (
                        <option key={k} value={k}>
                          {DIR_LABEL[k as Direction]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-1">
                    <span className="text-sm opacity-70">רמת כשרות</span>
                    <select
                      value={edit.kashrut_level || ""}
                      onChange={(e) =>
                        setEdit((p) => ({
                          ...p,
                          kashrut_level: (e.target.value as any) || null,
                        }))
                      }
                      className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90 w-full"
                    >
                      <option value="">—</option>
                      <option value="strict">{LEVEL_LABEL.strict}</option>
                      <option value="partial">{LEVEL_LABEL.partial}</option>
                      <option value="none">{LEVEL_LABEL.none}</option>
                    </select>
                  </div>

                  <div className="grid gap-1">
                    <span className="text-sm opacity-70">שמירת שבת</span>
                    <select
                      value={edit.shabbat_level || ""}
                      onChange={(e) =>
                        setEdit((p) => ({
                          ...p,
                          shabbat_level: (e.target.value as any) || null,
                        }))
                      }
                      className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90 w-full"
                    >
                      <option value="">—</option>
                      <option value="strict">{LEVEL_LABEL.strict}</option>
                      <option value="partial">{LEVEL_LABEL.partial}</option>
                      <option value="none">{LEVEL_LABEL.none}</option>
                    </select>
                  </div>

                  <div className="grid gap-1">
                    <span className="text-sm opacity-70">צניעות</span>
                    <select
                      value={edit.tzniut_level || ""}
                      onChange={(e) =>
                        setEdit((p) => ({
                          ...p,
                          tzniut_level: (e.target.value as any) || null,
                        }))
                      }
                      className="h-11 rounded-xl border px-3 bg:white/95 dark:bg-neutral-900/90 w-full"
                    >
                      <option value="">—</option>
                      <option value="strict">{LEVEL_LABEL.strict}</option>
                      <option value="partial">{LEVEL_LABEL.partial}</option>
                      <option value="none">{LEVEL_LABEL.none}</option>
                    </select>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {tab === "prefs" && (
            <div className="mt-6 grid gap-6">
              <SectionCard title="מטרות ושפות">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-1">
                    <span className="text-sm opacity-70">מטרה</span>
                    <select
                      value={edit.goals || ""}
                      onChange={(e) =>
                        setEdit((p) => ({
                          ...p,
                          goals: (e.target.value as any) || null,
                        }))
                      }
                      className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90 w-full"
                    >
                      <option value="">—</option>
                      <option value="serious">קשר רציני</option>
                      <option value="marriage">נישואין</option>
                      <option value="friendship">חברות</option>
                    </select>
                  </div>

                  <div className="grid gap-1">
                    <span className="text-sm opacity-70">שפות</span>
                    <TagInput
                      values={edit.languages || []}
                      placeholder="עברית, אנגלית…"
                      onChange={(vals) =>
                        setEdit((p) => ({ ...p, languages: vals }))
                      }
                    />
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {tab === "activity" && (
            <div className="mt-6 grid gap-6">
              <SectionCard title="פעילות ועדכונים">
                <div className="text-sm grid gap-2">
                  <div className="flex justify-between">
                    <span className="opacity-70">עודכן לאחרונה</span>
                    <span>
                      {data.updatedAt
                        ? new Date(data.updatedAt).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">סטטוס</span>
                    <span>{data.online ? "מחובר/ת" : "לא מחובר/ת"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">מנוי</span>
                    <span>
                      {subActive ? (tier || "free").toUpperCase() : "FREE"}{" "}
                      {data.subscription?.expiresAt
                        ? `· עד ${fmtDate(data.subscription.expiresAt)}`
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">רמת אמון</span>
                    <span>
                      {data.trust != null ? `${Math.round(data.trust)}%` : "—"}
                    </span>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {tab === "edit" && (
            <div className="mt-6 grid gap-6">
              <SectionCard
                title="עריכת פרופיל"
                icon={<Edit3 className="h-5 w-5" />}
              >
                <div className="grid gap-3">
                  <div className="grid gap-1">
                    <span className="text-sm opacity-70">אודות</span>
                    <textarea
                      value={edit.about_me ?? ""}
                      onChange={(e) =>
                        setEdit((p) => ({ ...p, about_me: e.target.value }))
                      }
                      rows={5}
                      className="w-full rounded-xl border px-3 py-2 bg-white/95 dark:bg-neutral-900/90"
                      placeholder="ספר/י על עצמך…"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-1">
                      <span className="text-sm opacity-70">מטרה</span>
                      <select
                        value={edit.goals || ""}
                        onChange={(e) =>
                          setEdit((p) => ({
                            ...p,
                            goals: (e.target.value as any) || null,
                          }))
                        }
                        className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90 w-full"
                      >
                        <option value="">—</option>
                        <option value="serious">קשר רציני</option>
                        <option value="marriage">נישואין</option>
                        <option value="friendship">חברות</option>
                      </select>
                    </div>

                    <div className="grid gap-1">
                      <span className="text-sm opacity-70">שפות</span>
                      <TagInput
                        values={edit.languages || []}
                        placeholder="עברית, אנגלית…"
                        onChange={(vals) =>
                          setEdit((p) => ({ ...p, languages: vals }))
                        }
                      />
                    </div>

                    <div className="grid gap-1">
                      <span className="text-sm opacity-70">זרם</span>
                      <select
                        value={edit.judaism_direction || ""}
                        onChange={(e) =>
                          setEdit((p) => ({
                            ...p,
                            judaism_direction:
                              (e.target.value as Direction) || null,
                          }))
                        }
                        className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90 w-full"
                      >
                        <option value="">—</option>
                        {Object.keys(DIR_LABEL).map((k) => (
                          <option key={k} value={k}>
                            {DIR_LABEL[k as Direction]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-1">
                      <span className="text-sm opacity-70">כשרות</span>
                      <select
                        value={edit.kashrut_level || ""}
                        onChange={(e) =>
                          setEdit((p) => ({
                            ...p,
                            kashrut_level: (e.target.value as any) || null,
                          }))
                        }
                        className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90 w-full"
                      >
                        <option value="">—</option>
                        <option value="strict">{LEVEL_LABEL.strict}</option>
                        <option value="partial">{LEVEL_LABEL.partial}</option>
                        <option value="none">{LEVEL_LABEL.none}</option>
                      </select>
                    </div>

                    <div className="grid gap-1">
                      <span className="text-sm opacity-70">שבת</span>
                      <select
                        value={edit.shabbat_level || ""}
                        onChange={(e) =>
                          setEdit((p) => ({
                            ...p,
                            shabbat_level: (e.target.value as any) || null,
                          }))
                        }
                        className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90 w-full"
                      >
                        <option value="">—</option>
                        <option value="strict">{LEVEL_LABEL.strict}</option>
                        <option value="partial">{LEVEL_LABEL.partial}</option>
                        <option value="none">{LEVEL_LABEL.none}</option>
                      </select>
                    </div>

                    <div className="grid gap-1">
                      <span className="text-sm opacity-70">צניעות</span>
                      <select
                        value={edit.tzniut_level || ""}
                        onChange={(e) =>
                          setEdit((p) => ({
                            ...p,
                            tzniut_level: (e.target.value as any) || null,
                          }))
                        }
                        className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90 w-full"
                      >
                        <option value="">—</option>
                        <option value="strict">{LEVEL_LABEL.strict}</option>
                        <option value="partial">{LEVEL_LABEL.partial}</option>
                        <option value="none">{LEVEL_LABEL.none}</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={saveProfile}
                      disabled={busySave}
                      className={cls(
                        "h-11 px-5 rounded-full inline-flex items-center gap-2",
                        "bg-gradient-to-r from-neutral-900 to-neutral-700 text-white",
                        "dark:from-white dark:to-neutral-300 dark:text-neutral-900",
                        "font-semibold transition hover:translate-y-[-1px]",
                        busySave && "opacity-70",
                      )}
                      type="button"
                    >
                      {busySave ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}{" "}
                      שמור שינויים
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* Toast */}
          {toastMsg && (
            <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-black text-white/95 dark:bg-white dark:text-black px-4 py-2 text-sm shadow-lg anim-fade-in">
              {toastMsg}
            </div>
          )}
        </>
      )}

      {/* Paywall Modal – מוסתר לחלוטין לאדמין */}
      {!isAdmin && paywall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 anim-fade-in">
          <div className="w-[min(96vw,560px)] rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-5 text-right">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold flex items-center gap-2">
                <Crown className="h-5 w-5 text-violet-600" />
                נדרש שדרוג
              </div>
              <button
                onClick={() => setPaywall(null)}
                className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="סגירה"
                type="button"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 opacity-80 text-sm leading-6">
              {paywall.feature === "chat"
                ? "כדי לפתוח צ׳אט צריך מסלול PRO או VIP."
                : "כדי לפתוח שיחת וידאו צריך מסלול PRO או VIP."}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a
                href={`/date/upgrade?src=profile&feature=${paywall.feature}`}
                className="h-11 px-5 rounded-full bg-violet-600 text-white inline-flex items-center justify-center font-semibold"
              >
                לשדרוג המסלול
              </a>
              <button
                onClick={() => setPaywall(null)}
                className="h-11 px-5 rounded-full border"
                type="button"
              >
                לא עכשיו
              </button>
            </div>
            <div className="mt-4 text-xs opacity-70">
              המנוי שלך כעת:{" "}
              <b>{myStatus === "active" ? myTier.toUpperCase() : "FREE"}</b>
              {myStatus !== "active" && " (לא פעיל)"}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <style jsx global>{`
        .anim-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        .btn-glow {
          box-shadow: 0 0 0 0 rgba(109, 74, 255, 0.5);
          animation: btnGlowPulse 1.8s ease-out infinite;
        }
        @keyframes btnGlowPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(109, 74, 255, 0.45);
          }
          70% {
            box-shadow: 0 0 0 14px rgba(109, 74, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(109, 74, 255, 0);
          }
        }
        .btn-wiggle {
          animation: wiggle 2.6s ease-in-out infinite;
        }
        @keyframes wiggle {
          0%,
          92%,
          100% {
            transform: translateY(0);
          }
          95% {
            transform: translateY(-1px);
          }
          98% {
            transform: translateY(1px);
          }
        }
        .gate-locked {
          filter: grayscale(0.1) brightness(0.95);
        }
      `}</style>
    </main>
  );
}

/** ===================== TagInput ===================== */
function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = React.useState("");
  function addFromDraft() {
    const raw = draft.trim();
    if (!raw) return;
    const parts = raw
      .split(/[,\n]/g)
      .map((s) => s.trim())
      .filter(Boolean);
    const set = new Set(values.map((v) => v.toLowerCase()));
    const next: string[] = [...values];
    for (const p of parts) if (!set.has(p.toLowerCase())) next.push(p);
    onChange(next);
    setDraft("");
  }
  function remove(i: number) {
    const next = [...values];
    next.splice(i, 1);
    onChange(next);
  }
  return (
    <div className="rounded-xl border bg-white/95 dark:bg-neutral-900/90 p-2 w-full">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <span
            key={v + i}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border bg-white/80 dark:bg-neutral-900/80"
          >
            {v}
            <button
              onClick={() => remove(i)}
              className="opacity-60 hover:opacity-100"
              type="button"
              aria-label={`הסר ${v}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addFromDraft()}
          placeholder={placeholder || "הוספת תגיות…"}
          className="h-10 flex-1 rounded-lg border px-3 bg-transparent"
        />
        <button
          onClick={addFromDraft}
          className="h-10 px-3 rounded-lg border"
          type="button"
        >
          הוסף
        </button>
      </div>
    </div>
  );
}
