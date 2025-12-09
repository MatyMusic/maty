// // src/components/avatars/AvatarMusicClient.tsx
// "use client";

// import { useAdmin } from "@/contexts/admin";
// import { useEffect, useMemo, useState } from "react";

// type AvatarTrack = {
//   id: string;
//   avatar: string;
//   title: string;
//   url: string;
//   artist?: string;
//   cover?: string;
//   link?: string;
//   createdAt?: string;
// };

// type Props = {
//   avatar: string; // לדוגמה: "chabad" / "mizrahit"
//   title?: string; // כותרת לתצוגה (לא חובה)
// };

// export default function AvatarMusicClient({ avatar, title }: Props) {
//   const { isAdmin } = useAdmin();
//   const [tracks, setTracks] = useState<AvatarTrack[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [errorMsg, setErrorMsg] = useState<string | null>(null);

//   // טופס יצירת שיר (לאדמין)
//   const [newTitle, setNewTitle] = useState("");
//   const [newUrl, setNewUrl] = useState("");
//   const [newArtist, setNewArtist] = useState("");
//   const [newCover, setNewCover] = useState("");
//   const [newLink, setNewLink] = useState("");
//   const [saving, setSaving] = useState(false);
//   const [deletingId, setDeletingId] = useState<string | null>(null);

//   // טעינת שירים מה־API
//   useEffect(() => {
//     let cancelled = false;
//     async function load() {
//       try {
//         setLoading(true);
//         setErrorMsg(null);
//         const res = await fetch(
//           `/api/avatar-tracks?avatar=${encodeURIComponent(avatar)}`,
//           { cache: "no-store" },
//         );
//         if (!res.ok) {
//           throw new Error(`סטטוס ${res.status}`);
//         }
//         const data = await res.json();
//         const list: AvatarTrack[] = (data?.tracks ?? []).map((t: any) => ({
//           id: t.id ?? t._id ?? "",
//           avatar: t.avatar ?? avatar,
//           title: t.title ?? "ללא שם",
//           url: t.url,
//           artist: t.artist ?? "",
//           cover: t.cover ?? "",
//           link: t.link ?? "",
//           createdAt: t.createdAt,
//         }));
//         if (!cancelled) setTracks(list);
//       } catch (err: any) {
//         if (!cancelled)
//           setErrorMsg("שגיאה בטעינת השירים לאווטאר. נסה לרענן את העמוד.");
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     }
//     load();
//     return () => {
//       cancelled = true;
//     };
//   }, [avatar]);

//   // תור לנגן הגלובלי
//   const queueForPlayer = useMemo(
//     () =>
//       tracks.map((t) => ({
//         id: t.id,
//         title: t.title,
//         // שדות שהנגן הגלובלי יודע לקרוא (url/src/cover/link/artist)
//         url: t.url,
//         cover: t.cover,
//         artist: t.artist,
//         link: t.link,
//       })),
//     [tracks],
//   );

//   // ניגון שיר דרך ProPlayer (mm:play)
//   function handlePlay(track: AvatarTrack) {
//     if (!track.url && !track.link) return;
//     const payloadTrack = {
//       id: track.id,
//       title: track.title,
//       url: track.url,
//       cover: track.cover,
//       artist: track.artist,
//       link: track.link,
//     };
//     // שליחת אירוע גלובלי לנגן
//     window.dispatchEvent(
//       new CustomEvent("mm:play", {
//         detail: {
//           track: payloadTrack,
//           queue: queueForPlayer,
//         },
//       }),
//     );
//   }

