// // src/app/api/date/matches/route.ts
// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";
// export const revalidate = 0;

// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import authConfig from "@/auth-config";
// import {
//   searchMatches,
//   getProfile,
//   type MatchFilters,
//   type JudaismDirection,
//   type DateProfile,
//   type Level,
// } from "@/lib/db/date-repo";
// import { getVector, type MusicVectorDoc } from "@/lib/db/music-repo";
// import { totalAffinity, haversineKm } from "@/lib/date/affinity";

// // ------------- utils -------------
// function j(data: unknown, init?: ResponseInit) {
//   return NextResponse.json(data, {
//     ...init,
//     headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
//   });
// }
// function parseNum(v: string | null, def?: number): number | undefined {
//   if (v == null) return def;
//   const n = Number(v);
//   return Number.isFinite(n) ? n : def;
// }
// function normDirection(v?: string | null): JudaismDirection | undefined {
//   if (!v) return undefined;
//   const s = String(v).toLowerCase().trim();
//   if (s === "modern_orthodox" || s === "modern-orthodox") return "modern";
//   if (s === "chassidic" || s === "chasidut") return "chasidic";
//   const allowed = new Set<JudaismDirection>([
//     "orthodox",
//     "haredi",
//     "chasidic",
//     "modern",
//     "conservative",
//     "reform",
//     "reconstructionist",
//     "secular",
//   ]);
//   return (allowed.has(s as JudaismDirection) ? s : undefined) as any;
// }
// function asGender(v?: string | null): "male" | "female" | "other" | undefined {
//   if (!v) return undefined;
//   return v === "male" || v === "female" || v === "other" ? v : undefined;
// }
// function asGoal(
//   v?: string | null
// ): "serious" | "marriage" | "friendship" | undefined {
//   if (!v) return undefined;
//   return v === "serious" || v === "marriage" || v === "friendship"
//     ? v
//     : undefined;
// }
// function getAge(birthDate?: string | null): number | undefined {
//   if (!birthDate) return;
//   const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
//   if (!m) return;
//   const [, y, mo, d] = m;
//   const dob = new Date(Number(y), Number(mo) - 1, Number(d));
//   if (isNaN(dob.getTime())) return;
//   const now = new Date();
//   let age = now.getFullYear() - dob.getFullYear();
//   const beforeBirthday =
//     now.getMonth() < dob.getMonth() ||
//     (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
//   if (beforeBirthday) age -= 1;
//   return age;
// }

// // בסיס ניקוד שהיה לך (ללא מוזיקה/מרחק)
// function baseMatchScore(me: DateProfile | null, other: DateProfile): number {
//   if (!other) return 0;
//   let score = 0;
//   const close: Record<JudaismDirection, JudaismDirection[]> = {
//     orthodox: ["modern", "haredi", "chasidic"],
//     haredi: ["orthodox", "chasidic"],
//     chasidic: ["haredi", "orthodox"],
//     modern: ["orthodox"],
//     conservative: ["reform", "reconstructionist"],
//     reform: ["conservative", "reconstructionist"],
//     reconstructionist: ["reform", "conservative"],
//     secular: [],
//   };
//   const meDir = (me?.judaism_direction || undefined) as
//     | JudaismDirection
//     | undefined;
//   const oDir = (other.judaism_direction || undefined) as
//     | JudaismDirection
//     | undefined;
//   if (meDir && oDir) {
//     if (meDir === oDir) score += 30;
//     else if (close[meDir]?.includes(oDir)) score += 15;
//   }
//   const lvl = (a?: Level | null, b?: Level | null) =>
//     a && b ? (a === b ? 10 : a !== "none" && b !== "none" ? 6 : 0) : 0;
//   score += lvl(me?.shabbat_level ?? null, other.shabbat_level ?? null);
//   score += lvl(me?.kashrut_level ?? null, other.kashrut_level ?? null);
//   if (me?.city && other.city && me.city === other.city) score += 15;
//   else if (me?.country && other.country && me.country === other.country)
//     score += 8;
//   if (me?.goals && other.goals && me.goals === other.goals) score += 5;
//   const myAge = getAge(me?.birthDate);
//   const oAge = getAge(other.birthDate);
//   if (myAge && oAge) {
//     const diff = Math.abs(myAge - oAge);
//     if (diff <= 2) score += 12;
//     else if (diff <= 5) score += 9;
//     else if (diff <= 8) score += 6;
//     else if (diff <= 12) score += 3;
//   }
//   const upd = (other as any).updatedAt as string | undefined;
//   if (upd) {
//     const days = (Date.now() - new Date(upd).getTime()) / 86_400_000;
//     if (days <= 7) score += 6;
//     else if (days <= 30) score += 3;
//   }
//   return score;
// }

