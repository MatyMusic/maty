import type { DateProfile } from "./types";

/** קוסיין-סימילריטי בין וקטורי ז'אנרים */
function cosineSim(a: Record<string, number>, b: Record<string, number>) {
  let dot = 0,
    na = 0,
    nb = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const av = a[k] || 0;
    const bv = b[k] || 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
function toVec(genres?: { key: string; weight: number }[]) {
  const v: Record<string, number> = {};
  (genres || []).forEach((g) => (v[g.key] = g.weight));
  return v;
}
function scale01(x: number, max: number) {
  if (max <= 0) return 0;
  const v = Math.max(0, Math.min(1, 1 - x / max));
  return v;
}

export function computeScore(a: DateProfile, b: DateProfile) {
  const genreSim = cosineSim(toVec(a.genres), toVec(b.genres)); // 0..1
  const langFit =
    a.languages && b.languages
      ? a.languages.some((x) => b.languages!.includes(x))
        ? 1
        : 0
      : 0;
  const dirFit =
    a.judaism_direction && b.judaism_direction
      ? a.judaism_direction === b.judaism_direction
        ? 1
        : 0.5
      : 0.5;
  const locFit =
    a.country && b.country ? (a.country === b.country ? 1 : 0.3) : 0.3;

  function ageFromDob(dob?: string | null) {
    if (!dob) return null;
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  }
  const ageA = ageFromDob(a.dob);
  const ageB = ageFromDob(b.dob);
  const ageProx =
    ageA != null && ageB != null ? scale01(Math.abs(ageA - ageB), 12) : 0.5;

  const observanceFit =
    a.observance && b.observance
      ? 1 -
        (Math.abs(a.observance.shabbat - b.observance.shabbat) +
          Math.abs(a.observance.kashrut - b.observance.kashrut)) /
          6
      : 0.5;

  const activityBoost = 0.5; // placeholder

  const score =
    100 *
    (0.42 * genreSim +
      0.12 * 0 + // MoodOverlap עתידי
      0.1 * langFit +
      0.16 * observanceFit +
      0.1 * locFit +
      0.06 * ageProx +
      0.04 * activityBoost);

  return Math.round(score);
}
