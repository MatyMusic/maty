// src/components/NavUserBadge.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Genre = "chabad" | "mizrahi" | "soft" | "fun";
type Strategy = "genre" | "gallery" | "upload" | "profile";

const AVATAR_BY_GENRE: Record<Genre, string> = {
  chabad:  "/assets/images/avatar-chabad.png",
  mizrahi: "/assets/images/avatar-mizrahi.png",
  soft:    "/assets/images/avatar-soft.png",
  fun:     "/assets/images/avatar-fun.png",
};
const GALLERY_MAP: Record<string, string> = {
  "avatar-chabad":  "/assets/images/avatar-chabad.png",
  "avatar-mizrahi": "/assets/images/avatar-mizrahi.png",
  "avatar-soft":    "/assets/images/avatar-soft.png",
  "avatar-fun":     "/assets/images/avatar-fun.png",
};

function isGenre(g: any): g is Genre {
  return g === "chabad" || g === "mizrahi" || g === "soft" || g === "fun";
}

export default function NavUserBadge({
  size = 32,
  withName = true,
  className = "",
}: { size?: number; withName?: boolean; className?: string }) {
  const { data: session, status } = useSession();

  // מצב אווטאר גלובלי (מגיע מהפרופיל / קומפניון)
  const [strategy, setStrategy] = useState<Strategy>("genre");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [genre, setGenre] = useState<Genre>("soft");

  // טעינה ראשונית מהחלון + מאזין לעדכונים
  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = (window as any).__MM_AVATAR_STRATEGY__ as Strategy | undefined;
    const u = (window as any).__MM_AVATAR_URL__ as string | null | undefined;
    const id = (window as any).__MM_AVATAR_ID__ as string | null | undefined;
    if (s) setStrategy(s);
    if (typeof u !== "undefined") setAvatarUrl(u ?? null);
    if (typeof id !== "undefined") setAvatarId(id ?? null);

    // גם שינוי ז'אנר משפיע על ברירת מחדל
    const onCat = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.category && isGenre(d.category)) setGenre(d.category);
    };
    const onAvatar = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      if (d.strategy) setStrategy(d.strategy as Strategy);
      if ("url" in d) setAvatarUrl(d.url ?? null);
      if ("id" in d) setAvatarId(d.id ?? null);
    };

    window.addEventListener("mm:setCategory", onCat as EventListener);
    window.addEventListener("mm:avatarChanged", onAvatar as EventListener);
    return () => {
      window.removeEventListener("mm:setCategory", onCat as EventListener);
      window.removeEventListener("mm:avatarChanged", onAvatar as EventListener);
    };
  }, []);

  // חישוב מקור התמונה
  const src = useMemo(() => {
    if (strategy === "upload" && avatarUrl) return avatarUrl;
    if (strategy === "profile" && (session?.user as any)?.image) return (session?.user as any).image as string;
    if (strategy === "gallery" && avatarId && GALLERY_MAP[avatarId]) return GALLERY_MAP[avatarId];
    return AVATAR_BY_GENRE[genre] || AVATAR_BY_GENRE.soft;
  }, [strategy, avatarUrl, avatarId, genre, session?.user]);

  const name = (session?.user?.name as string) || "אורח";
  const initials = (name || "א")[0]?.toUpperCase() || "א";

  return (
    <Link
      href={status === "authenticated" ? "/profile" : "/signin?from=/"}
      className={`flex items-center gap-2 rtl:flex-row-reverse ${className}`}
      aria-label="פרופיל"
    >
      {/* תמונה/אווטאר */}
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="avatar"
          width={size}
          height={size}
          className="rounded-full object-cover border border-black/10 dark:border-white/10"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/assets/images/avatar-soft.png"; }}
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="rounded-full bg-black/10 dark:bg-white/10 grid place-items-center text-sm font-semibold"
        >
          {initials}
        </div>
      )}

      {/* שם */}
      {withName && (
        <span className="text-sm font-semibold truncate max-w-[12ch]">{name}</span>
      )}
    </Link>
  );
}