// // ------------- GET -------------
// export async function GET(req: NextRequest) {
//   try {
//     const session = await getServerSession(authConfig);
//     if (!session?.user)
//       return j({ ok: false, error: "unauthorized" }, { status: 401 });

//     const userId = (session.user as any).id || session.user.email!;
//     const { searchParams } = new URL(req.url);

//     // בסיס
//     const limit = Math.min(
//       Math.max(parseNum(searchParams.get("limit"), 18)!, 1),
//       50
//     );
//     const cursor = searchParams.get("cursor") || undefined;
//     const city = searchParams.get("city") || undefined;
//     const country = searchParams.get("country") || undefined;
//     const direction = normDirection(searchParams.get("direction"));
//     const gender = asGender(searchParams.get("gender"));
//     const looking_for = asGoal(searchParams.get("looking_for"));
//     const minAge = parseNum(searchParams.get("minAge"));
//     const maxAge = parseNum(searchParams.get("maxAge"));

//     // מתקדמים
//     const subParam = searchParams.get("sub_status");
//     const activeOnly =
//       subParam === "active"
//         ? true
//         : subParam === "inactive"
//         ? false
//         : undefined;
//     const onlineOnly = searchParams.get("online") === "1";
//     const tier = searchParams.get("tier") || undefined;
//     const hasPhoto = searchParams.get("hasPhoto") === "1";

//     // גיאו
//     const centerLat = parseNum(searchParams.get("lat"));
//     const centerLng = parseNum(searchParams.get("lng"));
//     const withinKm = parseNum(searchParams.get("withinKm")); // אם תשלח — נסנן קרבה
//     const wantDistance =
//       Number.isFinite(centerLat) && Number.isFinite(centerLng);

//     // מיון
//     const sort = (searchParams.get("sort") || "").toLowerCase(); // "", "score" (בשרת), או נשתמש מקומית על updatedAt

//     // פרופיל עצמי + מוזיקה לעצמי
//     const me = await getProfile(userId);
//     const meVec = await getVector(userId).catch(() => null);

//     // פילטר לריפו
//     const filters: MatchFilters & {
//       center?: { lat: number; lng: number };
//       withinKm?: number;
//     } = {
//       limit,
//       cursor,
//       city,
//       country,
//       direction,
//       gender,
//       looking_for,
//       minAge,
//       maxAge,
//       excludeUserId: userId,

//       activeOnly,
//       onlineOnly,
//       tierIn: tier ? [tier as any] : undefined,
//       hasPhoto: hasPhoto || undefined,

//       // הרחבה אופציונלית — רק אם תממש ב־date-repo:
//       // center: wantDistance ? { lat: centerLat!, lng: centerLng! } : undefined,
//       // withinKm: wantDistance ? withinKm : undefined,
//     };

//     // שליפת התאמות גולמיות
//     const { items, nextCursor } = await searchMatches(filters);

