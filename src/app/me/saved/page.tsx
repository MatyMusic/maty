// // src/app/me/saved/page.tsx
// import { redirect } from "next/navigation";
// import { auth } from "@/lib/auth";
// import { getCollection } from "@/lib/db";
// import Image from "next/image";

// export const dynamic = "force-dynamic";

// export default async function MySavedPage() {
//   const session = await auth();
//   const email = session?.user?.email;
//   if (!email) redirect("/api/auth/signin");

//   const col = await getCollection<any>("saved_tracks");
//   const items = await col
//     .find({ userEmail: email })
//     .sort({ createdAt: -1 })
//     .limit(200)
//     .toArray();

//   return (
//     <div className="container mx-auto max-w-5xl px-4 py-6">
//       <h1 className="text-2xl font-bold mb-4">השירים שלי</h1>

//       {items.length === 0 ? (
//         <p>אין עדיין שירים שמורים.</p>
//       ) : (
//         <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {items.map((it: any) => (
//             <li
//               key={it.itemId}
//               className="rounded-xl border p-3 flex gap-3 items-center"
//             >
//               {it.cover ? (
//                 <Image
//                   src={it.cover}
//                   alt={it.title}
//                   width={64}
//                   height={64}
//                   className="rounded-lg object-cover"
//                 />
//               ) : (
//                 <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-800" />
//               )}
//               <div className="min-w-0">
//                 <div className="font-semibold truncate">{it.title}</div>
//                 <div className="text-sm text-slate-500 truncate">
//                   {(it.artists || []).join(", ")}
//                 </div>
//                 <div className="text-xs text-slate-400 mt-1">{it.source}</div>
//               </div>
//               <div className="ml-auto">
//                 {it.url ? (
//                   <a
//                     className="text-violet-600 underline"
//                     href={it.url}
//                     target="_blank"
//                   >
//                     נגן
//                   </a>
//                 ) : it.link ? (
//                   <a
//                     className="text-violet-600 underline"
//                     href={it.link}
//                     target="_blank"
//                   >
//                     פתח
//                   </a>
//                 ) : null}
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }

// src/app/me/page.tsx
"use client";

import * as React from "react";
import {
  Check,
  ChevronRight,
  Loader2,
  Save,
  UploadCloud,
  User2,
  Music2,
  Sparkles,
  Globe,
  Camera,
  ShieldCheck,
  ExternalLink,
  Image as ImageIcon,
  Wand2,
  Link2,
  RefreshCw,
} from "lucide-react";

/* ============ Types ============ */
type Genre = "chabad" | "mizrahi" | "soft" | "fun";
type Strategy = "genre" | "gallery" | "upload" | "profile";

type MeUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  image: string | null;
  avatarUrl: string | null;
  avatarStrategy: Strategy;
  avatarId: string | null;
  preferredGenres: Genre[];
  lastPlayedGenre: Genre | null;
};

type DateProfile = {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  photos: string[];
  gender: "male" | "female" | "other" | null;
  languages: string[];
  judaism_direction:
    | "orthodox"
    | "haredi"
    | "chasidic"
    | "chassidic"
    | "modern"
    | "conservative"
    | "reform"
    | "reconstructionist"
    | "secular"
    | null;
  kashrut_level: "strict" | "partial" | "none" | null;
  shabbat_level: "strict" | "partial" | "none" | null;
  tzniut_level: "strict" | "partial" | "none" | null;
  subscription: {
    status: "active" | "inactive";
    tier: "free" | "plus" | "pro" | "vip";
    expiresAt?: string | null;
  } | null;
  updatedAt: string | null;
  trust: number | null;
};

type DateEnvelope = { hasProfile: boolean; profile: DateProfile | null };

type ApiMe =
  | { ok: true; me: MeUser; date: DateEnvelope }
  | { ok: false; error: string };

/* ============ helpers ============ */
function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

const AVATAR_GALLERY: Array<{ id: string; url: string; label: string }> = [
  {
    id: "avatar-chabad",
    url: "/assets/images/avatar-chabad.png",
    label: "Chabad",
  },
  {
    id: "avatar-mizrahi",
    url: "/assets/images/avatar-mizrahi.png",
    label: "Mizrahi",
  },
  { id: "avatar-soft", url: "/assets/images/avatar-soft.png", label: "Soft" },
  { id: "avatar-fun", url: "/assets/images/avatar-fun.png", label: "Fun" },
];

