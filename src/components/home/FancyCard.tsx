// src/components/home/FancyCard.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

type Props = {
  href: string;
  title: string;
  subtitle: string;
  emoji: string;
  i: number;
};

export default function FancyCard({ href, title, subtitle, emoji, i }: Props) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 22, scale: 0.985 }}
      whileInView={reduce ? {} : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 16, delay: i * 0.05 }}
      className="relative"
    >
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-2 -z-10 rounded-3xl blur-2xl"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 24 + i * 4, ease: "linear" }}
          style={{
            background:
              href === "/pricing"
                ? "conic-gradient(from 0deg, rgba(99,102,241,0.45), rgba(236,72,153,0.35), rgba(99,102,241,0.45))"
                : "radial-gradient(closest-side, rgba(99,102,241,0.25), rgba(99,102,241,0) 70%)",
          }}
        />
      )}

      <Link
        href={href}
        className="group block rounded-2xl border p-5 shadow-md backdrop-blur transition-all bg-white/70 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 hover:shadow-lg hover:scale-[1.01]"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="mb-3 grid h-12 w-12 place-items-center rounded-xl text-2xl shadow-inner transition-transform group-hover:-translate-y-0.5"
          style={{
            background: "radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0.45))",
            transform: "translateZ(24px)",
          }}
        >
          <span aria-hidden>{emoji}</span>
        </div>

        <div style={{ transform: "translateZ(18px)" }}>
          <h3 className="text-lg font-extrabold tracking-tight">{title}</h3>
          {/* היה <p> — הוחלף ל־div כדי למנוע nested block בתוך פסקה */}
          <div className="mt-1 text-sm opacity-80">{subtitle}</div>
        </div>

        <div
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold opacity-90 transition group-hover:opacity-100"
          style={{ transform: "translateZ(12px)" }}
        >
          <span>פתח</span>
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">↗</span>
        </div>
      </Link>
    </motion.div>
  );
}
