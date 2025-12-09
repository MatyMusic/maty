// src/lib/safe-json.ts
export async function safeJson(res: Response) {
  const ctype = res.headers.get("content-type") || "";
  if (!ctype.includes("application/json")) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `Expected JSON but got ${res.status} ${res.statusText}; content-type="${ctype}", body="${txt.slice(0,120)}"`
    );
  }
  return res.json();
}
