// src/app/(site)/avatars/page.tsx
import { AVATARS } from "@/constants/avatars";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "אווטארים ונגני מוזיקה — MATY MUSIC",
};

export default function AvatarsPage() {
  return (
    <section className="section-padding">
      <div className="container-section max-w-5xl mx-auto">
        <div className="card text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-2">אווטארים ונגנים</h1>
          <p className="opacity-80 text-sm md:text-base">
            כאן תוכל לבחור אווטאר לפי סגנון — ולכל אחד יש נגן שירים משלו.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {AVATARS.map((a) => (
            <Link
              key={a.id}
              href={`/avatars/${a.id}`}
              className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 hover:bg-slate-900/80 shadow-lg hover:shadow-2xl transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-4 p-4 md:p-5">
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  {/* תמונת האווטאר אם קיימת */}
                  {a.src ? (
                    <img
                      src={a.src}
                      alt={a.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">🎵</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex-1 text-right">
                  <h2 className="text-lg md:text-xl font-bold mb-1">
                    {a.label}
                  </h2>
                  <p className="text-xs md:text-sm opacity-80">
                    לחץ כדי להיכנס לנגן השירים של הסגנון הזה.
                  </p>
                  <div className="mt-2 text-xs opacity-70">
                    <span className="inline-flex items-center gap-1">
                      <span>▶</span>
                      <span>פתיחת נגן</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-violet-600/20 blur-3xl group-hover:bg-violet-500/25 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