//     // העשרת מוזיקה + מרחק
//     // שלוף וקטורים למועמדים (batch)
//     const uniqueUserIds = Array.from(new Set(items.map((x) => x.userId)));
//     const vectorsMap = new Map<string, MusicVectorDoc | null>();
//     await Promise.all(
//       uniqueUserIds.map(async (uid) => {
//         const v = await getVector(uid).catch(() => null);
//         vectorsMap.set(uid, v);
//       })
//     );

//     const enriched = items.map((it) => {
//       // בסיס “other” לפרופיל
//       const other: DateProfile = {
//         userId: it.userId,
//         displayName: it.displayName || null,
//         birthDate: (it as any).birthDate || null,
//         judaism_direction: it.judaism_direction || null,
//         kashrut_level: it.kashrut_level || null,
//         shabbat_level: it.shabbat_level || null,
//         city: it.city || null,
//         country: it.country || null,
//         goals: it.goals || null,
//         updatedAt: (it as any).updatedAt || undefined,
//       };
//       const base = baseMatchScore(me, other);

//       // מרחק אם יש center ולפרופיל יש loc
//       let distKm: number | undefined = undefined;
//       const loc = (it as any).loc as
//         | { type: "Point"; coordinates: [number, number] }
//         | undefined;
//       if (wantDistance && loc?.coordinates?.length === 2) {
//         const lng = loc.coordinates[0];
//         const lat = loc.coordinates[1];
//         distKm = haversineKm(
//           { lat: centerLat!, lng: centerLng! },
//           { lat, lng }
//         );
//       }

//       // מוזיקה
//       const otherVec = vectorsMap.get(it.userId) || null;
//       const affinity = totalAffinity({
//         baseScore: base,
//         distanceKm: distKm,
//         meMusic: meVec || undefined,
//         otherMusic: otherVec || undefined,
//       });

//       return {
//         ...it,
//         score: affinity.total,
//         distanceKm: distKm,
//         sharedGenres: affinity.shared.genres,
//         sharedArtists: affinity.shared.artists,
//         scoreBreakdown: affinity.breakdown,
//       };
//     });

//     // סינון מרחק אם ביקשו withinKm (אופציונלי)
//     const filtered = Number.isFinite(withinKm)
//       ? enriched.filter(
//           (x) => (x.distanceKm ?? Infinity) <= (withinKm as number)
//         )
//       : enriched;

//     // מיון לפי ציון כולל — אם ביקשו ?sort=score
//     const resultItems =
//       sort === "score"
//         ? [...filtered].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
//         : filtered;

//     return j({ ok: true, items: resultItems, nextCursor });
//   } catch (err) {
//     console.error("[GET /api/date/matches] error:", err);
//     return j({ ok: false, error: "internal_error" }, { status: 500 });
//   }
// }

//=================================================================================================================

// // src/app/api/date/matches/route.ts
// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";
// export const revalidate = 0;

// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
// import { dateCollections } from "@/lib/date/db";
// import { totalAffinity, type AffinityInput } from "@/lib/date/affinity";
// import { getVector as getMusicVector } from "@/lib/db/music-repo";

// type Direction =
//   | "orthodox"
//   | "haredi"
//   | "chasidic"
//   | "modern"
//   | "conservative"
//   | "reform"
//   | "reconstructionist"
//   | "secular";

// function json(data: unknown, init?: ResponseInit) {
//   return NextResponse.json(data, {
//     ...init,
//     headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
//   });
// }

// function parseNum(v: string | null, def?: number): number | undefined {
//   if (v == null) return def;
//   const n = Number(v);
//   return Number.isFinite(n) ? n : def;
// }

// function toAge(dob?: string | null) {
//   if (!dob) return null;
//   const d = new Date(dob);
//   if (isNaN(d.getTime())) return null;
//   const now = new Date();
//   let age = now.getFullYear() - d.getFullYear();
//   const m = now.getMonth() - d.getMonth();
//   if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
//   return age;
// }

