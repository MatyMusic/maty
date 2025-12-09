// src/maty/ui/Button.tsx
"use client";

import * as React from "react";

export type MatyButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: MatyButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";

  const v =
    variant === "primary"
      ? "bg-brand text-white hover:opacity-90"
      : variant === "outline"
        ? "border border-black/10 dark:border-white/20 bg-transparent hover:bg-black/5 dark:hover:bg-white/10"
        : "bg-transparent hover:bg-black/5 dark:hover:bg-white/10";

  const s =
    size === "sm"
      ? "h-8 px-3 text-xs"
      : size === "lg"
        ? "h-11 px-6 text-sm"
        : "h-10 px-4 text-sm";

  return (
    <button className={classNames(base, v, s, className)} {...rest}>
      {children}
    </button>
  );
}

// 👈 זה מה שהיה חסר לך
export default Button;
