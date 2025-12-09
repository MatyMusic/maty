// src/lib/rate-limit/memory.ts
const hits = new Map<string, { c: number; t: number }>();
export function rateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now - rec.t > windowMs) {
    hits.set(key, { c: 1, t: now });
    return { ok: true, remaining: limit - 1 };
  }
  if (rec.c >= limit) return { ok: false, remaining: 0 };
  rec.c++;
  return { ok: true, remaining: limit - rec.c };
}
