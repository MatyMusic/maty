// src/app/(site)/gallery/page.tsx
import GalleryClient from "@/components/gallery/GalleryClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "גלריה — MATY-MUSIC",
};

export default function GalleryPage() {
  return (
    <section className="section-padding">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-6xl mx-auto px-4 text-right">
          <div className="card mb-6">
            <h1 className="text-3xl font-extrabold mb-2">גלריה</h1>
            <p className="opacity-80">
              כאן תמצא תמונות, סרטונים ושירים מאירועים, חזרות ומאחורי הקלעים של
              MATY-MUSIC.
            </p>
            <p className="text-xs opacity-70 mt-2">
              אם אתה אדמין – תראה למעלה אזור ניהול גלריה (העלאה / מחיקה / עריכת
              פרטים). משתמש רגיל רואה גלריה בלבד עם לייקים ותגובות.
            </p>
          </div>

          <GalleryClient />
        </div>
      </div>
    </section>
  );
}
