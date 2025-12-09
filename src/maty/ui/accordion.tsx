"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/** ====== Contexts ====== */
type Mode = "single" | "multiple";
type AccCtx = {
  mode: Mode;
  open: Set<string>;
  toggle: (v: string) => void;
  isOpen: (v: string) => boolean;
};
const AccordionContext = React.createContext<AccCtx | null>(null);

const ItemContext = React.createContext<{ value: string } | null>(null);

/** ====== Helpers ====== */
function toSet(val?: string | string[], mode: Mode = "single") {
  if (mode === "multiple") {
    return new Set(Array.isArray(val) ? val : val ? [val] : []);
  }
  return new Set(val && !Array.isArray(val) ? [val] : []);
}

/** ====== Root ====== */
export function Accordion({
  children,
  className,
  type = "single",
  collapsible = true,
  defaultValue,
  value,
  onValueChange,
}: {
  children: React.ReactNode;
  className?: string;
  type?: Mode;
  collapsible?: boolean; // רלוונטי ל-single
  defaultValue?: string | string[];
  value?: string | string[]; // optional controlled
  onValueChange?: (v: string | string[]) => void;
}) {
  const mode = type;
  const controlled = value !== undefined;

  const [inner, setInner] = React.useState<string | string[] | undefined>(
    defaultValue,
  );

  // derive open set (controlled/uncontrolled)
  const open = React.useMemo(
    () => toSet((controlled ? value : inner) as any, mode),
    [controlled, value, inner, mode],
  );

  const setOpen = React.useCallback(
    (next: Set<string>) => {
      const out =
        mode === "multiple" ? Array.from(next) : Array.from(next)[0] || "";
      onValueChange?.(out);
      if (!controlled) setInner(out);
    },
    [controlled, mode, onValueChange],
  );

  const toggle = React.useCallback(
    (v: string) => {
      const next = new Set(open);
      const has = next.has(v);
      if (mode === "multiple") {
        if (has) next.delete(v);
        else next.add(v);
      } else {
        if (has) {
          if (collapsible) next.clear();
        } else {
          next.clear();
          next.add(v);
        }
      }
      setOpen(next);
    },
    [open, mode, collapsible, setOpen],
  );

  const isOpen = React.useCallback((v: string) => open.has(v), [open]);

  return (
    <div className={cn("w-full", className)}>
      <AccordionContext.Provider value={{ mode, open, toggle, isOpen }}>
        {children}
      </AccordionContext.Provider>
    </div>
  );
}
Accordion.displayName = "Accordion";

/** ====== Item ====== */
export function AccordionItem({
  value,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  return (
    <ItemContext.Provider value={{ value }}>
      <div
        data-accordion-item=""
        className={cn(
          "rounded-2xl border bg-white/70 dark:bg-zinc-900/60",
          className,
        )}
        {...props}
      />
    </ItemContext.Provider>
  );
}
AccordionItem.displayName = "AccordionItem";

/** ====== Trigger ====== */
export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const item = React.useContext(ItemContext);
  const ctx = React.useContext(AccordionContext);
  if (!item || !ctx)
    throw new Error(
      "AccordionTrigger must be inside <AccordionItem> within <Accordion>",
    );

  const open = ctx.isOpen(item.value);
  const triggerId = React.useId();
  const contentId = `${triggerId}-content`;

  return (
    <button
      type="button"
      id={triggerId}
      aria-controls={contentId}
      aria-expanded={open}
      onClick={() => ctx.toggle(item.value)}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-start",
        "hover:bg-amber-50 dark:hover:bg-white/10",
        className,
      )}
      {...props}
    >
      <span className="font-medium">{children}</span>
      <span
        aria-hidden
        className={cn(
          "ms-2 inline-grid h-5 w-5 place-items-center rounded-full border text-xs",
          open ? "rotate-180" : "rotate-0",
        )}
      >
        ▾
      </span>
    </button>
  );
}
AccordionTrigger.displayName = "AccordionTrigger";

/** ====== Content ====== */
export function AccordionContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const item = React.useContext(ItemContext);
  const ctx = React.useContext(AccordionContext);
  if (!item || !ctx)
    throw new Error(
      "AccordionContent must be inside <AccordionItem> within <Accordion>",
    );

  const open = ctx.isOpen(item.value);
  const triggerId = React.useId();
  const contentId = `${triggerId}-content`;

  return (
    <div
      id={contentId}
      role="region"
      aria-labelledby={triggerId}
      hidden={!open}
      className={cn("px-4 pb-4 pt-0 text-sm", !open && "hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
}
AccordionContent.displayName = "AccordionContent";
