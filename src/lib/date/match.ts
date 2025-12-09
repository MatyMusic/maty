// src/lib/date/match.ts
import {
  totalAffinity,
  type AffinityResult,
  type MusicVector,
} from "@/lib/date/affinity";
import { computeScore } from "@/lib/date/compat";
import type { DateProfile } from "@/lib/date/types";

export type MatchFactors = {
  baseProfileScore: number; // מה-compat.ts (גיל, דתיות, שפות וכו')
  musicAffinity: number; // מתוך affinity.ts
  distancePenalty: number; // 0–1, כמה להוריד על מרחק
};

export type MatchResultV2 = {
  finalScore: number; // 0–100
  factors: MatchFactors;
  affinity: AffinityResult;
};

const MATCH_WEIGHTS = {
  profile: 0.6, // משקל פרופיל
  music: 0.25, // משקל מוזיקה
  distance: 0.15, // מרחק (ענישה)
};

function normalizeScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  if (score < 0) return 0;
  if (score > 100) return 100;
  return Math.round(score);
}

/**
 * אלגוריתם התאמה חדש (V2) – לא שובר את הקיים, רק גרסה משופרת
 */
export function computeMatchV2(params: {
  me: DateProfile;
  other: DateProfile;
  distanceKm?: number;
  meMusic?: MusicVector;
  otherMusic?: MusicVector;
}): MatchResultV2 {
  const { me, other, distanceKm, meMusic, otherMusic } = params;

  // ציון בסיס קיים מהקוד שלך (compat.ts)
  const baseProfileScore = normalizeScore(computeScore(me, other));

  // affinity קיים – משקלל מוזיקה + מרחק + base
  const affinity = totalAffinity({
    baseScore: baseProfileScore,
    distanceKm,
    meMusic,
    otherMusic,
  });

  // נחלק את המידע מתוך affinity:
  const musicAffinity = affinity.music?.points ?? 0;

  // מרחק: אם לא נשלח, אין ענישה
  let distancePenalty = 0;
  if (typeof distanceKm === "number") {
    // דוגמה: עד 10 ק״מ – אין ענישה. מעל זה – יורד בהדרגה עד -1
    const km = Math.max(distanceKm, 0);
    if (km <= 10) {
      distancePenalty = 0;
    } else if (km >= 2000) {
      distancePenalty = 1;
    } else {
      distancePenalty = (km - 10) / (2000 - 10);
    }
  }

  const baseNorm = baseProfileScore / 100;
  const musicNorm = normalizeScore(musicAffinity) / 100;

  const profilePart = baseNorm * MATCH_WEIGHTS.profile;
  const musicPart = musicNorm * MATCH_WEIGHTS.music;
  const distancePart = (1 - distancePenalty) * MATCH_WEIGHTS.distance;

  const finalNorm = profilePart + musicPart + distancePart;
  const finalScore = normalizeScore(finalNorm * 100);

  return {
    finalScore,
    factors: {
      baseProfileScore,
      musicAffinity: normalizeScore(musicAffinity),
      distancePenalty: Number(distancePenalty.toFixed(2)),
    },
    affinity,
  };
}
