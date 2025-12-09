"use client";
import * as React from "react";
import { Upload } from "lucide-react";
import { StatusText } from "./StatusText";
import { isHttpUrl } from "../lib/utils";

export function VideoField({
  value,
  onChange,
  status,
  setStatus,
  handleFileUpload,
  coverUrl,
}: {
  value: string;
  onChange: (v: string) => void;
  status: "idle" | "bad" | "ok";
  setStatus: (s: "idle" | "bad" | "ok") => void;
  handleFileUpload: (f: File) => Promise<string>;
  coverUrl?: string;
}) {
  return (
    <div>
      <label className="form-label">קישור וידאו (videoUrl) *</label>
      <div className="flex items-center gap-2">
        <input
          className="mm-input input-ltr flex-1"
          placeholder="https://…/video.mp4"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() =>
            setStatus(value && isHttpUrl(value) ? "ok" : value ? "bad" : "idle")
          }
          required
          aria-invalid={status === "bad" ? true : undefined}
        />
        <label className="mm-btn cursor-pointer" title="בחר קובץ וידאו מהמחשב">
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const url = await handleFileUpload(f);
                onChange(url);
                setStatus("ok");
              } catch (ex: any) {
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
        bad="נדרש קישור וידאו חוקי (http/https)"
        ok="✓ קישור תקין"
      />
      <p className="text-xs text-slate-500 mt-1">
        MP4/WEBM ציבורי (CDN, Cloudinary, S3 וכו׳) או קובץ מקומי לתצוגה.
      </p>

      {isHttpUrl(value) && (
        <div className="rounded-xl overflow-hidden mt-2">
          <video
            src={value}
            className="w-full h-auto"
            poster={coverUrl || undefined}
            controls
            playsInline
            preload="metadata"
          />
        </div>
      )}
    </div>
  );
}
