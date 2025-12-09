import { type Collection, type IndexDescription, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

/** ===== Types ===== */
export type FitCategory =
  | "abs"
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "full_body"
  | "cardio"
  | "mobility";

export type FitExercise = {
  _id?: ObjectId;
  provider: "seed" | "custom" | "wger";
  providerId: string; // מזהה חיצוני/פנימי
  name: string; // שם תרגיל
  nameHe?: string; // שם בעברית (אם שונה)
  description?: string; // תיאור קצר
  descriptionHe?: string; // תיאור בעברית
  category: FitCategory; // קטגוריה ראשית
  primaryMuscles?: string[]; // שרירים עיקריים (en)
  primaryMusclesHe?: string[]; // שרירים עיקריים (he)
  equipment?: string[]; // ציוד
  images?: string[]; // תמונות/ג׳יפים
  difficulty?: "beginner" | "intermediate" | "advanced";
  language?: string; // "he" | "en"
  createdAt?: string;
  updatedAt?: string;
};

function nowISO() {
  return new Date().toISOString();
}

/** ===== Collection + אינדקסים ===== */
async function colExercises(): Promise<Collection<FitExercise>> {
  const db = await getDb();
  const c = db.collection<FitExercise>("fit_exercises");
  try {
    const wanted: Array<IndexDescription & { name: string; unique?: boolean }> =
      [
        {
          key: { provider: 1, providerId: 1 },
          name: "provider_pid",
          unique: true,
        },
        {
          key: { name: "text", nameHe: "text", descriptionHe: "text" },
          name: "text_he_en",
        },
        {
          key: { category: 1, "primaryMusclesHe.0": 1, difficulty: 1 },
          name: "by_cat_muscle_diff",
        },
        { key: { updatedAt: -1, _id: -1 }, name: "updated_desc" },
      ];
    const have = new Set(
      (
        (await c
          .listIndexes()
          .toArray()
          .catch(() => [])) as any[]
      ).map((i) => i.name),
    );
    for (const idx of wanted) {
      if (!have.has(idx.name))
        await c.createIndex(idx.key as any, {
          name: idx.name,
          unique: idx.unique,
        });
    }
  } catch {}
  return c;
}

/** ===== Upsert/Search ===== */
export async function upsertExercise(
  e: Omit<FitExercise, "_id" | "createdAt" | "updatedAt">,
) {
  const c = await colExercises();
  const now = nowISO();
  const res = await c.findOneAndUpdate(
    { provider: e.provider, providerId: e.providerId },
    { $setOnInsert: { createdAt: now }, $set: { ...e, updatedAt: now } },
    { upsert: true, returnDocument: "after" },
  );
  return res.value!;
}

export async function searchExercises(opts: {
  q?: string;
  category?: FitCategory | "";
  muscleHe?: string; // פילטר שריר בעברית
  equipment?: string;
  difficulty?: "beginner" | "intermediate" | "advanced" | "";
  page?: number;
  limit?: number;
}) {
  const c = await colExercises();
  const limit = Math.min(Math.max(opts.limit ?? 24, 1), 60);
  const page = Math.max(opts.page ?? 1, 1);
  const skip = (page - 1) * limit;

  const q: any = {};
  if (opts.q?.trim()) q.$text = { $search: opts.q.trim() };
  if (opts.category) q.category = opts.category;
  if (opts.muscleHe) q.primaryMusclesHe = opts.muscleHe;
  if (opts.equipment) q.equipment = opts.equipment;
  if (opts.difficulty) q.difficulty = opts.difficulty;

  const cursor = c
    .find(q)
    .sort({ updatedAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit);
  const [items, total] = await Promise.all([
    cursor.toArray(),
    c.countDocuments(q),
  ]);
  return { items, total, page, pages: Math.ceil(total / limit) };
}

export async function getExerciseById(id: string) {
  const c = await colExercises();
  return c.findOne({ _id: new ObjectId(id) });
}
