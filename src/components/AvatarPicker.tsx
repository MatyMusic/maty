// src/components/AvatarPicker.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { AVATARS, type Genre } from "@/constants/avatars";
import Avatar from "@/components/Avatar";

export default function AvatarPicker({
  value,
  onChange,
  withStyles = true,
  storageKey = "preferredAvatarId",
}: {
  value?: string;
  onChange: (id: string) => void;
  withStyles?: boolean;
  storageKey?: string;
}) {
  const [selected, setSelected] = useState<string | undefined>(value);
  useEffect(() => setSelected(value), [value]);

  useEffect(() => {
    if (selected) {
      try { localStorage.setItem(storageKey, selected); } catch {}
    }
  }, [selected, storageKey]);

  const handlePick = (id: string) => {
    setSelected(id);
    onChange(id);
  };

  const chips = useMemo(() => {
    if (!withStyles) return null;
    return (
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="בחירת וייב">
        {AVATARS.map((a) => {
          const active = a.id === selected;
          return (
            <button
              key={a.id}
              role="tab"
              aria-selected={active}
              className={[
                "px-3 py-1.5 rounded-full text-sm border transition",
                active
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
                  : "bg-white/70 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800",
              ].join(" ")}
              onClick={() => handlePick(a.id)}
            >
              {a.label}
            </button>
          );
        })}
      </div>
    );
  }, [selected, withStyles]);

  return (
    <div dir="rtl" className="grid gap-3">
      {chips}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {AVATARS.map((a) => {
          const active = a.id === selected;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => handlePick(a.id)}
              className={[
                "group rounded-2xl border p-3 text-center transition focus:outline-none focus:ring-2 focus:ring-violet-500",
                active
                  ? "border-violet-500 ring-2 ring-violet-300/40 bg-violet-50/40 dark:bg-violet-500/10"
                  : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5",
              ].join(" ")}
              aria-pressed={active}
            >
              <Avatar genre={a.id as Genre} circle size={64} className="mx-auto" />
              <div className="mt-2 text-sm font-medium">{a.label}</div>
            </button>
          );
        })}
      </div>

      <p className="text-xs opacity-70">
        קבצי האווטאר נטענים מתוך <code>/assets/images</code> לפי שמות הקבצים הקיימים.
      </p>
    </div>
  );
}
