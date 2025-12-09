"use client";
import { useState } from "react";

export default function PhotoUploader({
  onAdd,
}: {
  onAdd: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setBusy(true);
    try {
      const r = await fetch("/api/upload/cloudinary/unsigned", {
        method: "POST",
        body: fd,
      });
      const j = await r.json();
      if (j.secure_url) onAdd(j.secure_url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFiles}
      />
      <span className="inline-flex h-9 items-center rounded-2xl px-4 border shadow-sm">
        {busy ? "מעלה..." : "העלה תמונה"}
      </span>
    </label>
  );
}
