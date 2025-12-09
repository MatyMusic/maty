// small helper: never throws on non-JSON/empty bodies
export async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!text || !ct.includes("application/json")) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
