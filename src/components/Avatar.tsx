// src/components/Avatar.tsx
"use client";

import Image from "next/image";
import { AVATAR_MAP, type Genre } from "@/constants/avatars";

function initialsFallback(name?: string) {
  const s = (name || "").trim();
  if (!s) return "😊";
  const parts = s.split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts[1]?.[0] || "";
  return (first + last || first).toUpperCase();
}

export default function Avatar({
  genre = "soft",
  name,
  circle = false,
  size = 64,
  className = "",
  priority = false,
}: {
  genre?: Genre;
  name?: string;
  circle?: boolean;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const def = AVATAR_MAP[genre] ?? AVATAR_MAP.soft;
  const src = (circle && def.circleSrc) ? def.circleSrc : def.src;

  return (
    <div
      className={[
        "inline-flex items-center justify-center select-none",
        circle ? "rounded-full ring-1 ring-black/10 dark:ring-white/10 overflow-hidden" : "",
        className,
      ].join(" ")}
      style={{ width: size, height: size, background: "var(--avatar-bg, rgba(0,0,0,0.03))" }}
      aria-label={name || def.label}
      title={name || def.label}
    >
      {src ? (
        <Image
          src={src}
          alt={name || def.label}
          width={size}
          height={size}
          sizes={`${size}px`}
          priority={priority}
          style={{ objectFit: "contain" }}
        />
      ) : (
        <span className="text-sm font-bold opacity-70">{initialsFallback(name)}</span>
      )}
    </div>
  );
}
