export function isHttpUrl(u: string) {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
export function safeUniq(arr: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const el of arr) {
    const t = el.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}
export function parseTagsInput(s: string) {
  return safeUniq(
    (s || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  );
}
export async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  const text = await res.text().catch(() => "");
  return { ok: false, error: "non_json_response", text };
}
