// src/maty/ui/button.tsx
"use client";

import clsx from "clsx";
import * as React from "react";

export type MatyButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type MatyButtonSize = "sm" | "md" | "lg" | "icon";

export type MatyButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: MatyButtonVariant;
  size?: MatyButtonSize;
  fullWidth?: boolean;
};

export function Button(props: MatyButtonProps) {
  const {
    className,
    variant = "primary",
    size = "md",
    fullWidth,
    disabled,
    ...rest
  } = props;

  const classes = clsx(
    "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500",
    disabled && "opacity-60 cursor-not-allowed",
    !disabled && "hover:scale-[1.02] active:scale-[0.98]",
    variant === "primary" &&
      "bg-indigo-600 text-white shadow-md hover:bg-indigo-700",
    variant === "secondary" && "bg-slate-800 text-slate-100 hover:bg-slate-900",
    variant === "outline" &&
      "border border-slate-500 text-slate-100 bg-transparent hover:bg-slate-800",
    variant === "ghost" && "bg-transparent text-slate-100 hover:bg-slate-800",
    size === "sm" && "text-sm px-3 py-1.5",
    size === "md" && "text-sm px-4 py-2",
    size === "lg" && "text-base px-5 py-2.5",
    size === "icon" && "h-10 w-10 p-0",
    fullWidth && "w-full",
    className,
  );

  return <button className={classes} disabled={disabled} {...rest} />;
}

export default Button;
