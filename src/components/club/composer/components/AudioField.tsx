"use client";
import * as React from "react";
import { Upload } from "lucide-react";
import { StatusText } from "./StatusText";
import { isHttpUrl } from "@/components/flub/composer/lib/utils";

export function AudioField({
  value,
  onChange,
  status,
  setStatus,
  handleFileUpload,
}: {
  value: string;
  onChange: (v: string) => void;
  status: "idle" | "bad" | "ok";
  setStatus: (s: "idle" | "bad" | "ok") => void;
  handleFileUpload: (f: File) => Promise<string>;
}) {
  return (
    <div>
      <label className="form-label">קישור אודיו (trackUrl) *</label>
      <div className="flex items-center gap-2">
        <input
          className="mm-input input-ltr flex-1"
          placeholder="https://…/audio.mp3"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() =>
            setStatus(value && isHttpUrl(value) ? "ok" : value ? "bad" : "idle")
          }
          required
          aria-invalid={status === "bad" ? true : undefined}
        />
        <label className="mm-btn cursor-pointer" title="בחר קובץ אודיו">
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const url = await handleFileUpload(f);
                onChange(url);
                setStatus("ok");
              } catch {
                setStatus("bad");
              }
            }}
          />
          <Upload className="h-4 w-4" />
        </label>
      </div>
      <StatusText
        status={status}
        idle="—"
        bad="נדרש קישור אודיו חוקי (http/https)"
        ok="✓ קישור תקין"
      />
      <p className="text-xs text-slate-500 mt-1">
        MP3/OGG ציבורי (CDN/Cloudinary/S3) או קובץ מקומי לתצוגה.
      </p>
      {isHttpUrl(value) && (
        <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 p-3 mt-2">
          <audio src={value} controls preload="metadata" className="w-full" />
        </div>
      )}
    </div>
  );
}
