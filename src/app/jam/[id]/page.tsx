// src/app/jam/[id]/page.tsx
"use client";

/**
 * דף קבוצה בודדת – גרסה מורחבת ויציבה:
 * - GET /api/jam/groups/:id – טעינת פרטי קבוצה + חברות
 * - GET /api/jam/groups/:id/members – רשימת חברים לקבוצה (עם presence)
 * - POST /api/jam/groups/:id – הצטרפות / יציאה (action: join / leave)
 * - טאב־בר: מידע כללי, חברים, תכנון ג'אם, JAM-AI, LIVE, וידאו 1 על 1
 * - שיתוף קבוצה / תכנית ג'אם לוואטסאפ
 * - JAM LIVE + חדרי וידאו 1:1 בתוך הדף (UI מוכן, חיבור ל-RTC/Sockets ב-TODO)
 * - חיבור לפאנל אדמין + MATY-DATE דרך APIs:
 *    • POST /api/admin/jam/events  – לוג/אנליטיקה/אלגוריתם
 *    • POST /api/date/jam-hook     – טריגר למנוע התאמות MATY-DATE
 */

import {
  Calendar,
  ExternalLink,
  Headphones,
  MapPin,
  Music2,
  Share2,
  User,
  Users,
  Video,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

type JamVisibility = "public" | "private" | "unlisted";
type JamRole = "owner" | "admin" | "member";

type JamGroup = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  city?: string;
  country?: string;
  genres?: string[];
  daws?: string[];
  purposes?: string[];
  skillsWanted?: string[];
  ownerId: string;
  adminIds: string[];
  memberCount: number;
  isOpen: boolean;
  visibility: JamVisibility;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};

type JamMembership = {
  _id?: string;
  userId: string;
  groupId: string;
  role: JamRole;
  instruments?: string[];
  skillLevel?: string;
  note?: string;
  joinedAt: string;
};

type ApiGetResponse = {
  ok: boolean;
  item?: JamGroup | null;
  membership?: JamMembership | null;
  isOwner?: boolean;
  isAdmin?: boolean;
  error?: string;
  message?: string;
};

type ApiActionResponse = {
  ok: boolean;
  message?: string;
  error?: string;
};

/** מבנה חבר לטאב MEMBERS  */
type JamMemberLite = {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: JamRole;
  instruments?: string[];
  skillLevel?: string;
  city?: string;
  gearNotes?: string;
  jamCount?: number;
  isOnline?: boolean;
};

type ApiMembersResponse = {
  ok: boolean;
  items?: JamMemberLite[];
  error?: string;
  message?: string;
};

type PlannerSong = {
  id: string;
  title: string;
  key?: string;
  bpm?: number | null;
  notes?: string;
};

type JamPlan = {
  date?: string;
  time?: string;
  locationName?: string;
  locationAddress?: string;
  notes?: string;
  songs: PlannerSong[];
};

// *** התאמה ל-Next 15.5 – params הוא Promise ***
type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

/* ========= HELPERS ========= */

function createEmptyPlan(): JamPlan {
  return { songs: [] };
}

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function skillLabel(v?: string | null) {
  if (!v) return "לא צוין";
  switch (v) {
    case "beginner":
      return "מתחיל";
    case "intermediate":
      return "ביניים";
    case "advanced":
      return "מתקדם";
    case "pro":
      return "מקצוען";
    default:
      return v;
  }
}

function roleLabel(r?: JamRole) {
  if (!r) return "Member";
  if (r === "owner") return "Owner";
  if (r === "admin") return "Admin";
  return "Member";
}

function shareToWhatsApp(text: string) {
  if (typeof window === "undefined") return;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

type LiveChatMessage = {
  id: string;
  from: string;
  text: string;
  at: string;
};

type TabId = "info" | "plan" | "live" | "rtc" | "members" | "ai";

const tabLabels: Record<TabId, string> = {
  info: "מידע כללי",
  plan: "תכנון ג׳אם",
  live: "JAM LIVE",
  rtc: "וידאו 1 על 1",
  members: "חברי הקבוצה",
  ai: "JAM-AI",
};

/* ========= ADMIN / DATE HOOKS ========= */

function notifyAdmin(groupId: string, action: string, payload?: any) {
  if (typeof fetch === "undefined") return;
  try {
    fetch("/api/admin/jam/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId,
        action,
        payload,
        at: new Date().toISOString(),
      }),
    }).catch(() => {});
  } catch {
    // לא קריטי ל-UI
  }
}

function notifyDateEngine(event: string, payload?: any) {
  if (typeof fetch === "undefined") return;
  try {
    fetch("/api/date/jam-hook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        payload,
        at: new Date().toISOString(),
      }),
    }).catch(() => {});
  } catch {
    // מתעלם
  }
}

/* ========= MAIN COMPONENT ========= */