// export async function GET(req: NextRequest) {
//   const s = await getServerSession(authOptions);
//   if (!s?.user) return json({ error: "unauthorized" }, { status: 401 });

//   const meId = (s.user as any).id || s.user.email!;
//   const url = new URL(req.url);
//   const limit = Math.min(
//     Math.max(parseNum(url.searchParams.get("limit"), 20)!, 1),
//     50
//   );
//   const cursor = url.searchParams.get("cursor");
//   const gender = (url.searchParams.get("gender") || "") as
//     | "male"
//     | "female"
//     | "other"
//     | "";
//   const country = url.searchParams.get("country") || "";
//   const city = url.searchParams.get("city") || "";
//   const direction = (url.searchParams.get("direction") || "") as Direction | "";
//   const lookingFor = url.searchParams.get("looking_for") || "";
//   const minAge = parseNum(url.searchParams.get("minAge"), 18) ?? 18;
//   const maxAge = parseNum(url.searchParams.get("maxAge"), 120) ?? 120;

//   const { profiles } = await dateCollections();

//   const me = await profiles.findOne({ userId: meId }).catch(() => null);

//   const q: any = { userId: { $ne: meId } };
//   if (gender) q.gender = gender;
//   if (country) q.country = country;
//   if (city) q.city = city;
//   if (direction) q.judaism_direction = direction;
//   if (lookingFor) q.goals = lookingFor;

//   // גיל מתוך birthDate (YYYY-MM-DD)
//   const now = new Date();
//   const minDob = new Date(
//     now.getFullYear() - maxAge,
//     now.getMonth(),
//     now.getDate()
//   );
//   const maxDob = new Date(
//     now.getFullYear() - minAge,
//     now.getMonth(),
//     now.getDate()
//   );
//   q.birthDate = {
//     $gte: minDob.toISOString().slice(0, 10),
//     $lte: maxDob.toISOString().slice(0, 10),
//   };

//   if (cursor) q._id = { $lt: new (require("mongodb").ObjectId)(cursor) };

//   const rows = await profiles
//     .find(q)
//     .project({
//       userId: 1,
//       displayName: 1,
//       gender: 1,
//       birthDate: 1,
//       country: 1,
//       city: 1,
//       judaism_direction: 1,
//       kashrut_level: 1,
//       shabbat_level: 1,
//       avatarUrl: 1,
//       photos: 1,
//       updatedAt: 1,
//       loc: 1, // אופציונלי: אם תוסיפו GeoJSON
//     })
//     .sort({ updatedAt: -1, _id: -1 })
//     .limit(limit)
//     .toArray();

//   const meVec = await getMusicVector(meId).catch(() => null);

//   const items = await Promise.all(
//     rows.map(async (r: any) => {
//       const otherVec = await getMusicVector(r.userId).catch(() => null);

//       // מרחק אם קיים loc אצל שני הצדדים
//       let distanceKm: number | null = null;
//       if (me?.loc?.coordinates && r?.loc?.coordinates) {
//         const [lngA, latA] = me.loc.coordinates;
//         const [lngB, latB] = r.loc.coordinates;
//         const toRad = (x: number) => (x * Math.PI) / 180;
//         const R = 6371;
//         const dLat = toRad(latB - latA);
//         const dLng = toRad(lngB - lngA);
//         const s =
//           Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//           Math.cos(toRad(latA)) *
//             Math.cos(toRad(latB)) *
//             Math.sin(dLng / 2) *
//             Math.sin(dLng / 2);
//         distanceKm = 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
//       }

//       // ניקוד בסיסי (אותו זרם/אותה מדינה/עיר)
//       let base = 0;
//       if (
//         me?.judaism_direction &&
//         r.judaism_direction &&
//         me.judaism_direction === r.judaism_direction
//       )
//         base += 10;
//       if (me?.country && r.country && me.country === r.country) base += 6;
//       if (me?.city && r.city && me.city === r.city) base += 8;

