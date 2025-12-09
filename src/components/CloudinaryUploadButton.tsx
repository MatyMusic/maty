"use client";

import { useCallback, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window { cloudinary: any }
}

type Props = {
  onUploaded?: () => void; // רענון אחרי הצלחה
  folder?: string;         // אופציונלי: לארגון בתיקיות
  tags?: string[];         // תגיות דיפולט
};

export default function CloudinaryUploadButton({
  onUploaded,
  folder = "maty-music",
  tags = [],
}: Props) {
  const [ready, setReady] = useState(false);
  const widgetRef = useRef<any>(null);

  const open = useCallback(() => {
    if (!ready || !window.cloudinary) return;

    if (!widgetRef.current) {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
      const uploadPreset =
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "maty_unsigned";

      if (!cloudName) {
        alert("חסר NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ב-.env");
        return;
      }

      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName,
          uploadPreset,
          sources: ["local", "url", "camera"],
          multiple: true,
          maxFiles: 50,
          folder,
          tags,
          showAdvancedOptions: false,
          clientAllowedFormats: [
            "jpg","jpeg","png","webp","gif",
            "mp4","mov","webm",
            "mp3","wav","m4a",
          ],
          maxFileSize: 1024 * 1024 * 1024, // 1GB
          styles: {
            palette: {
              window: "#111",
              sourceBg: "#111",
              textDark: "#fff",
              link: "#6ee7b7",
              action: "#22c55e",
            },
          },
        },
        async (error: any, result: any) => {
          if (error) {
            alert("שגיאת העלאה: " + (error?.message || "unknown"));
            return;
          }

          if (result?.event === "success") {
            const info = result.info;
            const kind =
              info.resource_type === "image"
                ? "image"
                : ["mp3", "wav", "m4a"].includes(String(info.format).toLowerCase())
                ? "audio"
                : "video";

            const payload = {
              kind,
              title: info.original_filename || "",
              publicId: info.public_id,
              url: info.secure_url,
              thumbUrl: info?.thumbnail_url || info?.secure_url,
              duration: Number(info?.duration || 0),
              width: Number(info?.width || 0),
              height: Number(info?.height || 0),
              bytes: Number(info?.bytes || 0),
              format: info?.format || "",
              tags,
            };

            const r = await fetch("/api/admin/media", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!r.ok) {
              const j = await r.json().catch(() => ({}));
              alert("שמירה ב-DB נכשלה: " + (j?.error || r.statusText));
            }
          }

          if (result?.event === "queues-end") {
            onUploaded?.();
          }
        }
      );
    }

    widgetRef.current.open();
  }, [ready, onUploaded, folder, tags]);

  return (
    <>
      <Script
        src="https://upload-widget.cloudinary.com/v2.0/global/all.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <button className="mm-btn mm-פרסבל" onClick={open} disabled={!ready}>
        {ready ? "העלה מדיה" : "טוען…"}
      </button>
    </>
  );
}