//   async function handleCreate(e: React.FormEvent) {
//     e.preventDefault();
//     if (!newTitle.trim() || !newUrl.trim()) {
//       alert("חובה למלא לפחות שם ושדה URL של קובץ אודיו.");
//       return;
//     }
//     try {
//       setSaving(true);
//       setErrorMsg(null);
//       const res = await fetch("/api/avatar-tracks", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           avatar,
//           title: newTitle.trim(),
//           url: newUrl.trim(),
//           artist: newArtist.trim() || undefined,
//           cover: newCover.trim() || undefined,
//           link: newLink.trim() || undefined,
//         }),
//       });
//       if (!res.ok) {
//         const data = await res.json().catch(() => ({}));
//         throw new Error(
//           data?.error || `שגיאה ביצירת שיר (סטטוס ${res.status})`,
//         );
//       }
//       const data = await res.json();
//       const t = data?.track;
//       if (t) {
//         const normalized: AvatarTrack = {
//           id: t.id ?? t._id ?? "",
//           avatar: t.avatar ?? avatar,
//           title: t.title ?? "ללא שם",
//           url: t.url,
//           artist: t.artist ?? "",
//           cover: t.cover ?? "",
//           link: t.link ?? "",
//           createdAt: t.createdAt,
//         };
//         setTracks((prev) => [normalized, ...prev]);
//         setNewTitle("");
//         setNewUrl("");
//         setNewArtist("");
//         setNewCover("");
//         setNewLink("");
//       }
//     } catch (err: any) {
//       setErrorMsg(err?.message || "שגיאה בהוספת שיר חדש.");
//     } finally {
//       setSaving(false);
//     }
//   }

//   async function handleDelete(id: string) {
//     if (!confirm("למחוק את השיר הזה? הפעולה בלתי הפיכה.")) return;
//     try {
//       setDeletingId(id);
//       setErrorMsg(null);
//       const res = await fetch(
//         `/api/avatar-tracks?id=${encodeURIComponent(id)}`,
//         {
//           method: "DELETE",
//         },
//       );
//       if (!res.ok) {
//         const data = await res.json().catch(() => ({}));
//         throw new Error(data?.error || `שגיאה במחיקה (סטטוס ${res.status})`);
//       }
//       setTracks((prev) => prev.filter((t) => t.id !== id));
//     } catch (err: any) {
//       setErrorMsg(err?.message || "שגיאה במחיקת השיר.");
//     } finally {
//       setDeletingId(null);
//     }
//   }

//   return (
//     <section className="space-y-4">
//       {title && (
//         <header className="space-y-1">
//           <h2 className="text-xl font-bold">{title}</h2>
//           <p className="text-sm text-slate-500 dark:text-slate-400">
//             רשימת שירים לאווטאר: <span className="font-semibold">{avatar}</span>
//           </p>
//         </header>
//       )}

//       {loading && (
//         <div className="text-sm text-slate-500 dark:text-slate-400">
//           טוען שירים...
//         </div>
//       )}

//       {errorMsg && (
//         <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
//           {errorMsg}
//         </div>
//       )}

//       {/* טופס ניהול לאדמין */}
//       {isAdmin && (
//         <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
//           <h3 className="mb-2 text-base font-semibold">הוספת שיר לאווטאר</h3>
//           <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
//             כרגע מוסיפים שירים באמצעות{" "}
//             <span className="font-semibold">URL לקובץ אודיו</span> (למשל
//             Cloudinary / S3). אחר כך נשדרג להעלאת קובץ ישירה.
//           </p>

//           <form
//             onSubmit={handleCreate}
//             className="grid gap-2 md:grid-cols-2 md:gap-3"
//           >
//             <div className="flex flex-col gap-1">
//               <label className="text-xs font-medium">שם השיר *</label>
//               <input
//                 type="text"
//                 value={newTitle}
//                 onChange={(e) => setNewTitle(e.target.value)}
//                 className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-900"
//                 placeholder="למשל: ניגון שמחה חב״די"
//                 required
//               />
//             </div>

//             <div className="flex flex-col gap-1">
//               <label className="text-xs font-medium">URL לקובץ אודיו *</label>
//               <input
//                 type="url"
//                 value={newUrl}
//                 onChange={(e) => setNewUrl(e.target.value)}
//                 className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-900"
//                 placeholder="https://..."
//                 required
//               />
//             </div>

//             <div className="flex flex-col gap-1">
//               <label className="text-xs font-medium">מבצע / אמן</label>
//               <input
//                 type="text"
//                 value={newArtist}
//                 onChange={(e) => setNewArtist(e.target.value)}
//                 className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-900"
//                 placeholder="אופציונלי"
//               />
//             </div>

