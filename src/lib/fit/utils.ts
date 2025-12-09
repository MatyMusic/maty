// src/lib/fit/utils.ts
export function norm(v?: string | null) {
  return String(v ?? "")
    .normalize("NFKC")
    .trim();
}

export function includesAny(haystack: string, needles: string[]) {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(String(n || "").toLowerCase()));
}

export function toInt(v: any, fallback = 0) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function paginate<T>(arr: T[], page: number, perPage: number) {
  const start = (page - 1) * perPage;
  return arr.slice(start, start + perPage);
}
export * from "./util";
