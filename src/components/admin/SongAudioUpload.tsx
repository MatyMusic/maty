"use client";

import { useCallback, useRef, useState } from "react";
import Script from "next/script";

declare global { interface Window { cloudinary: any; } }

type Props = {
  onUploaded: (file: {
    audioUrl: string;
    audioPublicId: string;
    duration: number;
    format: string;
  }) => void;
  folder?: string;
  tags?: string[];
};

export default function SongAudioUpload({ onUploaded, folder="maty-music/audio", tags=[] }: Props) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const widgetRef = useRef<any>(null);

  const open = useCallback(() => {
    if (!ready || !window.cloudinary) return;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "maty_unsigned";
    if (!widgetRef.current) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName, uploadPreset, folder, tags,
          sources: ["local", "url"],
          multiple: false,
          maxFiles: 1,
          clientAllowedFormats: ["mp3","wav","m4a","aac","ogg","flac"],
          maxFileSize: 1024*1024*1024,
          styles: { palette: { window:"#111", sourceBg:"#111", textDark:"#fff", action:"#22c55e" } },
        },
        (error: any, result: any) => {
          if (error) { alert("שגיאת העלאה: " + (error?.message||"")); setBusy(false); return; }
          if (result?.event === "queues-start") setBusy(true);
          if (result?.event === "success") {
            const info = result.info;
            onUploaded({
              audioUrl: info.secure_url,
              audioPublicId: info.public_id,
              duration: Number(info?.duration || 0),
              format: String(info?.format || ""),
            });
          }
          if (result?.event === "queues-end") setBusy(false);
        }
      );
    }
    widgetRef.current.open();
  }, [ready, onUploaded, folder, tags]);

  return (
    <>
      <Script src="https://upload-widget.cloudinary.com/v2.0/global/all.js"
              strategy="afterInteractive" onLoad={() => setReady(true)} />
      <button className="mm-btn mm-pressable" onClick={open} disabled={!ready || busy}>
        {busy ? "מעלה…" : "העלה קובץ אודיו"}
      </button>
    </>
  );
}
