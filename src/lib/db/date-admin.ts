// src/lib/db/date-admin.ts (קטע מחליף ל-getDateAdminStats בלבד)
import clientPromise from "@/lib/mongodb";
import type { Db } from "mongodb";

function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}
async function getDb(): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(dbName());
}

/** המרה בטוחה של updatedAt ל-Date (תומך string/Date), אחרת null */
const UPDATED_AT_DATE = {
  $cond: [
    { $eq: [{ $type: "$updatedAt" }, "date"] },
    "$updatedAt",
    {
      $cond: [
        {
          $and: [
            { $eq: [{ $type: "$updatedAt" }, "string"] },
            {
              $regexMatch: {
                input: { $ifNull: ["$updatedAt", ""] },
                regex: /^\d{4}-\d{2}-\d{2}T/,
              },
            },
          ],
        },
        { $toDate: "$updatedAt" },
        null,
      ],
    },
  ],
};

/** שדות למדד השלמת פרופיל */
const COMPLETENESS_FIELDS = [
  "displayName",
  "birthDate",
  "gender",
  "country",
  "city",
  "languages",
  "judaism_direction",
  "kashrut_level",
  "shabbat_level",
  "goals",
  "about_me",
  "avatarUrl",
] as const;

/** 1 אם קיים ערך אמיתי בשדה (array/string/other), אחרת 0 */
function presentExpr(field: string) {
  return {
    $cond: [
      { $eq: [{ $type: `$${field}` }, "array"] },
      {
        $cond: [{ $gt: [{ $size: { $ifNull: [`$${field}`, []] } }, 0] }, 1, 0],
      },
      {
        $cond: [
          { $eq: [{ $type: `$${field}` }, "string"] },
          {
            $cond: [
              { $gt: [{ $strLenCP: { $ifNull: [`$${field}`, ""] } }, 0] },
              1,
              0,
            ],
          },
          { $cond: [{ $ne: [`$${field}`, null] }, 1, 0] },
        ],
      },
    ],
  };
}

/** DOB בטוח:
 * - אם כבר Date → ישירות
 * - אם string תואם YYYY-MM-DD → parse עם onError/null (לא מפיל pipeline)
 * - אחרת null
 */
const DOB_DATE = {
  $let: {
    vars: { t: { $type: "$birthDate" } },
    in: {
      $cond: [
        { $eq: ["$$t", "date"] },
        "$birthDate",
        {
          $cond: [
            {
              $and: [
                { $eq: ["$$t", "string"] },
                {
                  $regexMatch: {
                    input: { $toString: "$birthDate" },
                    regex: /^\d{4}-\d{2}-\d{2}$/,
                  },
                },
              ],
            },
            {
              $dateFromString: {
                dateString: "$birthDate",
                format: "%Y-%m-%d",
                timezone: "UTC",
                onError: null,
                onNull: null,
              },
            },
            null,
          ],
        },
      ],
    },
  },
};