//       const affinity = totalAffinity({
//         meMusic: meVec
//           ? {
//               userId: meId,
//               genres: meVec.genres || {},
//               topArtists: meVec.topArtists || [],
//               lastPlaysAt: meVec.lastPlaysAt || [],
//             }
//           : { userId: meId, genres: {}, topArtists: [] },
//         otherMusic: otherVec
//           ? {
//               userId: r.userId,
//               genres: otherVec.genres || {},
//               topArtists: otherVec.topArtists || [],
//               lastPlaysAt: otherVec.lastPlaysAt || [],
//             }
//           : { userId: r.userId, genres: {}, topArtists: [] },
//         distanceKm: distanceKm ?? null,
//         baseScore: base,
//       } as AffinityInput);

//       return {
//         _id: String(r._id),
//         userId: r.userId,
//         displayName: r.displayName ?? null,
//         city: r.city ?? null,
//         country: r.country ?? null,
//         age: toAge(r.birthDate),
//         judaism_direction: r.judaism_direction ?? null,
//         avatarUrl: r.avatarUrl ?? null,
//         photos: Array.isArray(r.photos) ? r.photos : [],
//         updatedAt: r.updatedAt || null,
//         score: affinity.total,
//         distanceKm,
//         sharedGenres: affinity.sharedGenres,
//         sharedArtists: affinity.sharedArtists,
//       };
//     })
//   );

//   items.sort(
//     (a, b) =>
//       (b.score || 0) - (a.score || 0) ||
//       new Date(b.updatedAt || 0).getTime() -
//         new Date(a.updatedAt || 0).getTime()
//   );

//   const nextCursor =
//     rows.length === limit ? String(rows[rows.length - 1]._id) : null;
//   return json({ ok: true, items, nextCursor });
// }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

