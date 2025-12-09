"use client";
import { useCallback, useMemo, useState } from "react";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
// נעדיף להעלות לנתיב /video/upload כדי שקלאודינרי יתייחס לאודיו כ"וידאו" ויחשב duration
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD}/video/upload`;

function slugify(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0590-\u05FF]/g, (m) => m)
    .trim()
    .toLowerCase()
    .replace(/[\s\p{S}\p{P}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type Row = {
  file: File;
  title: string;
  slug: string;
  progress: number; // 0-100
  state: "idle" | "uploading" | "attaching" | "done" | "error";
  error?: string;
  cloudUrl?: string;
  duration?: number;
};

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const busy = rows.some(
    (r) => r.state === "uploading" || r.state === "attaching"
  );

  const onPick = useCallback((files: FileList | null) => {
    if (!files || !files.length) return;
    const arr = Array.from(files).filter(
      (f) =>
        f.type.startsWith("audio/") || f.name.match(/\.(mp3|m4a|wav|ogg)$/i)
    );
    setRows((prev) => [
      ...prev,
      ...arr.map((f) => {
        const base = f.name.replace(/\.[^.]+$/, "");
        const title = base;
        const slug = slugify(base);
        return { file: f, title, slug, progress: 0, state: "idle" } as Row;
      }),
    ]);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onPick(e.dataTransfer.files);
    },
    [onPick]
  );

  const uploadOne = useCallback(
    async (idx: number) => {
      setRows((xs) =>
        xs.map((r, i) =>
          i === idx
            ? { ...r, state: "uploading", progress: 0, error: undefined }
            : r
        )
      );
      const r = rows[idx];
      try {
        const fd = new FormData();
        fd.append("file", r.file);
        fd.append("upload_preset", PRESET);
        // אם ה-preset מאפשר public_id, אפשר:
        // fd.append("public_id", r.slug);

        const xhr = new XMLHttpRequest();
        const p: Promise<any> = new Promise((resolve, reject) => {
          xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
              if (xhr.status >= 200 && xhr.status < 300)
                resolve(JSON.parse(xhr.responseText));
              else
                reject(
                  new Error(xhr.responseText || `upload_failed ${xhr.status}`)
                );
            }
          };
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              const pct = Math.round((ev.loaded / ev.total) * 100);
              setRows((xs) =>
                xs.map((row, i) =>
                  i === idx ? { ...row, progress: pct } : row
                )
              );
            }
          };
        });
        xhr.open("POST", UPLOAD_URL, true);
        xhr.send(fd);

        const up = await p; // התוצאה מקלאודינרי
        const secureUrl: string = up.secure_url;
        const duration =
          typeof up.duration === "number" ? Math.round(up.duration) : undefined;

        // attach למסד
        setRows((xs) =>
          xs.map((row, i) =>
            i === idx
              ? { ...row, state: "attaching", cloudUrl: secureUrl, duration }
              : row
          )
        );

        const attach = await fetch("/api/admin/nigunim/attach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: r.title,
            slug: r.slug,
            audioUrl: secureUrl,
            duration,
          }),
        });
        const aj = await attach.json();
        if (!attach.ok || aj?.ok === false)
          throw new Error(aj?.error || "attach_failed");

        setRows((xs) =>
          xs.map((row, i) =>
            i === idx ? { ...row, state: "done", progress: 100 } : row
          )
        );
      } catch (e: any) {
        setRows((xs) =>
          xs.map((row, i) =>
            i === idx
              ? { ...row, state: "error", error: e?.message || "failed" }
              : row
          )
        );
      }
    },
    [rows]
  );

  const uploadAll = useCallback(async () => {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].state === "done") continue;
      // eslint-disable-next-line no-await-in-loop
      await uploadOne(i);
    }
  }, [rows, uploadOne]);

  const hasRows = rows.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">
        העלאת ניגונים (MP3) → Cloudinary → מסד
      </h1>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="mb-4 rounded-2xl border-2 border-dashed p-8 text-center"
      >
        גררו לכאן קבצי אודיו או{" "}
        <label className="cursor-pointer text-fuchsia-600 underline">
          בחרו קבצים
          <input
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
        </label>
        <div className="text-xs opacity-70 mt-2">
          preset: <code>{PRESET}</code> • ענן: <code>{CLOUD}</code>
        </div>
      </div>

      {hasRows && (
        <>
          <div className="mb-3 flex gap-2">
            <button
              onClick={uploadAll}
              disabled={busy}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
            >
              העלה הכל
            </button>
            <button
              onClick={() => setRows([])}
              disabled={busy}
              className="rounded-xl border px-4 py-2"
            >
              נקה רשימה
            </button>
          </div>

          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{r.title}</div>
                    <div className="text-xs opacity-70 truncate">
                      {r.file.name}
                    </div>
                  </div>
                  <button
                    onClick={() => uploadOne(i)}
                    disabled={
                      r.state === "uploading" || r.state === "attaching"
                    }
                    className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                  >
                    העלה
                  </button>
                </div>

                <div className="mt-2 h-2 w-full rounded bg-zinc-200 overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-fuchsia-500 to-purple-500"
                    style={{ width: `${r.progress}%` }}
                  />
                </div>

                <div className="mt-2 text-xs">
                  מצב: <b>{r.state}</b>{" "}
                  {r.duration ? (
                    <span className="opacity-70">(≈ {r.duration}s)</span>
                  ) : null}
                  {r.error ? (
                    <span className="text-red-600"> • {r.error}</span>
                  ) : null}
                </div>
                {r.cloudUrl && (
                  <div className="mt-1 text-xs truncate">
                    URL:{" "}
                    <a
                      className="text-blue-600 underline"
                      href={r.cloudUrl}
                      target="_blank"
                    >
                      פתח
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