/* ============ Page ============ */
export default function MePage() {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [me, setMe] = React.useState<MeUser | null>(null);
  const [date, setDate] = React.useState<DateEnvelope | null>(null);

  // edit state (user)
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [prefGenres, setPrefGenres] = React.useState<Genre[]>([]);
  const [avatarStrategy, setAvatarStrategy] = React.useState<Strategy>("genre");
  const [avatarId, setAvatarId] = React.useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  // busy flags
  const [busySaveUser, setBusySaveUser] = React.useState(false);
  const [busyUpload, setBusyUpload] = React.useState(false);
  const [busySyncDate, setBusySyncDate] = React.useState(false);

  // toast
  const [toast, setToast] = React.useState<string | null>(null);
  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  }

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch("/api/date/me", { cache: "no-store" });
        const j: ApiMe = await r.json();
        if (!r.ok || !j || (j as any).ok !== true) {
          throw new Error((j as any)?.error || `HTTP ${r.status}`);
        }
        const { me, date } = j as any;
        setMe(me);
        setDate(date);
        setName(me.name || "");
        setPhone(me.phone || "");
        setPrefGenres(
          Array.isArray(me.preferredGenres) ? me.preferredGenres : []
        );
        setAvatarStrategy(me.avatarStrategy || "genre");
        setAvatarId(me.avatarId || null);
        setAvatarUrl(me.avatarUrl || null);
      } catch (e: any) {
        setErr(e?.message || "שגיאה בטעינת נתוני משתמש");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveUser() {
    try {
      setBusySaveUser(true);
      const body = {
        name,
        phone,
        avatarStrategy,
        avatarId,
        avatarUrl,
        preferredGenres: prefGenres,
      };
      const r = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setMe(j.user);
      showToast("השינויים נשמרו ✅");
    } catch (e: any) {
      showToast(e?.message || "שמירה נכשלה");
    } finally {
      setBusySaveUser(false);
    }
  }

  async function onUploadAvatar(file: File) {
    try {
      setBusyUpload(true);
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setAvatarUrl(j.url);
      setAvatarStrategy("upload");
      showToast("האווטאר הועלה ✅");
    } catch (e: any) {
      showToast(e?.message || "העלאה נכשלה");
    } finally {
      setBusyUpload(false);
    }
  }

  async function syncToDate() {
    try {
      setBusySyncDate(true);
      const r = await fetch("/api/date/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setDate(j.date);
      showToast("סונכרן ל-MATY-DATE ✅");
    } catch (e: any) {
      showToast(e?.message || "סנכרון נכשל");
    } finally {
      setBusySyncDate(false);
    }
  }

  /* ===== UI Bits ===== */
  function Card({ title, icon, children, footer, className = "" }: any) {
    return (
      <section
        className={cls(
          "rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-5",
          "animate-[fadeIn_.18s_ease-out]",
          className
        )}
      >
        <div className="flex items-center gap-2 text-lg font-bold">
          {icon} {title}
        </div>
        <div className="mt-3">{children}</div>
        {footer && (
          <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
            {footer}
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
              transform: none;
            }
          }
        `}</style>
      </section>
    );
  }

  function GenreChip({ g }: { g: Genre }) {
    const active = prefGenres.includes(g);
    return (
      <button
        onClick={() => {
          setPrefGenres((prev) =>
            prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
          );
        }}
        className={cls(
          "h-10 px-4 rounded-full border text-sm",
          active
            ? "bg-violet-600 text-white border-violet-600 shadow-sm"
            : "bg-white/80 dark:bg-neutral-900/80 hover:bg-black/5 dark:hover:bg-white/5"
        )}
      >
        {g.toUpperCase()}
      </button>
    );
  }

  function GalleryTile({
    it,
  }: {
    it: { id: string; url: string; label: string };
  }) {
    const active = avatarStrategy === "gallery" && avatarId === it.id;
    return (
      <button
        onClick={() => {
          setAvatarStrategy("gallery");
          setAvatarId(it.id);
          setAvatarUrl(it.url);
        }}
        className={cls(
          "relative rounded-xl overflow-hidden border w-full aspect-square",
          active
            ? "ring-2 ring-violet-500 border-violet-400"
            : "hover:border-violet-300"
        )}
        title={it.label}
      >
        <img
          src={it.url}
          alt={it.label}
          className="h-full w-full object-cover"
        />
        {active && (
          <span className="absolute top-2 left-2 rounded-full bg-black/70 text-white text-[11px] px-2 py-1 inline-flex items-center gap-1">
            <Check className="h-3 w-3" /> נבחר
          </span>
        )}
      </button>
    );
  }

  /* ===== Loading / Error ===== */
  if (loading) {
    return (
      <main dir="rtl" className="mx-auto max-w-6xl p-4 md:p-8">
        <div className="grid gap-4">
          <div className="h-10 w-40 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-24 rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
          <div className="h-64 rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
        </div>
      </main>
    );
  }

  if (err) {
    return (
      <main dir="rtl" className="mx-auto max-w-6xl p-4 md:p-8">
        <div className="rounded-xl border border-red-200/40 bg-red-50/60 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          {err}
        </div>
      </main>
    );
  }

  /* ===== Main ===== */
  return (
    <main dir="rtl" className="mx-auto max-w-6xl p-4 md:p-8">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs opacity-70">החשבון שלי</div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            <span className="truncate">{name || me?.name || "משתמש"}</span>
            {me?.role === "admin" && (
              <ShieldCheck className="h-5 w-5 text-sky-500" title="Admin" />
            )}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveUser}
            disabled={busySaveUser}
            className={cls(
              "h-10 px-4 rounded-full inline-flex items-center gap-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold",
              busySaveUser && "opacity-70"
            )}
            title="שמור"
          >
            {busySaveUser ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            שמור
          </button>
        </div>
      </header>

      {/* Grid */}
      <div className="mt-6 grid gap-6 md:grid-cols-[2fr,1fr]">
        {/* Left column */}
        <div className="grid gap-6">
          {/* Account */}
          <Card title="פרטי חשבון" icon={<User2 className="h-5 w-5" />}>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <span className="text-sm opacity-70">שם תצוגה</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90"
                  placeholder="השם שלך…"
                />
              </div>
              <div className="grid gap-1">
                <span className="text-sm opacity-70">אימייל</span>
                <input
                  value={me?.email || ""}
                  readOnly
                  className="h-11 rounded-xl border px-3 bg-black/5 dark:bg-white/5 opacity-70"
                />
              </div>
              <div className="grid gap-1">
                <span className="text-sm opacity-70">טלפון</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90"
                  placeholder="למשל 050-1234567"
                />
              </div>
            </div>
          </Card>

          {/* Avatar */}
          <Card
            title="תמונת משתמש ואסטרטגיה"
            icon={<Camera className="h-5 w-5" />}
            footer={
              <div className="text-xs opacity-70 flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                טיפ: אפשר לעבור בין Gallery/Upload/Google Profile או לבחור לפי
                ז’אנר.
              </div>
            }
          >
            <div className="grid md:grid-cols-[auto,1fr] gap-4 items-start">
              <div className="flex flex-col items-center gap-2">
                <div className="relative h-28 w-28 rounded-full overflow-hidden border">
                  <img
                    src={avatarUrl || "/assets/images/avatar-soft.png"}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-xs opacity-70">
                  {avatarStrategy.toUpperCase()}
                </div>
              </div>

              <div className="grid gap-3">
                {/* Strategy selector */}
                <div className="flex flex-wrap gap-2">
                  {(
                    ["genre", "gallery", "upload", "profile"] as Strategy[]
                  ).map((s) => {
                    const active = avatarStrategy === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setAvatarStrategy(s)}
                        className={cls(
                          "h-9 px-3 rounded-full border text-sm",
                          active
                            ? "bg-violet-600 text-white border-violet-600"
                            : "bg-white/80 dark:bg-neutral-900/80 hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                      >
                        {s.toUpperCase()}
                      </button>
                    );
                  })}
                </div>

                {/* Per-strategy UI */}
                {avatarStrategy === "gallery" && (
                  <div className="grid grid-cols-4 gap-3">
                    {AVATAR_GALLERY.map((it) => (
                      <GalleryTile key={it.id} it={it} />
                    ))}
                  </div>
                )}

                {avatarStrategy === "genre" && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    <GenreChip g="chabad" />
                    <GenreChip g="mizrahi" />
                    <GenreChip g="soft" />
                    <GenreChip g="fun" />
                    <div className="text-xs opacity-70 sm:col-span-2">
                      תמונת ברירת מחדל נבחרת אוטומטית לפי הז’אנר המועדף.
                    </div>
                  </div>
                )}

                {avatarStrategy === "upload" && (
                  <label
                    className={cls(
                      "mt-1 grid place-items-center rounded-2xl border-2 border-dashed p-6 cursor-pointer text-center",
                      busyUpload
                        ? "opacity-70"
                        : "hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                    )}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onUploadAvatar(f);
                      }}
                    />
                    <div className="flex flex-col items-center gap-2">
                      <UploadCloud className="h-7 w-7 opacity-70" />
                      <div className="text-sm opacity-80">
                        גרור/י או לחצו כדי להעלות תמונת פרופיל
                      </div>
                    </div>
                  </label>
                )}

                {avatarStrategy === "profile" && (
                  <div className="text-sm opacity-80">
                    תוצג תמונת הפרופיל מחשבון Google שלך (OAuth).
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Music prefs */}
          <Card
            title="העדפות מוזיקה (MATY-MUSIC)"
            icon={<Music2 className="h-5 w-5" />}
          >
            <div className="flex flex-wrap gap-2">
              <GenreChip g="chabad" />
              <GenreChip g="mizrahi" />
              <GenreChip g="soft" />
              <GenreChip g="fun" />
            </div>
            <div className="mt-3 text-xs opacity-70">
              העדפות אלו תורמות להתאמות חכמות – גם בגלריות וגם בהמלצות.
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="grid gap-6">
          {/* MATY-DATE integration */}
          <Card
            title="MATY-DATE"
            icon={<Sparkles className="h-5 w-5 text-amber-500" />}
            footer={
              <div className="text-xs opacity-70 flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                משיכת השם/אווטאר מהחשבון, אפשר לשנות אחר כך בהעדפות הדייטינג.
              </div>
            }
          >
            {date?.hasProfile && date.profile ? (
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full overflow-hidden border">
                    <img
                      src={
                        date.profile.avatarUrl ||
                        "/assets/images/avatar-soft.png"
                      }
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {date.profile.displayName || me?.name}
                    </div>
                    <div className="text-xs opacity-70 truncate">
                      {date.profile.email}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/date/profile/${encodeURIComponent(
                      date.profile.userId
                    )}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full px-4 border text-sm bg-white/85 dark:bg-neutral-900/85 hover:bg-white"
                    title="פתיחת פרופיל"
                  >
                    פרופיל <ExternalLink className="h-4 w-4" />
                  </a>
                  <a
                    href="/date/preferences"
                    className="inline-flex h-10 items-center gap-2 rounded-full px-4 border text-sm bg-white/85 dark:bg-neutral-900/85 hover:bg-white"
                    title="העדפות"
                  >
                    העדפות <ChevronRight className="h-4 w-4" />
                  </a>
                  <button
                    onClick={syncToDate}
                    disabled={busySyncDate}
                    className={cls(
                      "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm bg-violet-600 text-white",
                      busySyncDate && "opacity-70"
                    )}
                  >
                    {busySyncDate ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    סנכרן עכשיו
                  </button>
                </div>

                <div className="text-xs opacity-70">
                  עודכן לאחרונה:{" "}
                  {date.profile.updatedAt
                    ? new Date(date.profile.updatedAt).toLocaleString()
                    : "—"}
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="text-sm">
                  אין לך עדיין פרופיל דייטינג. אפשר ליצור אחד בלחיצה – ניקח את
                  השם/אווטאר מהחשבון ונבנה בסיס.
                </div>
                <button
                  onClick={syncToDate}
                  disabled={busySyncDate}
                  className={cls(
                    "inline-flex h-11 items-center gap-2 rounded-full px-5 bg-rose-600 text-white font-semibold",
                    busySyncDate && "opacity-70"
                  )}
                >
                  {busySyncDate ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  צור פרופיל MATY-DATE
                </button>
              </div>
            )}
          </Card>

          {/* Quick links / Info */}
          <Card
            title="קישורים מהירים"
            icon={<ExternalLink className="h-5 w-5" />}
          >
            <div className="grid gap-2">
              <a
                className="inline-flex items-center gap-2 text-sm hover:underline"
                href="/nigunim"
              >
                <Music2 className="h-4 w-4" /> אלבום ניגונים
              </a>
              <a
                className="inline-flex items-center gap-2 text-sm hover:underline"
                href="/maty-date"
              >
                <ImageIcon className="h-4 w-4" /> עמוד MATY-DATE
              </a>
            </div>
          </Card>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-black text-white/95 dark:bg-white dark:text-black px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
