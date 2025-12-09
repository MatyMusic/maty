"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Item = { title_he: string; slug: string };

export default function NigunimAutocomplete({
  placeholder = "חיפוש ניגון…",
  autoFocus = false,
  onSelect,         // אופציונלי: callback כשנבחר פריט
}: {
  placeholder?: string;
  autoFocus?: boolean;
  onSelect?: (item: Item) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // דיבאונס 200ms
  const debouncedQ = useDebounce(q, 200);

  useEffect(() => {
    let aborted = false;
    async function run() {
      if (!debouncedQ || debouncedQ.trim().length < 1) {
        setItems([]); setOpen(false); return;
      }
      const r = await fetch(`/api/songs/autocomplete?q=${encodeURIComponent(debouncedQ)}`, { cache: "no-store" });
      const j = await r.json();
      if (!aborted) {
        setItems(j.items || []);
        setOpen((j.items || []).length > 0);
        setActive(0);
      }
    }
    run();
    return () => { aborted = true; };
  }, [debouncedQ]);

  // סגירה כשנלחץ מחוץ
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function choose(i: number) {
    const it = items[i];
    if (!it) return;
    setOpen(false);
    setQ(it.title_he);
    onSelect?.(it);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(active);
      // אם אין onSelect – לנווט לכתובת ברירת מחדל
      if (!onSelect && items[active]) {
        window.location.href = `/nigunim/${items[active].slug}`;
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-md" dir="rtl">
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => items.length && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full border rounded px-3 py-2"
        role="combobox"
        aria-expanded={open}
        aria-controls="nigunim-ac-list"
        aria-autocomplete="list"
      />

      {open && (
        <ul
          id="nigunim-ac-list"
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-xl border bg-white shadow-lg overflow-hidden"
        >
          {items.map((it, i) => {
            const selected = i === active;
            return (
              <li
                key={it.slug}
                role="option"
                aria-selected={selected}
                className={`px-3 py-2 cursor-pointer ${selected ? "bg-violet-600 text-white" : "hover:bg-slate-100"}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); }} // שלא יאבד פוקוס לפני הניווט
                onClick={() => {
                  choose(i);
                  if (!onSelect) window.location.href = `/nigunim/${it.slug}`;
                }}
              >
                {onSelect ? (
                  <span>{it.title_he}</span>
                ) : (
                  <Link href={`/nigunim/${it.slug}`} className="block w-full h-full">
                    {it.title_he}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// הוק דיבאונס קטן
function useDebounce<T>(value: T, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}
