"use client";
import * as React from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { StatusText } from "./StatusText";
import { isHttpUrl } from "../lib/utils";

export function CoverPicker({
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
      <label className="form-label">תמונת שער (coverUrl)</label>
      <div className="flex items-center gap-2">
        <input
          className="mm-input input-ltr flex-1"
          placeholder="https://…/cover.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() =>
            setStatus(value && isHttpUrl(value) ? "ok" : value ? "bad" : "idle")
          }
        />
        <label
          className="mm-btn cursor-pointer"
          title="בחר/י קובץ תמונה מהמחשב"
        >
          <input
            type="file"
            accept="image/*"
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
          <ImageIcon className="h-4 w-4" />
        </label>
      </div>
      <StatusText
        status={status}
        idle="—"
        bad="קישור/קובץ תמונה לא תקין"
        ok="✓ תמונה מוכנה"
      />
      {value && isHttpUrl(value) && (
        <div className="rounded-xl overflow-hidden mt-2 border border-black/10 dark:border-white/10 bg-white/60 dark:bg-neutral-900/60 grid place-items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="max-h-44 object-contain" />
        </div>
      )}
    </div>
  );
}
