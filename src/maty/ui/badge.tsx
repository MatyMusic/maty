import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "secondary" | "destructive" | "outline";

export function Badge({
  children,
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const variants: Record<Variant, string> = {
    default: "bg-amber-600 text-white border border-amber-600",
    secondary:
      "bg-black/5 text-black border border-black/10 dark:text-white/90 dark:bg-white/10 dark:border-white/10",
    destructive: "bg-red-600 text-white border border-red-600",
    outline: "bg-transparent text-current border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