//             <div className="flex flex-col gap-1">
//               <label className="text-xs font-medium">תמונת עטיפה (URL)</label>
//               <input
//                 type="url"
//                 value={newCover}
//                 onChange={(e) => setNewCover(e.target.value)}
//                 className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-900"
//                 placeholder="אופציונלי – תמונת אלבום"
//               />
//             </div>

//             <div className="flex flex-col gap-1 md:col-span-2">
//               <label className="text-xs font-medium">
//                 קישור חיצוני (YouTube / מקור)
//               </label>
//               <input
//                 type="url"
//                 value={newLink}
//                 onChange={(e) => setNewLink(e.target.value)}
//                 className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-900"
//                 placeholder="אופציונלי – קישור ליוטיוב / מקור אחר"
//               />
//             </div>

//             <div className="md:col-span-2 flex items-center justify-end gap-2 pt-1">
//               <button
//                 type="submit"
//                 disabled={saving}
//                 className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
//               >
//                 {saving ? "שומר..." : "הוסף שיר"}
//               </button>
//             </div>
//           </form>
//         </div>
//       )}

//       {/* רשימת שירים */}
//       <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
//         <h3 className="mb-2 text-base font-semibold">
//           {title ?? "שירים לאווטאר"}
//         </h3>

//         {tracks.length === 0 && !loading && (
//           <p className="text-xs text-slate-500 dark:text-slate-400">
//             עדיין אין שירים משויכים לאווטאר הזה.
//             {isAdmin && " הוסף למעלה שיר ראשון ונהפוך את האווטאר לחי."}
//           </p>
//         )}

//         {tracks.length > 0 && (
//           <ul className="space-y-1.5">
//             {tracks.map((track) => (
//               <li
//                 key={track.id}
//                 className="flex items-center gap-3 rounded-xl bg-slate-50 px-2 py-1.5 text-xs dark:bg-slate-800/80"
//               >
//                 <button
//                   onClick={() => handlePlay(track)}
//                   className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-white shadow hover:bg-emerald-600"
//                   title="נגן שיר זה"
//                 >
//                   ▶
//                 </button>

//                 <div className="min-w-0 flex-1">
//                   <div className="truncate font-semibold">
//                     {track.title || "ללא שם"}
//                   </div>
//                   <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
//                     {track.artist || "לא צויין מבצע"}
//                   </div>
//                 </div>

//                 {track.link && (
//                   <a
//                     href={track.link}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="rounded-full border border-slate-300 px-2 py-0.5 text-[11px] hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
//                   >
//                     מקור
//                   </a>
//                 )}

//                 {isAdmin && (
//                   <button
//                     onClick={() => handleDelete(track.id)}
//                     disabled={deletingId === track.id}
//                     className="rounded-full border border-red-300 px-2 py-0.5 text-[11px] text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/50"
//                     title="מחק שיר"
//                   >
//                     {deletingId === track.id ? "מוחק..." : "מחק"}
//                   </button>
//                 )}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     </section>
//   );
// }

// src/components/avatars/AvatarMusicClient.tsx
"use client";

import type { AvatarDef } from "@/constants/avatars";
import { useAdmin } from "@/contexts/admin";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type AvatarTrack = {
  id: string;
  avatar: string;
  title: string;
  url: string;
  artist?: string;
  cover?: string;
  link?: string;
  createdAt?: string;
};

type Props = {
  avatarId: AvatarDef["id"];
  avatar: AvatarDef;
};

type MiniTrack = {
  id: string;
  title: string;
  artist: string;
  src?: string;
  cover?: string;
  link?: string;
};

function toMiniTrack(t: AvatarTrack, def: AvatarDef): MiniTrack {
  return {
    id: t.id,
    title: t.title || "ללא שם",
    artist: t.artist || def.label,
    src: t.url,
    cover: t.cover || def.src,
    link: t.link,
  };
}

