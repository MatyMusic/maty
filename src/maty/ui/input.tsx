import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border bg-white/70 px-3 py-2 text-sm outline-none dark:bg-zinc-900/60",
          "focus:ring-2 focus:ring-amber-300",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
