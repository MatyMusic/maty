// src/components/assistant/AssistantAvatar.tsx
"use client";
import * as React from "react";

export default function AssistantAvatar({
  src = "/assets/avatars/maty-assistant.jpg",
  size = 44,
  blinking = true,
  nodding = true,
  className = "",
  onClick,
  title = "העוזר הווירטואלי",
}: {
  src?: string;
  size?: number;
  blinking?: boolean;
  nodding?: boolean;
  className?: string;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={[
        "relative isolate rounded-full border border-amber-400/40 dark:border-amber-300/25",
        "shadow-md hover:shadow-lg transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-amber-400/40",
        "bg-gradient-to-br from-amber-200/50 via-transparent to-amber-400/30 dark:from-amber-300/10 dark:to-amber-400/10",
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
    >
      {/* הילה זוהרת */}
      <span
        aria-hidden
        className="absolute -inset-1 rounded-full blur-sm opacity-50"
        style={{
          background:
            "radial-gradient(40% 40% at 50% 50%, rgba(245,158,11,.45), rgba(245,158,11,0) 70%)",
        }}
      />

      {/* התמונה בעיגול עם “טון מצויר” קל */}
      <img
        src={src}
        alt=""
        className="relative z-10 h-full w-full rounded-full object-cover"
        style={{
          filter: "saturate(1.15) contrast(1.06) brightness(1.02)",
        }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            "/assets/images/avatar-soft.png";
        }}
      />

      {/* מבריק קטן */}
      <span
        aria-hidden
        className="absolute z-20 left-1 top-1 h-3 w-1.5 rounded-full opacity-70"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,.9), rgba(255,255,255,.1))",
        }}
      />

      {/* אנימציות עדינות */}
      <style jsx>{`
        button {
          animation: ${nodding ? "mmNod 6s ease-in-out infinite" : "none"};
        }
        @keyframes mmNod {
          0%,
          100% {
            transform: translateZ(0) rotate(0deg);
          }
          10% {
            transform: translateY(-0.5px) rotate(0.4deg);
          }
          20% {
            transform: translateY(0.5px) rotate(-0.4deg);
          }
          30% {
            transform: translateY(0) rotate(0deg);
          }
        }
      `}</style>
    </button>
  );
}