export default function AvatarMusicClient({ avatarId, avatar }: Props) {
  const { isAdmin } = useAdmin();
  const [tracks, setTracks] = useState<AvatarTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // חיפוש ברשימה
  const [q, setQ] = useState("");

  // טופס אדמין להוספת שיר
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newCover, setNewCover] = useState("");
  const [newLink, setNewLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadTracks() {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(
        `/api/avatar-tracks?avatar=${encodeURIComponent(avatarId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        throw new Error(`סטטוס ${res.status}`);
      }
      const data = await res.json();
      const list: AvatarTrack[] = (data?.tracks ?? []).map((t: any) => ({
        id: t.id ?? t._id ?? "",
        avatar: t.avatar ?? avatarId,
        title: t.title ?? "ללא שם",
        url: t.url,
        artist: t.artist ?? "",
        cover: t.cover ?? "",
        link: t.link ?? "",
        createdAt: t.createdAt,
      }));
      setTracks(list);
    } catch (err: any) {
      console.error("[AvatarMusicClient] loadTracks error:", err);
      setErrorMsg(
        err?.message || "שגיאה בטעינת השירים לאווטאר. נסה לרענן את העמוד.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarId]);

  const filteredTracks = useMemo(() => {
    if (!q.trim()) return tracks;
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    return tracks.filter(
      (t) =>
        rx.test(t.title) || rx.test(t.artist || "") || rx.test(t.link || ""),
    );
  }, [q, tracks]);

  const queueForPlayer: MiniTrack[] = useMemo(
    () => filteredTracks.map((t) => toMiniTrack(t, avatar)),
    [filteredTracks, avatar],
  );

  function playOne(track: AvatarTrack) {
    const tr = toMiniTrack(track, avatar);
    const queue = queueForPlayer;
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("mm:play", { detail: { track: tr, queue } }),
    );
  }

  function addOneToQueue(track: AvatarTrack) {
    const tr = toMiniTrack(track, avatar);
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("mm:queue:add", { detail: { track: tr } }),
    );
  }

  function playAll() {
    if (!queueForPlayer.length || typeof window === "undefined") return;
    const [first, ...rest] = queueForPlayer;
    window.dispatchEvent(
      new CustomEvent("mm:play", {
        detail: { track: first, queue: [first, ...rest] },
      }),
    );
  }

  function addAllToQueue() {
    if (!queueForPlayer.length || typeof window === "undefined") return;
    queueForPlayer.forEach((t) =>
      window.dispatchEvent(
        new CustomEvent("mm:queue:add", { detail: { track: t } }),
      ),
    );
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
      alert("חובה למלא לפחות שם שיר ו־URL של קובץ אודיו.");
      return;
    }
    try {
      setSaving(true);
      setErrorMsg(null);
      const res = await fetch("/api/avatar-tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar: avatarId,
          title: newTitle.trim(),
          url: newUrl.trim(),
          artist: newArtist.trim() || undefined,
          cover: newCover.trim() || undefined,
          link: newLink.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data?.error || `שגיאה ביצירת שיר (סטטוס ${res.status})`,
        );
      }
      // הכי פשוט: לרענן את הרשימה מחדש
      await loadTracks();
      setNewTitle("");
      setNewUrl("");
      setNewArtist("");
      setNewCover("");
      setNewLink("");
    } catch (err: any) {
      console.error("[AvatarMusicClient] create error:", err);
      setErrorMsg(err?.message || "שגיאה בהוספת שיר חדש.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק את השיר הזה? הפעולה בלתי הפיכה.")) return;
    try {
      setDeletingId(id);
      setErrorMsg(null);
      const res = await fetch(
        `/api/avatar-tracks?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `שגיאה במחיקה (סטטוס ${res.status})`);
      }
      setTracks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      console.error("[AvatarMusicClient] delete error:", err);
      setErrorMsg(err?.message || "שגיאה במחיקת השיר.");
    } finally {
      setDeletingId((prev) => (prev === id ? null : prev));
    }
  }

  const admin = !!isAdmin;

  return (
    <section className="space-y-6" dir="rtl">
      {/* כותרת + כפתורי נגן גלובליים */}
      <div className="mm-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img
              src={avatar.src}
              alt={avatar.label}
              className="h-14 w-14 rounded-2xl border border-black/10 object-cover dark:border-white/10"
            />
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-extrabold tracking-tight">
                {avatar.label}
              </h2>
              <p className="truncate text-sm opacity-75">
                נגן שירים בסגנון {avatar.label}. השירים כאן קשורים לאווטאר הזה.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={playAll}
              disabled={!queueForPlayer.length}
            >
              נגן הכול
            </button>
            <button
              type="button"
              className="btn"
              onClick={addAllToQueue}
              disabled={!queueForPlayer.length}
            >
              הוסף הכול לתור
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <input
            className="input-base input-rtl"
            placeholder="חפש שיר לפי שם / אומן / קישור…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="text-xs opacity-70 flex items-center justify-end">
            {loading
              ? "טוען שירים…"
              : filteredTracks.length
                ? `${filteredTracks.length} שירים באווטאר הזה`
                : "אין שירים מתאימים כרגע."}
          </div>
        </div>
      </div>

      {/* הודעת שגיאה */}
      {errorMsg && (
        <div className="mm-card border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {errorMsg}
        </div>
      )}

      {/* טופס אדמין להוספת שיר */}
      {admin && (
        <form
          onSubmit={handleCreate}
          className="mm-card border border-emerald-300 bg-emerald-50/80 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/40 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold">הוספת שיר לאווטאר</h3>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              מצב אדמין
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">שם השיר *</label>
              <input
                type="text"
                className="input-base input-rtl"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder='למשל: "ניגון שמחה חב״די"'
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">
                URL של קובץ אודיו (mp3, וכו׳) *
              </label>
              <input
                type="url"
                className="input-base"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/audio.mp3"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">אומן / מקור</label>
              <input
                type="text"
                className="input-base input-rtl"
                value={newArtist}
                onChange={(e) => setNewArtist(e.target.value)}
                placeholder="לא חובה — למשל: מתי גורפינקל"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">
                תמונת קאבר (אופציונלי)
              </label>
              <input
                type="url"
                className="input-base"
                value={newCover}
                onChange={(e) => setNewCover(e.target.value)}
                placeholder="URL לתמונה (אם קיים)"
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-medium">
                קישור נוסף (יוטיוב / אתר / קובץ)
              </label>
              <input
                type="url"
                className="input-base"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="למשל: קישור ליוטיוב של השיר"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="text-xs opacity-75">
              כל שיר שתוסיף ישאר משוייך לאווטאר{" "}
              <span className="font-semibold">{avatar.label}</span>.
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "שומר…" : "שמור שיר"}
            </button>
          </div>
        </form>
      )}

      {/* רשימת השירים */}
      <div className="mm-card p-4 sm:p-5">
        <h3 className="mb-3 text-base font-semibold">רשימת השירים</h3>

        {loading && !tracks.length && (
          <div className="py-4 text-sm opacity-70">טוען רשימה…</div>
        )}

        {!loading && !filteredTracks.length && (
          <div className="py-4 text-sm opacity-70">
            אין שירים כרגע לאווטאר הזה.
            {admin && " תוסיף למעלה שיר ראשון ותתחיל למלא את המאגר."}
          </div>
        )}

        {!!filteredTracks.length && (
          <ul className="space-y-1.5">
            {filteredTracks.map((track) => {
              const mini = toMiniTrack(track, avatar);
              return (
                <li
                  key={track.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-2 py-1.5 text-xs dark:bg-slate-800/80"
                >
                  <button
                    type="button"
                    onClick={() => playOne(track)}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-white shadow hover:bg-emerald-600"
                    title="נגן"
                  >
                    ▶
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{track.title}</div>
                    <div className="truncate text-[11px] opacity-70">
                      {mini.artist}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => addOneToQueue(track)}
                      className="rounded-full border border-slate-300 px-2 py-1 text-[11px] hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                      title="הוסף לתור"
                    >
                      לתור
                    </button>

                    {track.link && (
                      <a
                        href={track.link}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-300 px-2 py-1 text-[11px] hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                      >
                        מקור
                      </a>
                    )}

                    {admin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(track.id)}
                        disabled={deletingId === track.id}
                        className="rounded-full border border-red-300 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                        title="מחק שיר"
                      >
                        {deletingId === track.id ? "מוחק…" : "מחק"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
