// src/components/admin/CloudinaryAboutVideoButton.tsx
"use client";

import * as React from "react";

declare global {
  interface Window {
    cloudinary?: any;
  }
}

type UploadedVideo = {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes?: number;
  format?: string;
};

type Props = {
  label?: string;
  className?: string;
  onAfterSave?: () => void; // רענון רשימת וידאו אחרי שמירה
};

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "maty_unsigned";

export default function CloudinaryAboutVideoButton({
  label = "העלאת וידאו לדמואים",
  className = "",
  onAfterSave,
}: Props) {
  const [busy, setBusy] = React.useState(false);
  const scriptLoadedRef = React.useRef(false);
  const widgetRef = React.useRef<any | null>(null);

  // טעינת סקריפט Cloudinary פעם אחת
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.cloudinary?.createUploadWidget) {
      scriptLoadedRef.current = true;
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src^="https://widget.cloudinary.com/v2.0/global/all.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => {
        scriptLoadedRef.current = true;
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
    script.async = true;
    script.addEventListener("load", () => {
      scriptLoadedRef.current = true;
    });
    document.body.appendChild(script);
  }, []);

  const handleUploaded = React.useCallback(
    async (file: UploadedVideo) => {
      // שמירה בבסיס־נתונים דרך API ייעודי ל־ABOUT
      const res = await fetch("/api/about/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "וידאו חדש",
          category: "about",
          cloudPublicId: file.publicId,
          url: file.secureUrl,
          duration: file.duration,
          bytes: file.bytes,
          format: file.format,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        console.error("[ABOUT VIDEO] save error:", j);
        throw new Error(j?.error || res.statusText);
      }

      onAfterSave?.();
    },
    [onAfterSave],
  );

  const openWidget = React.useCallback(() => {
    if (typeof window === "undefined") return;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      alert(
        "חסרים ערכים ל־Cloudinary ב־ENV (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)",
      );
      return;
    }

    if (!scriptLoadedRef.current || !window.cloudinary) {
      alert("הווידג׳ט של Cloudinary עדיין נטען, נסה שוב עוד רגע.");
      return;
    }

    if (!widgetRef.current) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUD_NAME,
          uploadPreset: UPLOAD_PRESET,
          folder: "maty-music/about-videos",
          resourceType: "video",
          multiple: false,
          sources: ["local", "url", "camera"],
          maxFiles: 1,
        },
        async (error: any, result: any) => {
          console.log("[Cloudinary ABOUT callback]", { error, result });

          // סגירה / ביטול – בלי שגיאה
          if (result && ["abort", "close", "cancel"].includes(result.event)) {
            setBusy(false);
            return;
          }

          if (error) {
            console.error("[Cloudinary ABOUT] error:", error);
            const msg =
              error?.message ||
              (typeof error === "string" ? error : JSON.stringify(error || {}));
            alert("שגיאת העלאה: " + msg);
            setBusy(false);
            return;
          }

          if (!result || result.event !== "success" || !result.info) {
            setBusy(false);
            return;
          }

          const info = result.info;
          const file: UploadedVideo = {
            publicId: info.public_id,
            secureUrl: info.secure_url,
            width: info.width,
            height: info.height,
            duration: info.duration,
            bytes: info.bytes,
            format: info.format,
          };

          try {
            await handleUploaded(file);
          } catch (e: any) {
            alert("שמירה ב־DB נכשלה: " + (e?.message || "unknown"));
          } finally {
            setBusy(false);
          }
        },
      );
    }

    setBusy(true);
    widgetRef.current.open();
  }, []);

  return (
    <button
      type="button"
      onClick={openWidget}
      disabled={busy}
      className={`inline-flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-1.5 text-xs md:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition ${className}`}
    >
      {busy ? "מעלה…" : label}
    </button>
  );
}