function parseNum(v: string | null, def?: number): number | undefined {
  if (v == null) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function toAge(dob?: string | null) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export async function GET(req: NextRequest) {
  const s = await getServerSession(authConfig);
  if (!s?.user) return json({ error: "unauthorized" }, { status: 401 });

  const meId = (s.user as any).id || s.user.email!;
  const url = new URL(req.url);
  const limit = Math.min(
    Math.max(parseNum(url.searchParams.get("limit"), 20)!, 1),
    50
  );
  const cursor = url.searchParams.get("cursor");
  const gender = (url.searchParams.get("gender") || "") as
    | "male"
    | "female"
    | "other"
    | "";
  const country = url.searchParams.get("country") || "";
  const city = url.searchParams.get("city") || "";
  const direction = (url.searchParams.get("direction") || "") as
    | "orthodox"
    | "haredi"
    | "chassidic"
    | "modern"
    | "conservative"
    | "reform"
    | "reconstructionist"
    | "secular"
    | "";
  const lookingFor = url.searchParams.get("looking_for") || "";
  const minAge = parseNum(url.searchParams.get("minAge"), 18) ?? 18;
  const maxAge = parseNum(url.searchParams.get("maxAge"), 120) ?? 120;

  const cli = await clientPromise;
  const db = cli.db(process.env.MONGODB_DB || "maty-music");
  const profiles = db.collection("date_profiles");
  const music = db.collection("music_vectors");

  const me = await profiles.findOne({ userId: meId }).catch(() => null);
  const meVec = await music.findOne({ userId: meId }).catch(() => null);

  const q: any = { userId: { $ne: meId } };
  if (gender) q.gender = gender;
  if (country) q.country = country;
  if (city) q.city = city;
  if (direction) q.judaism_direction = direction;
  if (lookingFor) q.goals = lookingFor;

  const now = new Date();
  const minDob = new Date(
    now.getFullYear() - (maxAge ?? 120),
    now.getMonth(),
    now.getDate()
  )
    .toISOString()
    .slice(0, 10);
  const maxDob = new Date(
    now.getFullYear() - (minAge ?? 18),
    now.getMonth(),
    now.getDate()
  )
    .toISOString()
    .slice(0, 10);
  q.birthDate = { $gte: minDob, $lte: maxDob };

  if (cursor) q._id = { $lt: new ObjectId(cursor) };

  const rows = await profiles
    .find(q)
    .project({
      userId: 1,
      displayName: 1,
      gender: 1,
      birthDate: 1,
      country: 1,
      city: 1,
      judaism_direction: 1,
      avatarUrl: 1,
      photos: 1,
      updatedAt: 1,
      loc: 1,
    })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit)
    .toArray();

  const toRad = (x: number) => (x * Math.PI) / 180;
  const hav = (A: any, B: any) => {
    if (!A?.coordinates || !B?.coordinates) return null;
    const [lngA, latA] = A.coordinates;
    const [lngB, latB] = B.coordinates;
    const R = 6371;
    const dLat = toRad(latB - latA);
    const dLng = toRad(lngB - lngA);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  };

  const items = await Promise.all(
    rows.map(async (r: any) => {
      const otherVec = await music
        .findOne({ userId: r.userId })
        .catch(() => null);

      // ציון מוזיקה בסיסי: ג'קארד על אמנים + קוסיין על מפה קטגוריאלית
      const setA = new Set<string>((meVec?.topArtists || []).slice(0, 30));
      const setB = new Set<string>((otherVec?.topArtists || []).slice(0, 30));
      const inter = [...setA].filter((x) => setB.has(x)).length;
      const union = new Set<string>([...setA, ...setB]).size || 1;
      const jaccard = inter / union; // 0..1

      const genresA = meVec?.genres || {};
      const genresB = otherVec?.genres || {};
      const allG = new Set<string>([
        ...Object.keys(genresA),
        ...Object.keys(genresB),
      ]);
      let dot = 0,
        a2 = 0,
        b2 = 0;
      allG.forEach((g) => {
        const a = Number(genresA[g] || 0);
        const b = Number(genresB[g] || 0);
        dot += a * b;
        a2 += a * a;
        b2 += b * b;
      });
      const cosine = dot / (Math.sqrt(a2 || 1) * Math.sqrt(b2 || 1)); // 0..1+

      let base = 0;
      if (
        me?.judaism_direction &&
        r.judaism_direction &&
        me.judaism_direction === r.judaism_direction
      )
        base += 10;
      if (me?.country && r.country && me.country === r.country) base += 6;
      if (me?.city && r.city && me.city === r.city) base += 8;

      const distKm = hav(me?.loc, r?.loc);
      const distPenalty = distKm == null ? 0 : Math.min(15, distKm / 5); // כל ~5ק"מ מוריד נקודה, עד 15

      const total = Math.max(
        0,
        base + 60 * (0.7 * (jaccard || 0) + 0.3 * (cosine || 0)) - distPenalty
      );

      return {
        _id: String(r._id),
        userId: r.userId,
        displayName: r.displayName ?? null,
        city: r.city ?? null,
        country: r.country ?? null,
        age: toAge(r.birthDate),
        judaism_direction: r.judaism_direction ?? null,
        avatarUrl: r.avatarUrl ?? null,
        photos: Array.isArray(r.photos) ? r.photos : [],
        updatedAt: r.updatedAt || null,
        score: Math.round(total * 10) / 10,
        distanceKm: distKm == null ? null : Math.round(distKm * 10) / 10,
        sharedArtists: inter,
        sharedArtistsUnion: union,
      };
    })
  );

  items.sort(
    (a, b) =>
      (b.score || 0) - (a.score || 0) ||
      new Date(b.updatedAt || 0).getTime() -
        new Date(a.updatedAt || 0).getTime()
  );
  const nextCursor =
    rows.length === limit ? String(rows[rows.length - 1]._id) : null;

  return json({ ok: true, items, nextCursor });
}
