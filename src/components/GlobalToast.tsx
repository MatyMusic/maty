"use client";
import { useEffect, useState } from "react";

type Toast = { id: number; type: "success" | "error" | "info"; text: string };

export default function GlobalToast() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    let id = 1;
    const onToast = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const t: Toast = { id: id++, type: d.type ?? "info", text: String(d.text ?? "") };
      setItems((x) => [...x, t]);
      setTimeout(() => setItems((xs) => xs.filter((i) => i.id !== t.id)), 3500);
    };
    window.addEventListener("mm:toast", onToast as EventListener);
    return () => window.removeEventListener("mm:toast", onToast as EventListener);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`rounded-xl px-3 py-2 text-sm shadow-lg border
            ${t.type === "success" ? "bg-emerald-600 text-white border-emerald-700"
            : t.type === "error" ? "bg-rose-600 text-white border-rose-700"
            : "bg-slate-800 text-white border-slate-700"}`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
