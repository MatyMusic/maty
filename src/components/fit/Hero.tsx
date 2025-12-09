// src/components/fit/Hero.tsx
"use client";
import Image from "next/image";
import * as React from "react";

const REMOTE = [
  "https://images.unsplash.com/photo-1558611848-73f7eb4001a1",
  "https://images.unsplash.com/photo-1571731956672-ac8e1f5a07bd",
  "https://images.unsplash.com/photo-1571907480495-905ebbd9aa1b",
  "https://images.unsplash.com/photo-1571732202065-90aaf3b9c65b",
  "https://images.unsplash.com/photo-1546484959-f9a53db89f9d",
  "https://images.unsplash.com/photo-1540497077202-7c8a3999166f",
];

const FALLBACK = "/assets/images/fit/fallback.jpg"; // שים קובץ אמיתי פה (public/assets/images/fit/fallback.jpg)

export default function Hero() {
  const [idx, setIdx] = React.useState(0);
  const [src, setSrc] = React.useState(REMOTE[0]);

  React.useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => {
        const n = (i + 1) % REMOTE.length;
        setSrc(REMOTE[n]);
        return n;
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden rounded-3xl border">
      <div className="relative h-[42vh] min-h-[260px] w-full">
        <Image
          key={src}
          src={src}
          alt="Fitness hero"
          fill
          sizes="100vw"
          priority
          className="object-cover"
          onError={() => {
            // אם התמונה מרחוק לא נטענת – עוברים לפולבאק מקומי
            setSrc(FALLBACK);
          }}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

      <div className="absolute bottom-0 right-0 left-0 p-6 text-white rtl">
        <h1 className="text-2xl md:text-4xl font-bold">בואו זזים</h1>
        <p className="opacity-90 mt-1">אימונים, תרגילים ושותפים – במקום אחד</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/fit/exercises" className="mm-btn mm-btn-primary">תרגילים</a>
          <a href="/fit/partners" className="mm-btn">שותפים סביבי</a>
          <a href="/fit/programs" className="mm-btn mm-btn-ghost">תכניות</a>
        </div>
      </div>
    </section>
  );
}
