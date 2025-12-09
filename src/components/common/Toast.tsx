// // src/components/common/toast.tsx
// "use client";
// import * as React from "react";
// import { createPortal } from "react-dom";
// import Toast from "@/components/common/Toast";

// type Variant = "success" | "error" | "info";
// type ToastItem = { id: number; text: string; type: Variant; duration: number };

// let idSeq = 1;

// /** קריאה גלובלית להצגת טוסט */
// export function showToast(
//   text: string,
//   type: Variant = "info",
//   duration = 2600
// ) {
//   if (typeof window === "undefined") return;
//   window.dispatchEvent(
//     new CustomEvent("maty:toast", {
//       detail: { id: idSeq++, text, type, duration } as ToastItem,
//     })
//   );
// }

// /** אליאס לטעות הייבוא שהייתה — ישבור כפילויות של קוד ישן */
// export const howToast = showToast;

// /** Host שמאזין לאיבנטים ומציג Stack טוסטים */
// export function ToastHost({ max = 3 }: { max?: number }) {
//   const [items, setItems] = React.useState<ToastItem[]>([]);
//   const rootRef = React.useRef<HTMLDivElement | null>(null);

//   React.useEffect(() => {
//     const onToast = (e: Event) => {
//       const d = (e as CustomEvent).detail as ToastItem & { duration?: number };
//       setItems((prev) => [...prev, d].slice(-max));
//       const ms = Math.max(1200, Math.min(8000, d.duration ?? 2600));
//       const id = d.id;
//       setTimeout(() => {
//         setItems((prev) => prev.filter((t) => t.id !== id));
//       }, ms);
//     };
//     window.addEventListener("maty:toast", onToast as any);
//     return () => window.removeEventListener("maty:toast", onToast as any);
//   }, [max]);

//   React.useEffect(() => {
//     if (!rootRef.current) {
//       const el = document.createElement("div");
//       el.id = "maty-toast-root";
//       document.body.appendChild(el);
//       rootRef.current = el;
//     }
//   }, []);

//   if (!rootRef.current) return null;

//   return createPortal(
//     <div
//       className="fixed z-[4000] top-4 inset-x-0 grid place-items-center gap-2"
//       dir="rtl"
//     >
//       {items.map((t) => (
//         <Toast
//           key={t.id}
//           open
//           type={t.type}
//           text={t.text}
//           onClose={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
//         />
//       ))}
//     </div>,
//     rootRef.current
//   );
// }

"use client";

export type ToastKind = "success" | "error" | "info";

export type ToastProps = {
  open: boolean;
  type?: ToastKind;
  text: string;
  onClose: () => void;
};

export function Toast({ open, type = "success", text, onClose }: ToastProps) {
  if (!open) return null;
  const base =
    "fixed left-1/2 -translate-x-1/2 top-4 z-[4000] px-4 py-2 rounded-xl shadow-lg border text-sm";
  const theme =
    type === "success"
      ? "bg-emerald-600 text-white border-emerald-500"
      : type === "error"
      ? "bg-rose-600 text-white border-rose-500"
      : "bg-neutral-800 text-white border-neutral-700";
  return (
    <button
      type="button"
      className={`${base} ${theme}`}
      onClick={onClose}
      title="סגור"
    >
      {text}
    </button>
  );
}

export default Toast;