export async function getDateAdminStats() {
  const db = await getDb();
  const C = db.collection("date_profiles");

  const now = new Date();
  const d24h = new Date(now.getTime() - 24 * 3600 * 1000);
  const d7d = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const d30d = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const res = await C.aggregate([
    {
      $addFields: {
        _dob: DOB_DATE,
        _updatedAtDate: UPDATED_AT_DATE,
      },
    },
    {
      $addFields: {
        _age: {
          $cond: [
            { $ne: ["$_dob", null] },
            {
              $dateDiff: {
                startDate: "$_dob",
                endDate: "$$NOW",
                unit: "year",
              },
            },
            null,
          ],
        },
      },
    },
    // שמירה על גיל סביר (לא חובה, רק הגנה סטטיסטית)
    {
      $addFields: {
        _ageValid: {
          $and: [
            { $ne: ["$_age", null] },
            { $gte: ["$_age", 16] },
            { $lte: ["$_age", 100] },
          ],
        },
        _present: { $sum: COMPLETENESS_FIELDS.map((f) => presentExpr(f)) },
      },
    },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              all: { $sum: 1 },
              last24h: {
                $sum: { $cond: [{ $gte: ["$_updatedAtDate", d24h] }, 1, 0] },
              },
              last7d: {
                $sum: { $cond: [{ $gte: ["$_updatedAtDate", d7d] }, 1, 0] },
              },
              last30d: {
                $sum: { $cond: [{ $gte: ["$_updatedAtDate", d30d] }, 1, 0] },
              },
              withAvatar: {
                $sum: {
                  $cond: [
                    {
                      $gt: [{ $strLenCP: { $ifNull: ["$avatarUrl", ""] } }, 0],
                    },
                    1,
                    0,
                  ],
                },
              },
              presentSum: { $sum: "$_present" },
            },
          },
          {
            $project: {
              _id: 0,
              all: 1,
              last24h: 1,
              last7d: 1,
              last30d: 1,
              withAvatar: 1,
              avgCompleteness: {
                $cond: [
                  { $gt: ["$all", 0] },
                  {
                    $multiply: [
                      {
                        $divide: [
                          "$presentSum",
                          { $multiply: ["$all", COMPLETENESS_FIELDS.length] },
                        ],
                      },
                      100,
                    ],
                  },
                  0,
                ],
              },
            },
          },
        ],
        byGender: [
          { $group: { _id: "$gender", count: { $sum: 1 } } },
          { $project: { _id: 0, key: "$_id", count: 1 } },
          { $sort: { count: -1 } },
        ],
        byDirection: [
          { $group: { _id: "$judaism_direction", count: { $sum: 1 } } },
          { $project: { _id: 0, key: "$_id", count: 1 } },
          { $sort: { count: -1 } },
        ],
        ageBuckets: [
          { $match: { _ageValid: true } },
          {
            $bucket: {
              groupBy: "$_age",
              boundaries: [18, 23, 28, 33, 38, 46, 200],
              default: "לא ידוע",
              output: { count: { $sum: 1 } },
            },
          },
          {
            $project: {
              _id: 0,
              key: {
                $switch: {
                  branches: [
                    { case: { $eq: ["$_id", 18] }, then: "18–22" },
                    { case: { $eq: ["$_id", 23] }, then: "23–27" },
                    { case: { $eq: ["$_id", 28] }, then: "28–32" },
                    { case: { $eq: ["$_id", 33] }, then: "33–37" },
                    { case: { $eq: ["$_id", 38] }, then: "38–45" },
                    { case: { $eq: ["$_id", 46] }, then: "46+" },
                  ],
                  default: "לא ידוע",
                },
              },
              count: 1,
            },
          },
        ],
        topCountries: [
          { $match: { country: { $nin: [null, ""] } } },
          { $group: { _id: "$country", count: { $sum: 1 } } },
          { $project: { _id: 0, key: "$_id", count: 1 } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        topLanguages: [
          {
            $unwind: { path: "$languages", preserveNullAndEmptyArrays: false },
          },
          { $group: { _id: "$languages", count: { $sum: 1 } } },
          { $project: { _id: 0, key: "$_id", count: 1 } },
          { $sort: { count: -1 } },
          { $limit: 12 },
        ],
        recent: [
          { $sort: { _updatedAtDate: -1, _id: -1 } },
          { $limit: 12 },
          {
            $project: {
              _id: { $toString: "$_id" },
              userId: 1,
              displayName: 1,
              gender: 1,
              judaism_direction: 1,
              country: 1,
              city: 1,
              updatedAt: 1,
              avatarUrl: 1,
              email: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        totals: { $arrayElemAt: ["$totals", 0] },
        byGender: 1,
        byDirection: 1,
        ageBuckets: 1,
        topCountries: 1,
        topLanguages: 1,
        recent: 1,
      },
    },
  ]).toArray();

  const out = (res[0] || {}) as any;
  return {
    totals: out.totals || {
      all: 0,
      last24h: 0,
      last7d: 0,
      last30d: 0,
      withAvatar: 0,
      avgCompleteness: 0,
    },
    byGender: out.byGender || [],
    byDirection: out.byDirection || [],
    ageBuckets: out.ageBuckets || [],
    topCountries: out.topCountries || [],
    topLanguages: out.topLanguages || [],
    recent: out.recent || [],
  };
}
