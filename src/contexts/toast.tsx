"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: number;
  kind: ToastKind;
  title?: string;
  message: string;
};

type ToastContextValue = {
  push: (kind: ToastKind, message: string, title?: string) => void;
};

const ToastCtx = createContext<ToastContextValue | null>(null);

let _id = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback(
    (kind: ToastKind, message: string, title?: string) => {
      const id = _id++;
      setItems((prev) => [...prev, { id, kind, message, title }]);
      // auto-hide
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      {/* מכולת הטוסטים בפינה */}
      <div className="fixed z-[9999] top-4 left-4 flex flex-col gap-2 max-w-sm pointer-events-none">
        {items.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto rounded-xl px-3 py-2 shadow-lg text-sm border backdrop-blur bg-white/90 dark:bg-neutral-900/90 flex gap-2 items-start",
              t.kind === "success"
                ? "border-emerald-300 text-emerald-900 dark:text-emerald-100"
                : t.kind === "error"
                  ? "border-rose-300 text-rose-900 dark:text-rose-100"
                  : "border-sky-300 text-sky-900 dark:text-sky-100",
            ].join(" ")}
          >
            <div className="mt-0.5">
              {t.kind === "success" && "✅"}
              {t.kind === "error" && "⚠️"}
              {t.kind === "info" && "ℹ️"}
            </div>
            <div className="flex-1">
              {t.title && (
                <div className="font-semibold text-[13px] mb-0.5">
                  {t.title}
                </div>
              )}
              <div className="text-[12px] leading-snug">{t.message}</div>
            </div>
            <button
              onClick={() =>
                setItems((prev) => prev.filter((x) => x.id !== t.id))
              }
              className="ml-1 text-xs opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}
