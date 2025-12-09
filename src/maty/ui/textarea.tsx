import * as React from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-[90px] rounded-xl border bg-white/70 px-3 py-2 text-sm outline-none",
          "focus:ring-2 focus:ring-amber-300 dark:bg-zinc-900/60",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
