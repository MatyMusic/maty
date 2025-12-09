import clientPromise from "@/lib/mongodb";
import type { Db } from "mongodb";

function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}
async function getDb(): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(dbName());
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export type AdminMetrics = {
  totals: {
    profiles: number;
    new7d: number;
    updated24h: number;
    online10m: number; // הערכה לפי updatedAt
    avgAge: number | null;
  };
  byGender: Array<{ key: string; count: number }>;
  byDirection: Array<{ key: string; count: number }>;
  byGoal: Array<{ key: string; count: number }>;
  topCities: Array<{ key: string; count: number }>;
  recent: Array<{
    userId: string;
    displayName: string | null;
    city: string | null;
    country: string | null;
    birthDate: string | null;
    judaism_direction: string | null;
    goals: string | null;
    updatedAt: string | null;
  }>;
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const db = await getDb();
  const C = db.collection("date_profiles");

  const [profiles, new7d, updated24h] = await Promise.all([
    C.countDocuments({}),
    C.countDocuments({ createdAt: { $gte: daysAgoISO(7) } }),
    C.countDocuments({ updatedAt: { $gte: daysAgoISO(1) } }),
  ]);

  // "מחוברים" — לפי updatedAt 10 דקות אחרונות (אם אין עדכון חי זה מדד מקורב)
  const online10m = await C.countDocuments({
    updatedAt: { $gte: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  });

  // פילוחים פשוטים
  async function groupCount(field: string) {
    const rows = await C.aggregate([
      {
        $group: { _id: { $ifNull: [`$${field}`, "unknown"] }, c: { $sum: 1 } },
      },
      { $sort: { c: -1 } },
    ]).toArray();
    return rows.map((r: any) => ({ key: r._id, count: r.c }));
  }

  const [byGender, byDirection, byGoal, topCitiesRaw] = await Promise.all([
    groupCount("gender"),
    groupCount("judaism_direction"),
    groupCount("goals"),
    groupCount("city"),
  ]);
  const topCities = topCitiesRaw.slice(0, 10);

  // גיל ממוצע (על בסיס birthDate "YYYY-MM-DD")
  const birthOnly = await C.find(
    { birthDate: { $exists: true, $ne: null } },
    { projection: { birthDate: 1 } }
  )
    .limit(5000)
    .toArray();
  const toAge = (dob?: string | null) => {
    if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
    const now = new Date();
    const y = parseInt(dob.slice(0, 4), 10);
    let age = now.getFullYear() - y;
    const mmddNow = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    if (dob.slice(5) > mmddNow) age -= 1;
    return age;
  };
  const ages = birthOnly
    .map((d: any) => toAge(d.birthDate))
    .filter((n) => typeof n === "number") as number[];
  const avgAge = ages.length
    ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
    : null;

  // אחרונים
  const recent = await C.find(
    {},
    {
      projection: {
        userId: 1,
        displayName: 1,
        city: 1,
        country: 1,
        birthDate: 1,
        judaism_direction: 1,
        goals: 1,
        updatedAt: 1,
      },
    }
  )
    .sort({ updatedAt: -1 })
    .limit(30)
    .toArray();

  return {
    totals: { profiles, new7d, updated24h, online10m, avgAge },
    byGender,
    byDirection,
    byGoal,
    topCities,
    recent: recent.map((d: any) => ({
      userId: d.userId,
      displayName: d.displayName ?? null,
      city: d.city ?? null,
      country: d.country ?? null,
      birthDate: d.birthDate ?? null,
      judaism_direction: d.judaism_direction ?? null,
      goals: d.goals ?? null,
      updatedAt: d.updatedAt ?? null,
    })),
  };
}
