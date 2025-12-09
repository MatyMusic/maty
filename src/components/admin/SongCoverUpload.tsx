"use client";

import { useCallback, useRef, useState } from "react";
import Script from "next/script";

declare global { interface Window { cloudinary: any; } }

type Props = {
  onUploaded: (file: { coverUrl: string; coverPublicId: string }) => void;
  folder?: string;
  tags?: string[];
};

export default function SongCoverUpload({ onUploaded, folder="maty-music/covers", tags=[] }: Props) {
  const [ready, setReady] = useState(false);
  const widgetRef = useRef<any>(null);

  const open = useCallback(() => {
    if (!ready || !window.cloudinary) return;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "maty_unsigned";
    if (!widgetRef.current) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName, uploadPreset, folder, tags,
          multiple: false,
          clientAllowedFormats: ["jpg","jpeg","png","webp"],
          maxImageFileSize: 20*1024*1024,
          cropping: true,
          croppingAspectRatio: 1,
          croppingShowDimensions: true,
          showSkipCropButton: true,
        },
        (error:any, result:any) => {
          if (error) { alert("שגיאת העלאה: " + (error?.message||"")); return; }
          if (result?.event === "success") {
            const info = result.info;
            onUploaded({ coverUrl: info.secure_url, coverPublicId: info.public_id });
          }
        }
      );
    }
    widgetRef.current.open();
  }, [ready, onUploaded, folder, tags]);

  return (
    <>
      <Script src="https://upload-widget.cloudinary.com/v2.0/global/all.js"
              strategy="afterInteractive" onLoad={() => setReady(true)} />
      <button className="mm-btn mm-pressable" onClick={open} disabled={!ready}>
        העלה עטיפה
      </button>
    </>
  );
}