export default function JamGroupPage({ params }: PageProps) {
  // *** כאן התיקון של ה-params Promise ***
  const { id: groupId } = React.use(params);

  const router = useRouter();

  const [group, setGroup] = React.useState<JamGroup | null>(null);
  const [membership, setMembership] = React.useState<JamMembership | null>(
    null,
  );
  const [isOwner, setIsOwner] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [actionLoading, setActionLoading] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);

  const [instrumentsInput, setInstrumentsInput] = React.useState("");
  const [noteInput, setNoteInput] = React.useState("");
  const [skillLevel, setSkillLevel] = React.useState("");

  const [tab, setTab] = React.useState<TabId>("info");

  const [plan, setPlan] = React.useState<JamPlan>(() => createEmptyPlan());

  // LIVE
  const [isLive, setIsLive] = React.useState(false);
  const [viewerCount, setViewerCount] = React.useState(0);
  const [liveChat, setLiveChat] = React.useState<LiveChatMessage[]>([]);
  const [liveChatInput, setLiveChatInput] = React.useState("");

  // RTC 1 על 1 – כרגע דמו (אפשר לחבר בהמשך ל-useRtcRoom)
  const [rtcStatus, setRtcStatus] = React.useState<
    "idle" | "connecting" | "in-call"
  >("idle");

  // חברי קבוצה
  const [members, setMembers] = React.useState<JamMemberLite[] | null>(null);
  const [membersLoading, setMembersLoading] = React.useState(false);
  const [membersError, setMembersError] = React.useState<string | null>(null);

  /* ========= LOAD GROUP ========= */

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/jam/groups/${groupId}`, {
        method: "GET",
        cache: "no-store",
      });

      // אם ה-API מחזיר HTML (404/500) => כאן תיגרם השגיאה שראית
      const json = (await res.json()) as ApiGetResponse;

      if (!res.ok || !json.ok || !json.item) {
        throw new Error(json.message || json.error || "הקבוצה לא נמצאה");
      }

      setGroup(json.item);
      setMembership(json.membership || null);
      setIsOwner(!!json.isOwner);
      setIsAdmin(!!json.isAdmin);

      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(`mm:jam:plan:${json.item._id}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as JamPlan;
            if (parsed && Array.isArray(parsed.songs)) {
              setPlan(parsed);
            }
          } catch {
            // מתעלם
          }
        }
      }
    } catch (err: any) {
      console.error("[JAM.GROUP.PAGE] load error:", err);
      setError(err?.message || "שגיאה בטעינת הקבוצה");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  React.useEffect(() => {
    if (!groupId) return;
    load();
  }, [groupId, load]);

  /* ========= LOAD MEMBERS ========= */

  const loadMembers = React.useCallback(async () => {
    if (!groupId) return;
    try {
      setMembersLoading(true);
      setMembersError(null);

      const res = await fetch(
        `/api/jam/groups/${groupId}/members?withPresence=1`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const json = (await res.json()) as ApiMembersResponse;

      if (!res.ok || !json.ok) {
        throw new Error(json.message || json.error || "שגיאה בטעינת חברים");
      }

      setMembers(json.items || []);
    } catch (err: any) {
      console.error("[JAM.GROUP.MEMBERS] error:", err);
      setMembersError(err?.message || "שגיאה בטעינת חברים");
    } finally {
      setMembersLoading(false);
    }
  }, [groupId]);

  React.useEffect(() => {
    if (tab === "members" && members === null && !membersLoading) {
      loadMembers();
    }
  }, [tab, members, membersLoading, loadMembers]);

  /* ========= SAVE PLAN TO LOCALSTORAGE ========= */

  React.useEffect(() => {
    if (!group?._id) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        `mm:jam:plan:${group._id}`,
        JSON.stringify(plan),
      );
    } catch {
      // מתעלם
    }
  }, [group?._id, plan]);

  /* ========= LIVE "SOCKET" SIMULATION ========= */

  React.useEffect(() => {
    if (!groupId) return;

    notifyAdmin(groupId, "jam_group_open", { tab });

    if (typeof window === "undefined") return;
    let tick = 0;
    const interval = window.setInterval(() => {
      tick += 1;
      setViewerCount((prev) => {
        const base = prev || 3;
        const delta = tick % 2 === 0 ? 1 : -1;
        const next = base + delta;
        return Math.max(1, next);
      });
    }, 8000);

    return () => {
      window.clearInterval(interval);
    };
  }, [groupId, tab]);

  /* ========= ACTION JOIN / LEAVE ========= */

  const handleAction = async (action: "join" | "leave") => {
    try {
      setActionLoading(true);
      setActionMessage(null);

      const payload: any = { action };

      if (action === "join") {
        const instruments =
          instrumentsInput
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean) || [];
        payload.instruments = instruments;
        if (skillLevel) payload.skillLevel = skillLevel;
        if (noteInput.trim()) payload.note = noteInput.trim();
      }

      const res = await fetch(`/api/jam/groups/${groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as ApiActionResponse;

      if (!res.ok || !json.ok) {
        if (res.status === 401) {
          throw new Error("צריך להיות מחובר כדי לבצע פעולה זו");
        }
        throw new Error(json.message || json.error || "שגיאה בפעולה");
      }

      setActionMessage(
        json.message || (action === "join" ? "הצטרפת לקבוצה" : "יצאת מהקבוצה"),
      );

      notifyAdmin(groupId, `jam_${action}`, {
        instruments: payload.instruments,
        skillLevel: payload.skillLevel,
      });

      if (action === "join") {
        notifyDateEngine("jam_join", {
          groupId,
          instruments: payload.instruments,
          skillLevel: payload.skillLevel,
        });
      }

      await load();
      if (tab === "members") {
        loadMembers();
      }
    } catch (err: any) {
      console.error("[JAM.GROUP.ACTION] error:", err);
      setActionMessage(err?.message || "שגיאה בפעולת הקבוצה");
    } finally {
      setActionLoading(false);
    }
  };

  /* ========= PLAN HELPERS ========= */

  function updatePlan(updater: (prev: JamPlan) => JamPlan) {
    setPlan((prev) => updater(prev));
  }

  function addSongRow() {
    updatePlan((prev) => ({
      ...prev,
      songs: [
        ...prev.songs,
        { id: uuid(), title: "", key: "", bpm: undefined, notes: "" },
      ],
    }));
  }

  function updateSong(id: string, patch: Partial<PlannerSong>) {
    updatePlan((prev) => ({
      ...prev,
      songs: prev.songs.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }

  function removeSong(id: string) {
    updatePlan((prev) => ({
      ...prev,
      songs: prev.songs.filter((s) => s.id !== id),
    }));
  }

  function exportPlanToWhatsApp() {
    if (!group) return;

    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://maty";

    const lines: string[] = [];

    lines.push(`🎵 תוכנית ג׳אם – ${group.title}`);

    if (plan.date || plan.time) {
      const whenParts: string[] = [];
      if (plan.date) whenParts.push(plan.date);
      if (plan.time) whenParts.push(plan.time);
      lines.push(`🗓 מתי: ${whenParts.join(" • ")}`);
    }

    if (plan.locationName || plan.locationAddress) {
      const whereParts: string[] = [];
      if (plan.locationName) whereParts.push(plan.locationName);
      if (plan.locationAddress) whereParts.push(plan.locationAddress);
      lines.push(`📍 איפה: ${whereParts.join(" – ")}`);
    }

    if (plan.notes) {
      lines.push("");
      lines.push("הערות כלליות:");
      lines.push(plan.notes);
    }

    if (plan.songs.length) {
      lines.push("");
      lines.push("סט־ליסט מוצע:");
      plan.songs.forEach((s, idx) => {
        const parts: string[] = [];
        parts.push(`${idx + 1}. ${s.title || "שיר ללא שם"}`);
        if (s.key) parts.push(`סולם: ${s.key}`);
        if (s.bpm) parts.push(`BPM: ${s.bpm}`);
        const base = parts.join(" • ");
        if (s.notes) {
          lines.push(`${base} – ${s.notes}`);
        } else {
          lines.push(base);
        }
      });
    }

    lines.push("");
    lines.push(`🔗 קישור לקבוצה: ${origin}/jam/${group._id}`);

    notifyAdmin(groupId, "jam_plan_share_whatsapp", {
      songsCount: plan.songs.length,
    });

    shareToWhatsApp(lines.join("\n"));
  }

  /* ========= LIVE HELPERS ========= */

  function toggleLive() {
    setIsLive((prev) => {
      const next = !prev;
      notifyAdmin(groupId, next ? "jam_live_start" : "jam_live_stop", {
        viewerCount,
      });
      return next;
    });
  }

  function handleSendLiveChat() {
    const text = liveChatInput.trim();
    if (!text) return;

    const msg: LiveChatMessage = {
      id: uuid(),
      from: "אני",
      text,
      at: new Date().toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setLiveChat((prev) => [...prev.slice(-30), msg]);
    setLiveChatInput("");

    notifyAdmin(groupId, "jam_live_chat_message", { text });
  }

  /* ========= RTC HELPERS ========= */

  function startPrivateCall(peerId: string) {
    setRtcStatus("connecting");

    notifyAdmin(groupId, "jam_rtc_start", {
      peerId,
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mm:rtc:open", {
          detail: {
            area: "jam",
            groupId,
            peerId,
          },
        }),
      );
    }

    setTimeout(() => {
      setRtcStatus("in-call");
    }, 800);
  }

  function endPrivateCall() {
    setRtcStatus("idle");
    notifyAdmin(groupId, "jam_rtc_end");
  }

  /* ========= ADMIN PANEL ========= */

  function openAdminForGroup() {
    if (!group) return;
    notifyAdmin(groupId, "jam_admin_open_panel");
    if (typeof window !== "undefined") {
      window.location.href = `/admin/jam?groupId=${group._id}`;
    }
  }

  /* ========= LOADING / ERROR ========= */

  if (loading && !group && !error) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
          <p className="text-sm text-slate-300">טוען את קבוצת ה-JAM...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
          <Link
            href="/jam"
            className="mb-2 inline-flex w-max items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
          >
            ← חזרה לכל קבוצות JAM
          </Link>
          <div className="rounded-xl border border-red-500/60 bg-red-900/20 p-4 text-sm text-red-100">
            {error || "הקבוצה לא נמצאה"}
          </div>
        </div>
      </div>
    );
  }

  const created = group.createdAt ? new Date(group.createdAt) : null;
  const isMember = !!membership;
  const memberRole = membership?.role;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://maty";
  const groupUrl = `${origin}/jam/${group._id}`;

  function shareGroup() {
    const lines: string[] = [];
    lines.push(`🎵 קבוצת JAM: ${group.title}`);
    if (group.city) {
      lines.push(`📍 עיר: ${group.city}`);
    }
    lines.push(`🔗 קישור להצטרפות: ${groupUrl}`);
    notifyAdmin(groupId, "jam_group_share_whatsapp");
    shareToWhatsApp(lines.join("\n"));
  }

  /* ========= RENDER ========= */

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-950 to-black text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:py-10">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-4 shadow-[0_18px_80px_rgba(15,23,42,.8)]">
          {/* HEADER BAR */}
          <div className="flex flex-col gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/jam"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
                >
                  ← חזרה לרשימת JAM
                </Link>
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
                >
                  רענון
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={openAdminForGroup}
                    className="rounded-full border border-amber-400/70 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-100 hover:bg-amber-500/25"
                  >
                    פתח פאנל אדמין לקבוצה
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                {isOwner && (
                  <span className="rounded-full bg-emerald-900/60 px-3 py-1 text-emerald-100">
                    אתה בעל הקבוצה
                  </span>
                )}
                {!isOwner && isAdmin && (
                  <span className="rounded-full bg-sky-900/60 px-3 py-1 text-sky-100">
                    אתה אדמין בקבוצה
                  </span>
                )}
                {isMember && (
                  <span className="rounded-full bg-slate-900/80 px-3 py-1">
                    התפקיד:{" "}
                    <span className="font-semibold text-slate-100">
                      {memberRole === "owner"
                        ? "בעלים"
                        : memberRole === "admin"
                          ? "אדמין"
                          : "חבר"}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="mt-1 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Music2 className="h-6 w-6 text-emerald-400" />
                  <h1 className="text-2xl font-bold tracking-tight">
                    {group.title}
                  </h1>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  {group.city && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {group.city}
                        {group.country ? `, ${group.country}` : ""}
                      </span>
                    </span>
                  )}
                  <span className="rounded-full bg-slate-900/80 px-2 py-0.5">
                    חברים:{" "}
                    <span className="font-semibold text-emerald-300">
                      {group.memberCount}
                    </span>
                  </span>
                  <span className="rounded-full bg-slate-900/80 px-2 py-0.5">
                    {group.visibility === "public"
                      ? "קבוצה ציבורית"
                      : group.visibility === "private"
                        ? "קבוצה פרטית"
                        : "קבוצה נסתרת"}
                  </span>
                  {group.isOpen ? (
                    <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-emerald-200">
                      הצטרפות פתוחה
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-amber-200">
                      קבוצה סגורה
                    </span>
                  )}
                  {created && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>נוצרה: {created.toLocaleDateString("he-IL")}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  {!isMember ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleAction("join")}
                      className="rounded-xl border border-emerald-500/60 bg-emerald-500/30 px-4 py-1.5 text-xs font-semibold text-emerald-50 hover:bg-emerald-500/40 disabled:opacity-60"
                    >
                      {actionLoading ? "מצטרף..." : "הצטרף לקבוצה"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleAction("leave")}
                      className="rounded-xl border border-red-500/60 bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-50 hover:bg-red-500/30 disabled:opacity-60"
                    >
                      {actionLoading ? "יוצא..." : "צא מהקבוצה"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={shareGroup}
                    className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/60 bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-500/25"
                  >
                    <Share2 className="h-3 w-3" />
                    שתף בוואטסאפ
                  </button>
                </div>
                {actionMessage && (
                  <div className="text-[11px] text-slate-300">
                    {actionMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TAB BAR */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs">
            {(["info", "plan", "live", "rtc", "members", "ai"] as TabId[]).map(
              (t) => {
                const active = tab === t;
                const Icon =
                  t === "info"
                    ? Headphones
                    : t === "plan"
                      ? Calendar
                      : t === "live"
                        ? Video
                        : t === "rtc"
                          ? ExternalLink
                          : t === "members"
                            ? Users
                            : Wand2;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={[
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1.5",
                      active
                        ? "border-emerald-400 bg-emerald-500/20 text-emerald-50"
                        : "border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-400/70 hover:text-emerald-100",
                    ].join(" ")}
                  >
                    <Icon className="h-3 w-3" />
                    {tabLabels[t]}
                  </button>
                );
              },
            )}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTab("live")}
                className="inline-flex items-center gap-1 rounded-full border border-red-500/70 bg-red-500/15 px-3 py-1.5 text-[11px] text-red-100 hover:bg-red-500/25"
              >
                <Video className="h-3 w-3" />
                JAM LIVE
              </button>
              <button
                type="button"
                onClick={() => setTab("rtc")}
                className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-200 hover:border-sky-400/70 hover:text-sky-100"
              >
                <ExternalLink className="h-3 w-3" />
                חדר וידאו 1 על 1
              </button>
            </div>
          </div>

          {/* TAB: INFO */}
          {tab === "info" && (
            <>
              <section className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <h2 className="mb-2 text-sm font-semibold text-slate-50">
                    על הקבוצה
                  </h2>
                  <p className="whitespace-pre-wrap text-sm text-slate-200">
                    {group.description || "לא נכתב עדיין תיאור לקבוצה."}
                  </p>
                </div>

                <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:w-64">
                  <h2 className="mb-2 text-sm font-semibold text-slate-50">
                    סגנון וצרכים
                  </h2>
                  <div className="flex flex-col gap-2 text-xs text-slate-200">
                    <div>
                      <span className="font-semibold">ז'אנרים:</span>{" "}
                      {group.genres && group.genres.length > 0 ? (
                        <span>{group.genres.join(", ")}</span>
                      ) : (
                        <span className="text-slate-400">לא הוגדרו</span>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold">מטרות:</span>{" "}
                      {group.purposes && group.purposes.length > 0 ? (
                        <span>{group.purposes.join(", ")}</span>
                      ) : (
                        <span className="text-slate-400">לא הוגדרו</span>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold">DAW / ציוד:</span>{" "}
                      {group.daws && group.daws.length > 0 ? (
                        <span>{group.daws.join(", ")}</span>
                      ) : (
                        <span className="text-slate-400">לא הוגדר</span>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold">מחפשים:</span>{" "}
                      {group.skillsWanted && group.skillsWanted.length > 0 ? (
                        <span>{group.skillsWanted.join(", ")}</span>
                      ) : (
                        <span className="text-slate-400">לא צויין</span>
                      )}
                    </div>
                    {group.tags && group.tags.length > 0 && (
                      <div>
                        <span className="font-semibold">תגיות:</span>{" "}
                        <span>{group.tags.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-50">
                  <User className="h-4 w-4 text-emerald-400" />
                  מי אתה במוזיקה? (לא חובה, אבל מומלץ לפני הצטרפות)
                </h2>
                <p className="mb-3 text-xs text-slate-300">
                  כאן אתה יכול להגדיר איזה כלי אתה מנגן, מה הרמה שלך, ולהוסיף
                  כמה מילים על עצמך. המידע הזה נשלח בעת ההצטרפות לקבוצה, ואפשר
                  להשתמש בו גם ב־MATY-DATE.
                </p>

                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      כלי נגינה / תפקידים (מופרדים בפסיקים)
                    </label>
                    <input
                      value={instrumentsInput}
                      onChange={(e) => setInstrumentsInput(e.target.value)}
                      placeholder="קלידים, גיטרה חשמלית, DJ, מתופף..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      רמת ניסיון
                    </label>
                    <select
                      value={skillLevel}
                      onChange={(e) => setSkillLevel(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400"
                    >
                      <option value="">לא לציין</option>
                      <option value="beginner">מתחיל</option>
                      <option value="intermediate">ביניים</option>
                      <option value="advanced">מתקדם</option>
                      <option value="pro">מקצוען</option>
                    </select>
                    {membership?.skillLevel && (
                      <div className="mt-1 text-[11px] text-slate-400">
                        כרגע שמור:{" "}
                        <span className="font-semibold text-slate-100">
                          {skillLabel(membership.skillLevel)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-300">
                    כמה מילים על עצמך (לא חובה)
                  </label>
                  <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    rows={3}
                    placeholder="ספר כמה מילים על הניסיון שלך, סגנון שאתה אוהב, ומה אתה מחפש בקבוצה הזו..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="mt-3 flex gap-2 text-[11px] text-slate-400">
                  <span>
                    כדי שהמידע ישמר – תלחץ שוב על כפתור "הצטרף לקבוצה". זה גם
                    מזין את האלגוריתם של MATY-DATE.
                  </span>
                </div>
              </section>
            </>
          )}

          {/* TAB: PLAN */}
          {tab === "plan" && (
            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-50">
                <Calendar className="h-4 w-4 text-emerald-400" />
                תכנון ג׳אם לקבוצה הזו
              </h2>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-semibold text-slate-300">
                        תאריך
                      </label>
                      <input
                        type="date"
                        value={plan.date || ""}
                        onChange={(e) =>
                          updatePlan((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div className="w-28">
                      <label className="mb-1 block text-xs font-semibold text-slate-300">
                        שעה
                      </label>
                      <input
                        type="time"
                        value={plan.time || ""}
                        onChange={(e) =>
                          updatePlan((prev) => ({
                            ...prev,
                            time: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-semibold text-slate-300">
                        שם מקום (אולפן / בית / חצר)
                      </label>
                      <input
                        value={plan.locationName || ""}
                        onChange={(e) =>
                          updatePlan((prev) => ({
                            ...prev,
                            locationName: e.target.value,
                          }))
                        }
                        placeholder="אולפן MATY, מחסן בולם 6, בית של X..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      כתובת מלאה
                    </label>
                    <input
                      value={plan.locationAddress || ""}
                      onChange={(e) =>
                        updatePlan((prev) => ({
                          ...prev,
                          locationAddress: e.target.value,
                        }))
                      }
                      placeholder="רחוב, עיר, קומה, הוראות חניה..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">
                    הערות כלליות (ציוד, חניה, כשרות, עוצמה וכו')
                  </label>
                  <textarea
                    rows={6}
                    value={plan.notes || ""}
                    onChange={(e) =>
                      updatePlan((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="מה להביא? כמה PA? האם להביא PA5X / DJ / תופים? שעת הגעה, סידורי חניה, שכנים..."
                    className="h-full w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-200">
                  סט־ליסט / רצף שירים
                </h3>
                <button
                  type="button"
                  onClick={addSongRow}
                  className="rounded-full border border-emerald-500/70 bg-emerald-500/20 px-3 py-1 text-xs text-emerald-100 hover:bg-emerald-500/30"
                >
                  + הוסף שיר
                </button>
              </div>

              {plan.songs.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
                  עדיין לא הוספת שירים. לחץ על{" "}
                  <span className="font-semibold">+ הוסף שיר</span> כדי לבנות
                  סט־ליסט.
                </div>
              )}

              {plan.songs.length > 0 && (
                <div className="space-y-2">
                  {plan.songs.map((s, idx) => (
                    <div
                      key={s.id}
                      className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-200">#{idx + 1} – שיר</span>
                        <button
                          type="button"
                          onClick={() => removeSong(s.id)}
                          className="text-[11px] text-red-300 hover:text-red-200"
                        >
                          הסר
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex-1 min-w-[140px]">
                          <label className="mb-1 block text-[11px] text-slate-300">
                            שם השיר
                          </label>
                          <input
                            value={s.title}
                            onChange={(e) =>
                              updateSong(s.id, { title: e.target.value })
                            }
                            placeholder="יחי אדוננו, מחרוזת חסידית, ריקוד מזרחי..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-emerald-400"
                          />
                        </div>
                        <div className="w-24">
                          <label className="mb-1 block text-[11px] text-slate-300">
                            סולם
                          </label>
                          <input
                            value={s.key || ""}
                            onChange={(e) =>
                              updateSong(s.id, { key: e.target.value })
                            }
                            placeholder="Dm, Gm..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-emerald-400"
                          />
                        </div>
                        <div className="w-24">
                          <label className="mb-1 block text-[11px] text-slate-300">
                            BPM
                          </label>
                          <input
                            type="number"
                            value={s.bpm ?? ""}
                            onChange={(e) =>
                              updateSong(s.id, {
                                bpm: e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              })
                            }
                            placeholder="120"
                            className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-emerald-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-300">
                          הערות (מי מוביל, מעברים, סולואים וכו')
                        </label>
                        <input
                          value={s.notes || ""}
                          onChange={(e) =>
                            updateSong(s.id, { notes: e.target.value })
                          }
                          placeholder="קלידן מוביל, מעבר ל'יחי', להוריד טיימפו באמצע, סולו גיטרה בסיום..."
                          className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={exportPlanToWhatsApp}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-500/70 bg-emerald-500/20 px-4 py-1.5 text-xs text-emerald-100 hover:bg-emerald-500/30"
                >
                  <Share2 className="h-3 w-3" />
                  שתף את תכנית הג'אם בוואטסאפ
                </button>
                <Link
                  href="/music"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:border-emerald-400/70 hover:text-emerald-100"
                >
                  <Headphones className="h-3 w-3" />
                  לפתוח רשימת שירים ב-MATY-MUSIC
                </Link>
              </div>
            </section>
          )}

          {/* TAB: LIVE */}
          {tab === "live" && (
            <section className="space-y-4 rounded-2xl border border-red-500/40 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-50">
                  <Video className="h-4 w-4 text-red-400" />
                  JAM LIVE – שידור חי לקבוצה
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="rounded-full bg-slate-950/90 px-3 py-1">
                    צופים:{" "}
                    <span className="font-semibold text-emerald-300">
                      {viewerCount}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={toggleLive}
                    className={[
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold",
                      isLive
                        ? "border-red-500 bg-red-600/80 text-red-50"
                        : "border-red-500/70 bg-red-500/10 text-red-100 hover:bg-red-500/25",
                    ].join(" ")}
                  >
                    <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                    {isLive ? "עצור שידור" : "התחל שידור חי"}
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/90 p-3">
                  <div className="relative flex h-56 items-center justify-center rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-black">
                    <div className="absolute inset-2 rounded-2xl border border-slate-800/80" />
                    <div className="relative z-10 flex flex-col items-center gap-2 text-xs text-slate-300">
                      <span className="rounded-full bg-slate-900/90 px-3 py-1 text-[11px] text-slate-200">
                        כאן תופיע המצלמה שלך / מסך שידור
                      </span>
                      <span className="text-[10px] text-slate-400">
                        חיבור אמיתי דרך WebRTC / useRtcRoom – כשהוא מוכן.
                      </span>
                    </div>
                    {isLive && (
                      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-red-600 px-3 py-0.5 text-[11px] font-semibold text-white">
                        <span className="inline-block h-2 w-2 rounded-full bg-white" />
                        LIVE
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    השידור החי הזה מחובר גם לצ'אט של הקבוצה, ויכול בעתיד להופיע
                    בעמוד CLUB / MUSIC.
                  </p>
                </div>

                <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/90 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-200">
                    <span>צ'אט שידור חי</span>
                    <span className="text-[10px] text-slate-400">
                      הודעות אחרונות (עד 30)
                    </span>
                  </div>
                  <div className="flex-1 space-y-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/80 p-2 text-[11px]">
                    {liveChat.length === 0 && (
                      <div className="text-slate-500">
                        עדיין אין הודעות בשידור הזה.
                      </div>
                    )}
                    {liveChat.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-start justify-between gap-2 rounded-lg bg-slate-900/80 px-2 py-1"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-100">
                            {m.from}
                          </span>
                          <span className="text-slate-200">{m.text}</span>
                        </div>
                        <span className="mt-0.5 text-[10px] text-slate-500">
                          {m.at}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-1">
                    <input
                      value={liveChatInput}
                      onChange={(e) => setLiveChatInput(e.target.value)}
                      placeholder="כתוב הודעה לצ'אט השידור..."
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-50 outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={handleSendLiveChat}
                      className="rounded-xl border border-emerald-500/70 bg-emerald-500/20 px-3 py-1.5 text-[11px] text-emerald-100 hover:bg-emerald-500/30"
                    >
                      שלח
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB: RTC */}
          {tab === "rtc" && (
            <section className="space-y-4 rounded-2xl border border-sky-500/40 bg-slate-900/80 p-4">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-50">
                <ExternalLink className="h-4 w-4 text-sky-400" />
                חדר וידאו 1 על 1 – JAM LIVE אישי
              </h2>
              <p className="text-xs text-slate-300">
                כאן אתה מתחבר לשיחת וידאו פרטית עם אחד החברים בקבוצה, דרך אותו
                מנוע RTC שיש לך ב־CLUB. כרגע יש UI ומצב, ואת החיבור ל־useRtcRoom
                / WebRTC אתה משלים אחר כך.
              </p>

              <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 md:flex-row">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-200">
                    <span>מצב שיחה</span>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-[11px]",
                        rtcStatus === "idle"
                          ? "bg-slate-900/80 text-slate-200"
                          : rtcStatus === "connecting"
                            ? "bg-sky-900/70 text-sky-100"
                            : "bg-emerald-900/70 text-emerald-100",
                      ].join(" ")}
                    >
                      {rtcStatus === "idle"
                        ? "מוכן לשיחה"
                        : rtcStatus === "connecting"
                          ? "מתחבר..."
                          : "בשיחה"}
                    </span>
                  </div>

                  <div className="relative mt-1 flex h-48 items-center justify-center rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-black">
                    <div className="absolute inset-2 rounded-2xl border border-slate-800/80" />
                    <div className="relative z-10 flex flex-col items-center gap-2 text-xs text-slate-300">
                      <span className="rounded-full bg-slate-900/90 px-3 py-1 text-[11px] text-slate-200">
                        כאן תופיע שיחת הווידאו 1 על 1 (RTC)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        כרגע זה דמו; החיבור בפועל דרך useRtcRoom / PeerJS /
                        WebRTC.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full space-y-3 md:w-64">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-[11px] text-slate-300">
                    <div className="mb-2 font-semibold text-slate-100">
                      איך זה עובד?
                    </div>
                    <ul className="list-disc space-y-1 pl-4">
                      <li>בוחרים חבר מהטאב "חברי הקבוצה".</li>
                      <li>
                        לוחצים על{" "}
                        <span className="font-semibold">
                          "הזמן לג׳אם עכשיו"
                        </span>
                        .
                      </li>
                      <li>
                        זה מפעיל אירוע{" "}
                        <code className="text-[10px] text-sky-300">
                          mm:rtc:open
                        </code>{" "}
                        עם groupId + peerId.
                      </li>
                      <li>
                        widget גלובלי של RTC פותח חדר, ואתה מחבר אותו ל־UI.
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={rtcStatus !== "idle"}
                      onClick={() => startPrivateCall("demo-peer-id")}
                      className="rounded-full border border-sky-500/80 bg-sky-500/20 px-3 py-1.5 text-xs text-sky-100 hover:bg-sky-500/30 disabled:opacity-50"
                    >
                      התחבר לדמו של שיחה (peer-id דמה)
                    </button>
                    <button
                      type="button"
                      disabled={rtcStatus === "idle"}
                      onClick={endPrivateCall}
                      className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:border-red-400/70 hover:text-red-200 disabled:opacity-50"
                    >
                      נתק שיחה
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB: MEMBERS */}
          {tab === "members" && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-50">
                <Users className="h-4 w-4 text-sky-400" />
                חברי הקבוצה
              </h2>
              <p className="mb-3 text-xs text-slate-300">
                רשימה חיה מהשרת (
                <code className="text-[10px] text-sky-300">
                  GET /api/jam/groups/{group._id}/members
                </code>
                ) – אפשר למיין לפי רמה, כלי, נוכחות, ולהזמין לשיחת JAM פרטית או
                MATY-DATE.
              </p>

              {membersLoading && !members && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-200">
                  טוען רשימת חברים...
                </div>
              )}

              {membersError && (
                <div className="mb-3 rounded-xl border border-red-500/60 bg-red-900/30 p-3 text-xs text-red-100">
                  {membersError}
                </div>
              )}

              {members && members.length === 0 && !membersLoading && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-300">
                  עוד אין חברים בקבוצה הזו. כשיגיעו – הם יופיעו כאן.
                </div>
              )}

              {members && members.length > 0 && (
                <>
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                    <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1">
                      סה"כ חברים:{" "}
                      <span className="font-semibold text-emerald-300">
                        {members.length}
                      </span>
                    </span>
                    <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1">
                      אונליין כרגע:{" "}
                      <span className="font-semibold text-sky-300">
                        {members.filter((m) => m.isOnline).length}
                      </span>
                    </span>
                    <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1">
                      Owner / Admin:{" "}
                      <span className="font-semibold text-amber-300">
                        {
                          members.filter(
                            (m) => m.role === "owner" || m.role === "admin",
                          ).length
                        }
                      </span>
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {members.map((m) => (
                      <article
                        key={m.userId}
                        className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-700 bg-slate-900">
                            {m.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.avatarUrl}
                                alt={m.displayName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">
                                {m.displayName
                                  .split(" ")
                                  .map((p) => p[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                            )}
                            {m.isOnline && (
                              <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border border-slate-900 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]" />
                            )}
                          </div>
                          <div className="flex flex-1 flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-50">
                                {m.displayName}
                              </span>
                              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300">
                                {roleLabel(m.role)}
                              </span>
                              {m.isOnline && (
                                <span className="rounded-full bg-emerald-900/60 px-2 py-0.5 text-[10px] text-emerald-200">
                                  ONLINE
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                              {m.city && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {m.city}
                                </span>
                              )}
                              {m.skillLevel && (
                                <span>
                                  רמה:{" "}
                                  <span className="text-slate-100">
                                    {skillLabel(m.skillLevel)}
                                  </span>
                                </span>
                              )}
                              {typeof m.jamCount === "number" && (
                                <span>
                                  JAMים:{" "}
                                  <span className="text-slate-100">
                                    {m.jamCount}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {m.instruments && m.instruments.length > 0 && (
                          <div className="text-[11px] text-slate-200">
                            <span className="font-semibold text-slate-100">
                              כלי / תפקידים:
                            </span>{" "}
                            {m.instruments.join(", ")}
                          </div>
                        )}

                        {m.gearNotes && (
                          <div className="text-[11px] text-slate-200">
                            <span className="font-semibold text-slate-100">
                              ציוד:
                            </span>{" "}
                            {m.gearNotes}
                          </div>
                        )}

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => startPrivateCall(m.userId)}
                            className="inline-flex items-center gap-1 rounded-full border border-sky-500/80 bg-sky-500/20 px-3 py-1 text-sky-100 hover:bg-sky-500/30"
                          >
                            <Video className="h-3 w-3" />
                            הזמן לג׳אם עכשיו
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              notifyAdmin(groupId, "jam_member_dm_click", {
                                peerId: m.userId,
                              });
                              if (typeof window !== "undefined") {
                                window.dispatchEvent(
                                  new CustomEvent("mm:date:open-chat", {
                                    detail: {
                                      peerId: m.userId,
                                      peerName: m.displayName,
                                      from: "jam_members",
                                      groupId,
                                    },
                                  }),
                                );
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-500/80 bg-emerald-500/15 px-3 py-1 text-emerald-100 hover:bg-emerald-500/25"
                          >
                            <Headphones className="h-3 w-3" />
                            הודעה פרטית / MATY-DATE
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {/* TAB: AI */}
          {tab === "ai" && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-50">
                <Wand2 className="h-4 w-4 text-indigo-400" />
                MATY-AI – מאמן ג'אם לקבוצה הזו
              </h2>
              <p className="mb-3 text-xs text-slate-300">
                כאן אתה משתמש באותו אסיסטנט כללי של MATY, אבל במוד "JAM GROUP".
                כשלוחצים על הכפתור, האסיסטנט מקבל הקשר על שם הקבוצה, עיר,
                ז'אנרים ותכנית הג'אם (אם מילאת) – ויכול לעזור לך לבנות סט־ליסט,
                חלוקת תפקידים, רעיונות לשירים ועוד.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!group) return;
                    notifyAdmin(groupId, "jam_ai_open", {
                      city: group.city,
                      genres: group.genres,
                    });

                    if (typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("mm:assistant:open", {
                          detail: {
                            area: "jam",
                            mode: "group",
                            groupId: group._id,
                            groupTitle: group.title,
                            city: group.city,
                            genres: group.genres,
                            plan,
                          },
                        }),
                      );
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-500/70 bg-indigo-500/20 px-4 py-2 text-xs font-semibold text-indigo-100 hover:bg-indigo-500/30"
                >
                  <Wand2 className="h-4 w-4" />
                  פתח JAM-AI לקבוצה הזו
                </button>
                <button
                  type="button"
                  onClick={exportPlanToWhatsApp}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-500/70 bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-500/25"
                >
                  <Share2 className="h-3 w-3" />
                  שתף את תכנית הג'אם בוואטסאפ
                </button>
                <Link
                  href="/music"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:border-emerald-400/70 hover:text-emerald-100"
                >
                  <Headphones className="h-3 w-3" />
                  דפדף בשירים באתר MATY-MUSIC
                </Link>
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-[11px] text-slate-300">
                <div>טיפים לשימוש ב-AI:</div>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    תן לו מידע כמו: "אנחנו ג'אם חתונות חב"ד, 2 קלידים, גיטרה,
                    בס, תופים".
                  </li>
                  <li>בקש: "תן לי סט-ליסט ל-45 דקות, כולל מעבר איטי באמצע".</li>
                  <li>
                    אפשר לבקש גם רעיונות לסאונד ל-PA5X, סגנון דינמי, טמפו
                    וכדומה.
                  </li>
                  <li>
                    כל שיחה כזו נרשמת לאדמין דרך /api/admin/jam/events – אפשר
                    לעשות אנליטיקות ואלגוריתם המלצות.
                  </li>
                </ul>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
