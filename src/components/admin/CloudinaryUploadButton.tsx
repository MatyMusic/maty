"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    cloudinary?: any;
  }
}

type MediaKind = "image" | "video" | "audio";

type SavedDoc = {
  kind: MediaKind;
  title: string;
  publicId: string;
  url: string;
  thumbUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  tags?: string[];
};

type Props = {
  label?: string;
  className?: string;
  onUploaded?: () => void; // נקרא בסוף התור
  onSuccess?: (doc: SavedDoc) => void; // נקרא לכל פריט מוצלח
  folder?: string;
  tags?: string[];
  multiple?: boolean;
};

/** דואג שתמיד תהיה תגית "gallery" כדי ש-/api/gallery ימצא את הפריטים */
function ensureGalleryTags(tags: string[] = []): string[] {
  const base = tags.filter(Boolean);
  if (!base.includes("gallery")) base.push("gallery");
  return Array.from(new Set(base));
}

export default function CloudinaryUploadButton({
  label = "העלה מדיה",
  className = "mm-btn mm-pressable",
  onUploaded,
  onSuccess,
  folder = "maty-music",
  tags = [],
  multiple = true,
}: Props) {
  const [widgetReady, setWidgetReady] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);
  const [busy, setBusy] = useState(false);

  const widgetRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const uploadPreset =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    process.env.CLOUDINARY_UPLOAD_PRESET ||
    "maty_unsigned";

  // נוסיף תמיד gallery לתגיות
  const effectiveTags = ensureGalleryTags(tags);

  // מסמן שהסקריפט נטען
  const handleScriptLoad = () => {
    if (window.cloudinary?.createUploadWidget) setWidgetReady(true);
  };

  // אם אחרי 4 שניות אין ווידג׳ט → נסה CDN חלופי
  useEffect(() => {
    const t = setTimeout(() => {
      if (!window.cloudinary?.createUploadWidget) setTriedFallback(true);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  // בניית מסמך ושמירה ב־DB
  const saveToDB = useCallback(
    async (info: any) => {
      const kind: MediaKind =
        info.resource_type === "image"
          ? "image"
          : ["mp3", "wav", "m4a"].includes(String(info.format).toLowerCase())
            ? "audio"
            : "video";

      const payload: SavedDoc = {
        kind,
        title: info.original_filename || "",
        publicId: info.public_id,
        url: info.secure_url,
        thumbUrl: info?.thumbnail_url || info?.secure_url,
        duration: Number(info?.duration || 0) || 0,
        width: Number(info?.width || 0) || 0,
        height: Number(info?.height || 0) || 0,
        bytes: Number(info?.bytes || 0) || 0,
        format: info?.format || "",
        tags: effectiveTags,
      };

      const r = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        console.error("[CloudinaryUploadButton] DB save error:", j);
        throw new Error(j?.error || r.statusText);
      }

      onSuccess?.(payload);
    },
    [effectiveTags, onSuccess],
  );

  // פתיחת ווידג׳ט / פולבק
  const open = useCallback(() => {
    if (!cloudName) {
      alert("חסר NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME בקובץ .env.local");
      return;
    }

    // ווידג׳ט Cloudinary
    if (window.cloudinary?.createUploadWidget) {
      if (!widgetRef.current) {
        widgetRef.current = window.cloudinary.createUploadWidget(
          {
            cloudName,
            uploadPreset,
            sources: ["local", "url", "camera"],
            multiple,
            maxFiles: multiple ? 50 : 1,
            folder,
            tags: effectiveTags,
            clientAllowedFormats: [
              "jpg",
              "jpeg",
              "png",
              "webp",
              "gif",
              "mp4",
              "mov",
              "webm",
              "mp3",
              "wav",
              "m4a",
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
              console.error("[Cloudinary widget] error:", error);
              alert("שגיאת העלאה: " + (error?.message || "unknown"));
              setBusy(false);
              return;
            }

            if (
              result?.event === "display-changed" &&
              result?.info === "shown"
            ) {
              setBusy(true);
            }

            if (result?.event === "success") {
              try {
                await saveToDB(result.info);
              } catch (e: any) {
                alert("שמירה ב-DB נכשלה: " + (e?.message || "unknown"));
              }
            }

            if (result?.event === "queues-end") {
              setBusy(false);
              onUploaded?.();
            }
          },
        );
      }
      widgetRef.current.open();
    } else {
      // פולבק: input[type=file]
      inputRef.current?.click();
    }
  }, [
    cloudName,
    uploadPreset,
    folder,
    effectiveTags,
    multiple,
    onUploaded,
    saveToDB,
  ]);

  // פולבק: העלאה ישירה ל־Cloudinary unsigned
  const onBasicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setBusy(true);
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", uploadPreset);
      form.append("folder", folder);
      if (effectiveTags.length) form.append("tags", effectiveTags.join(","));

      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          {
            method: "POST",
            body: form,
          },
        );
        const info = await res.json();
        if (!res.ok || info.error)
          throw new Error(info?.error?.message || "upload_failed");

        await saveToDB(info);
      } catch (err: any) {
        console.error("[Cloudinary fallback upload] error:", err);
        alert(`שגיאת העלאה (${file.name}): ` + (err?.message || "unknown"));
      }
    }

    setBusy(false);
    onUploaded?.();
    e.currentTarget.value = ""; // ריענון בחירה
  };

  const disabled = busy || (!widgetReady && triedFallback && !inputRef.current);

  return (
    <>
      {/* סקריפט ראשי */}
      {!triedFallback && (
        <Script
          src="https://upload-widget.cloudinary.com/global/all.js"
          strategy="afterInteractive"
          onLoad={handleScriptLoad}
        />
      )}
      {/* סקריפט חלופי אם הראשון לא הגיע */}
      {triedFallback && !widgetReady && (
        <Script
          src="https://widget.cloudinary.com/v2.0/global/all.js"
          strategy="afterInteractive"
          onLoad={handleScriptLoad}
        />
      )}

      {/* קלט פולבק נסתר */}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        accept="image/*,video/*,audio/*"
        onChange={onBasicChange}
      />

      <button className={className} onClick={open} disabled={disabled}>
        {busy ? "מעלה…" : label}
      </button>
    </>
  );
}
