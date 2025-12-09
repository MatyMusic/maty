/**
 * Demo uploader — returns object URL for local preview.
 * Plug your real /api/club/upload if/when needed.
 */
export async function handleFileUpload(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  return url;

  // Example for real upload:
  // const fd = new FormData();
  // fd.append("file", file);
  // const res = await fetch("/api/club/upload", { method: "POST", body: fd });
  // const j = await res.json();
  // if (!res.ok || !j?.ok || !j?.url) throw new Error("upload_failed");
  // return j.url;
}
