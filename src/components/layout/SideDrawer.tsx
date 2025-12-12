// src/components/layout/SideDrawer.tsx
"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

type Item = { href: string; label: string; badge?: React.ReactNode };
type Props = {
  open: boolean;
  onClose: () => void;
  items?: Item[];
  footer?: React.ReactNode;
  header?: React.ReactNode;
  side?: "right" | "left";
};

export default function SideDrawer({
  open,
  onClose,
  items = [],
  footer,
  header,
  side = "right",
}: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  React.useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={[
        "fixed inset-0 z-[80]",
        open ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
    >
      {/* Backdrop */}
      <div
        className={[
          "absolute inset-0 transition-opacity",
          open ? "bg-black/40 opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        ref={ref}
        dir="rtl"
        className={[
          "absolute top-0 h-full w-[88vw] max-w-[420px] bg-white/98 dark:bg-neutral-950/98",
          "shadow-2xl border-y border-l dark:border-neutral-800/60 rounded-s-2xl",
          "flex flex-col",
          "transition-all duration-300 ease-in-out",
          side === "right"
            ? open
              ? "right-0 translate-x-0"
              : "-right-2 -translate-x-2 opacity-0"
            : open
              ? "left-0 translate-x-0"
              : "-left-2 translate-x-2 opacity-0",
        ].join(" ")}
      >
        <div className="p-4 border-b dark:border-neutral-800/60 flex items-center gap-3">
          <button
            onClick={onClose}
            aria-label="סגור תפריט"
            className="rounded-xl border dark:border-neutral-700 px-3 py-2 hover:bg-neutral-100/70 dark:hover:bg-neutral-900"
          >
            <X className="size-5" />
          </button>
          <div className="text-sm opacity-70">תפריט ראשי</div>
          <div className="ms-auto">{header}</div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {items.map((it) => {
              const active =
                pathname === it.href || pathname?.startsWith(it.href + "/");
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onClose}
                    className={[
                      "flex items-center justify-between rounded-xl px-4 py-3",
                      "hover:bg-neutral-100 dark:hover:bg-neutral-900",
                      active ? "bg-neutral-100/80 dark:bg-neutral-900/80" : "",
                    ].join(" ")}
                  >
                    <span className="font-medium">{it.label}</span>
                    {it.badge}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {footer ? (
          <div className="p-3 border-t dark:border-neutral-800/60">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
