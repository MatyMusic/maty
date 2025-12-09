"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
};

type ToastContextValue = {
  show: (opts: { type?: ToastType; message: string; title?: string }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let _id = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    ({
      type = "info",
      message,
      title,
    }: {
      type?: ToastType;
      message: string;
      title?: string;
    }) => {
      const id = _id++;
      setToasts((prev) => [...prev, { id, type, message, title }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  const api = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message, title) => show({ type: "success", message, title }),
      error: (message, title) => show({ type: "error", message, title }),
      info: (message, title) => show({ type: "info", message, title }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* מכולת הטוסטים – צד ימין למטה, RTL */}
      <div
        dir="rtl"
        className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex w-full max-w-xs flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto rounded-2xl border px-3 py-2 text-xs shadow-lg backdrop-blur-md",
              t.type === "success" &&
                "border-emerald-400/60 bg-emerald-500/10 text-emerald-50",
              t.type === "error" &&
                "border-rose-400/70 bg-rose-500/15 text-rose-50",
              t.type === "info" &&
                "border-sky-400/60 bg-sky-500/10 text-sky-50",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                {t.title && (
                  <div className="text-[11px] font-semibold">{t.title}</div>
                )}
                <div className="text-[11px] opacity-90">{t.message}</div>
              </div>
              <button
                onClick={() => remove(t.id)}
                className="ml-2 rounded-full bg-black/30 px-2 text-[11px] opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
