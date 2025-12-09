// src/lib/date/affinity.ts
/* אלגוריתם ניקוד: מוזיקה + מרחק + התאמות יהדות/ערכים
   - מוזיקה: קוסיין על וקטור ז'אנרים + ג'קארד על האמנים, משוקלל עם דעיכת זמן
   - מרחק: הפחתה רציפה (0–12 נק’) לפי ק"מ
   - בסיס: (כבר מחשבים אצלך) זרם/שבת/כשרות/גיל/מטרה/עדכניות
*/

export type MusicVector = {
  userId: string;
  // שכיחות ז'אנרים מנורמלת (0..1), למשל { "chabad": 0.8, "mizrahi": 0.3 }
  genres: Record<string, number>;
  // סט אמנים מובילים
  topArtists: string[];
  // חותמות זמן (לדעיכת זמן)
  lastPlaysAt?: string[]; // ISO strings (אופציונלי)
};

export type AffinityInput = {
  baseScore: number; // הציון שקיבלתם מהתכונות הדתיות/גיל/וכו'
  distanceKm?: number; // המרחק בין המשתמשים (אם קיים לוקיישן)
  meMusic?: MusicVector; // וקטור מוזיקלי שלי
  otherMusic?: MusicVector; // וקטור מוזיקלי של הצד השני
};

export type AffinityResult = {
  total: number; // סך הכל 0..100 (בקירוב), אבל גמיש. אתה שולט במשקולות.
  breakdown: {
    base: number;
    music: number;
    distance: number;
    musicCosine: number;
    musicJaccard: number;
    timeBoost: number;
  };
  shared: {
    genres: string[];
    artists: string[];
  };
};

/** קוסיין בין שני וקטורים דלילים */
function cosineSim(
  a: Record<string, number>,
  b: Record<string, number>
): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const va = a[k] || 0;
    const vb = b[k] || 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** ג’קארד על רשימות אמנים */
function jaccard<T>(A: T[], B: T[]) {
  if (!A?.length || !B?.length) return 0;
  const sA = new Set(A);
  const sB = new Set(B);
  let inter = 0;
  for (const x of sA) if (sB.has(x)) inter++;
  const union = sA.size + sB.size - inter;
  return union ? inter / union : 0;
}

/** דעיכת זמן: אירועים טריים דוחפים בוסט קטן (0–8 נק’) */
function recencyBoost(isoList?: string[]): number {
  if (!isoList?.length) return 0;
  // קח את 5 האירועים האחרונים, חשב דעיכה אקספוננציאלית (חצי-חיים ~14 ימים)
  const HALF_LIFE_DAYS = 14;
  const LAMBDA = Math.log(2) / HALF_LIFE_DAYS;
  const now = Date.now();
  const latest = isoList
    .slice(-5)
    .map((s) => Math.max(0, (now - new Date(s).getTime()) / 86_400_000));
  const score = latest.reduce((acc, days) => acc + Math.exp(-LAMBDA * days), 0);
  // נרמול גס ל־0..8
  const capped = Math.min(score, 4); // 5 אירועים טריים ~4
  return (capped / 4) * 8;
}

/** הפחתת מרחק: 0 ק"מ → +12, 25 ק"מ → +8, 100 ק"מ → +3, 500+ → 0 */
function distancePoints(km?: number): number {
  if (km == null || !isFinite(km)) return 0;
  if (km <= 2) return 12;
  if (km <= 10) return 10;
  if (km <= 25) return 8;
  if (km <= 50) return 6;
  if (km <= 100) return 3;
  if (km <= 300) return 1;
  return 0;
}

/** ניקוד מוזיקה 0..40 נק' */
export function musicScore(
  me?: MusicVector,
  other?: MusicVector
): {
  points: number;
  cosine: number;
  jacc: number;
  timeBoost: number;
  sharedGenres: string[];
  sharedArtists: string[];
} {
  if (!me || !other) {
    return {
      points: 0,
      cosine: 0,
      jacc: 0,
      timeBoost: 0,
      sharedGenres: [],
      sharedArtists: [],
    };
  }
  // קוסיין על ז'אנרים
  const cosine = cosineSim(me.genres || {}, other.genres || {});
  // ג'קארד על אמנים
  const jacc = jaccard(me.topArtists || [], other.topArtists || []);
  // בוסט טריות לפי של הצד השני (מה שמרמז על תחומי עניין חיים)
  const timeBoost =
    0.5 * (recencyBoost(other.lastPlaysAt) + recencyBoost(me.lastPlaysAt)); // 0..8
  // משקולות
  const COS_W = 24; // קוסיין עד 24 נק'
  const JAC_W = 8; // ג'קארד עד 8 נק'
  const TB_W = 8; // טריות עד 8 נק'
  const points = cosine * COS_W + jacc * JAC_W + Math.min(TB_W, timeBoost);

  // משותפים
  const sharedGenres = Object.keys(me.genres || {})
    .filter((g) => (me.genres?.[g] || 0) > 0 && (other.genres?.[g] || 0) > 0)
    .slice(0, 5);
  const sharedArtists = (me.topArtists || [])
    .filter((a) => (other.topArtists || []).includes(a))
    .slice(0, 8);

  return { points, cosine, jacc, timeBoost, sharedGenres, sharedArtists };
}

/** סיכום כולל */
export function totalAffinity(input: AffinityInput): AffinityResult {
  const music = musicScore(input.meMusic, input.otherMusic);
  const distPts = distancePoints(input.distanceKm);
  const base = Math.max(0, input.baseScore || 0);
  const total = base + music.points + distPts;

  return {
    total,
    breakdown: {
      base,
      music: music.points,
      distance: distPts,
      musicCosine: music.cosine,
      musicJaccard: music.jacc,
      timeBoost: music.timeBoost,
    },
    shared: {
      genres: music.sharedGenres,
      artists: music.sharedArtists,
    },
  };
}

/** המרחק בק"מ (Haversine) */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
