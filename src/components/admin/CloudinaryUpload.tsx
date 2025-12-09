// src/components/admin/CloudinaryUpload.tsx
"use client";
import { useState, type ChangeEvent } from "react";

export default function CloudinaryUpload({
  label,
  resourceType = "auto",
  value,
  onChange,
  folder = "maty-music/nigunim",
}: {
  label: string;
  resourceType?: "image" | "video" | "raw" | "auto";
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      // בקשת חתימה
      const signRes = await fetch("/api/upload/sign-cloudinary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, resource_type: resourceType }),
      });
      const sign = await signRes.json();
      if (!sign.ok) throw new Error(sign.error || "sign failed");

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sign.apiKey);
      form.append("timestamp", String(sign.timestamp));
      form.append("signature", sign.signature);
      form.append("folder", sign.folder);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/${sign.resource_type}/upload`;
      const r = await fetch(uploadUrl, { method: "POST", body: form });
      const j = await r.json();

      if (!j.secure_url) throw new Error("upload failed");
      onChange(j.secure_url);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
      // מאפשר לבחור את אותו קובץ שוב אם צריך
      (e.target as HTMLInputElement).value = "";
    }
  }

  return (
    <div className="p-4 rounded-2xl border">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{label}</span>
        {busy && <span className="text-xs opacity-60">מעלה…</span>}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="file"
          onChange={handleFile}
          disabled={busy}
          className="block"
        />
        {value && (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-violet-600 underline text-sm"
          >
            נוכחי
          </a>
        )}
      </div>

      {value && (
        <div className="mt-3">
          {resourceType === "image" || resourceType === "auto" ? (
            <img
              src={value}
              alt={label}
              className="w-32 h-32 object-cover rounded-xl border"
            />
          ) : resourceType === "video" ? (
            <video src={value} controls className="w-64 rounded-xl border" />
          ) : (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="text-xs underline"
            >
              צפייה בקובץ
            </a>
          )}
        </div>
      )}
    </div>
  );
}
