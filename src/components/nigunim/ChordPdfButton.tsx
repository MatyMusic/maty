// src/components/nigunim/ChordPdfButton.tsx
"use client";
import { useRef, useState } from "react";
import { domToPdf } from "@/lib/pdf/dom-to-pdf";
import { renderChordProToHTML } from "@/lib/music/chordpro";

type Props = {
  title: string;
  chordsChordPro?: string;
  lyricsHe?: string;
  youtubeUrl?: string;
  transpose?: number; // חצי־טונים
};

export default function ChordPdfButton({ title, chordsChordPro, lyricsHe, youtubeUrl, transpose = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!ref.current) return;
    setBusy(true);
    try {
      await domToPdf(ref.current, `${title.replace(/\s+/g, "_")}_chords.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* כפתור הורדה */}
      <button
        onClick={onClick}
        disabled={busy}
        className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
        title="הורד PDF של האקורדים"
      >
        {busy ? "מכין PDF..." : "הורד PDF"}
      </button>

      {/* תוכן נסתר להדפסה ל-PDF (נאמן למה שמוצג באתר) */}
      <div dir="rtl" className="fixed -left-[9999px] top-0 w-[794px] bg-white text-black p-24">
        {/* 794pt ~= רוחב A4 ב-pt; הגדלה של padding ל־מראה נקי */}
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        {typeof transpose === "number" && (
          <div className="text-sm opacity-70 mb-4">טרנספוזיציה: {transpose > 0 ? `+${transpose}` : transpose} st</div>
        )}

        {youtubeUrl && (
          <div className="mb-4 flex items-center gap-8">
            <div>
              קישור: {youtubeUrl}
            </div>
            {/* QR on-the-fly */}
            <img
              src={`/api/qr?url=${encodeURIComponent(youtubeUrl)}`}
              alt="QR"
              className="h-24 w-24"
            />
          </div>
        )}

        {chordsChordPro && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">אקורדים</h2>
            <div
              className="prose prose-sm max-w-none"
              // מייצרים HTML אחרי טרנספוזיציה
              dangerouslySetInnerHTML={{ __html: renderChordProToHTML(chordsChordPro, transpose) }}
            />
          </section>
        )}

        {lyricsHe && (
          <section>
            <h2 className="text-xl font-semibold mb-2">מילים</h2>
            <pre className="whitespace-pre-wrap text-sm">{lyricsHe}</pre>
          </section>
        )}
      </div>
    </>
  );
}
