import { NextResponse } from "next/server";
import {
  upsertExercise,
  type FitExercise,
  type FitCategory,
} from "@/lib/db/fit-repo.exercises";
import { requireAdminAPI } from "@/lib/auth/requireAdmin";

// ===== seed data (עשרות תרגילים בעברית) =====
const SEED: Array<Omit<FitExercise, "_id" | "createdAt" | "updatedAt">> = [
  // --- חזה ---
  {
    provider: "seed",
    providerId: "chest_pushup",
    category: "chest",
    name: "Push Up",
    nameHe: "שכיבות סמיכה",
    descriptionHe:
      "תרגיל קלאסי לחזה, כתפיים וטרייספס. שמירה על גוף ישר, בית חזה לכיוון הרצפה והדיפה חזרה.",
    primaryMusclesHe: ["חזה", "כתפיים קדמיות", "טרייספס"],
    equipment: [],
    difficulty: "beginner",
    images: ["/fit/exercises/pushup_1.gif"],
    language: "he",
  },
  {
    provider: "seed",
    providerId: "chest_bench_dumbbell",
    category: "chest",
    name: "Dumbbell Bench Press",
    nameHe: "לחיצת חזה בדאמבלים",
    descriptionHe:
      "על ספסל, דאמבלים ליד בית החזה והדיפה למעלה. שליטה בירידה, ללא נעילה אגרסיבית.",
    primaryMusclesHe: ["חזה"],
    equipment: ["דאמבלים", "ספסל"],
    difficulty: "intermediate",
    images: ["/fit/exercises/db_bench.gif"],
    language: "he",
  },
  {
    provider: "seed",
    providerId: "chest_cable_fly",
    category: "chest",
    name: "Cable Fly",
    nameHe: "פליי בכבלים",
    descriptionHe:
      "כבלים בצדדים, ידיים חצי כפופות, סגירה קדימה ומנוחה בפתיחה מבוקרת.",
    primaryMusclesHe: ["חזה פנימי"],
    equipment: ["כבלים"],
    difficulty: "intermediate",
    images: ["/fit/exercises/cable_fly.gif"],
    language: "he",
  },

  // --- גב ---
  {
    provider: "seed",
    providerId: "back_lat_pulldown",
    category: "back",
    name: "Lat Pulldown",
    nameHe: "פולי עליון",
    descriptionHe:
      "משיכה מטה אל בית החזה, שמירה על כתפיים דחוסות מטה ומרכז גוף יציב.",
    primaryMusclesHe: ["רחב גבי", "בייספס"],
    equipment: ["מכונה"],
    difficulty: "beginner",
    images: ["/fit/exercises/lat_pulldown.gif"],
    language: "he",
  },
  {
    provider: "seed",
    providerId: "back_barbell_row",
    category: "back",
    name: "Barbell Row",
    nameHe: "חתירה במוט",
    descriptionHe: "גב ישר, הטיית גוף קדימה, משיכת המוט אל הבטן ושחרור מבוקר.",
    primaryMusclesHe: ["אמצע גב", "בייספס"],
    equipment: ["מוט"],
    difficulty: "intermediate",
    images: ["/fit/exercises/bb_row.gif"],
    language: "he",
  },

  // --- רגליים ---
  {
    provider: "seed",
    providerId: "legs_squat",
    category: "legs",
    name: "Bodyweight Squat",
    nameHe: "סקוואט משקל גוף",
    descriptionHe:
      "בעמידה, ירידה לאחור/מטה ושמירה על עקבים בקרקע, עלייה עם בטן אסופה.",
    primaryMusclesHe: ["ארבע ראשי", "ישבן"],
    equipment: [],
    difficulty: "beginner",
    images: ["/fit/exercises/squat_bw.gif"],
    language: "he",
  },
  {
    provider: "seed",
    providerId: "legs_bulgarian_split",
    category: "legs",
    name: "Bulgarian Split Squat",
    nameHe: "סקוואט בולגרי",
    descriptionHe:
      "רגל אחורית על ספסל, ירידה על רגל קדמית והדיפה מעלה. קור ומאזן.",
    primaryMusclesHe: ["ישבן", "ארבע ראשי"],
    equipment: ["ספסל", "דאמבלים(אופ)"],
    difficulty: "intermediate",
    images: ["/fit/exercises/bulgarian.gif"],
    language: "he",
  },

  // --- כתפיים ---
  {
    provider: "seed",
    providerId: "shoulders_overhead_press",
    category: "shoulders",
    name: "Overhead Press",
    nameHe: "לחיצת כתפיים",
    descriptionHe: "דחיפה מעל הראש, ישיבה או עמידה, בטן אסופה וגב ניטרלי.",
    primaryMusclesHe: ["כתפיים קדמיות", "טרייספס"],
    equipment: ["מוט/דאמבלים"],
    difficulty: "intermediate",
    images: ["/fit/exercises/ohp.gif"],
    language: "he",
  },
  {
    provider: "seed",
    providerId: "shoulders_lateral_raise",
    category: "shoulders",
    name: "Lateral Raise",
    nameHe: "הרחקת כתפיים",
    descriptionHe:
      "דאמבלים לצדדים, מרפקים רכים, עליה עד גובה כתפיים וחזרה איטית.",
    primaryMusclesHe: ["כתפיים אמצעיות"],
    equipment: ["דאמבלים"],
    difficulty: "beginner",
    images: ["/fit/exercises/lateral_raise.gif"],
    language: "he",
  },

  // --- ידיים ---
  {
    provider: "seed",
    providerId: "arms_biceps_curl",
    category: "arms",
    name: "Biceps Curl",
    nameHe: "כפיפות מרפקים",
    descriptionHe: "עמידה זקופה, כפיפת מרפקים מבלי לנוע עם הגב, שליטה בטווח.",
    primaryMusclesHe: ["בייספס"],
    equipment: ["דאמבלים/מוט"],
    difficulty: "beginner",
    images: ["/fit/exercises/biceps_curl.gif"],
    language: "he",
  },
  {
    provider: "seed",
    providerId: "arms_triceps_pushdown",
    category: "arms",
    name: "Triceps Pushdown",
    nameHe: "פוש־דאון טרייספס",
    descriptionHe: "מרפקים צמודים לגוף, דחיפה מטה בכבל, שליטה בחזרה מעלה.",
    primaryMusclesHe: ["טרייספס"],
    equipment: ["כבל"],
    difficulty: "beginner",
    images: ["/fit/exercises/triceps_pushdown.gif"],
    language: "he",
  },

  // --- בטן ---
  {
    provider: "seed",
    providerId: "abs_crunch",
    category: "abs",
    name: "Crunch",
    nameHe: "קרנצ׳ים",
    descriptionHe:
      "כפיפה קצרה של פלג גוף עליון, פוקוס על בטן עליונה, ללא משיכת צוואר.",
    primaryMusclesHe: ["בטן עליונה"],
    equipment: [],
    difficulty: "beginner",
    images: ["/fit/exercises/crunch.gif"],
    language: "he",
  },
  {
    provider: "seed",
    providerId: "abs_plank",
    category: "abs",
    name: "Plank",
    nameHe: "פלאנק",
    descriptionHe: "מנח סטטי במקביל לרצפה, בטן/ישבן אסופים, צוואר ניטרלי.",
    primaryMusclesHe: ["ליבה"],
    equipment: [],
    difficulty: "beginner",
    images: ["/fit/exercises/plank.gif"],
    language: "he",
  },
  {
    provider: "seed",
    providerId: "abs_leg_raise",
    category: "abs",
    name: "Hanging Leg Raise",
    nameHe: "הרמות רגליים תלוי",
    descriptionHe: "אחיזה למתח והרמת רגליים קדימה תוך שמירה על אגן יציב.",
    primaryMusclesHe: ["בטן תחתונה"],
    equipment: ["מתח"],
    difficulty: "advanced",
    images: ["/fit/exercises/hanging_leg_raise.gif"],
    language: "he",
  },

  // --- פול באדי / כוח ---
  {
    provider: "seed",
    providerId: "full_deadlift",
    category: "full_body",
    name: "Deadlift",
    nameHe: "דדליפט",
    descriptionHe: "הנפת המוט מהרצפה בגב ניטרלי, דחיפת קרקע ושמירה על טכניקה.",
    primaryMusclesHe: ["מסטרינגס", "ישבן", "גב זוקפים"],
    equipment: ["מוט"],
    difficulty: "advanced",
    images: ["/fit/exercises/deadlift.gif"],
    language: "he",
  },
  {
    provider: "seed",
    providerId: "full_kb_swing",
    category: "full_body",
    name: "Kettlebell Swing",
    nameHe: "סוינג קטלבל",
    descriptionHe: "תנופה מהירכיים, לא מהכתפיים, נעילת ישבן בקצה.",
    primaryMusclesHe: ["ירכיים אחוריות", "ליבה"],
    equipment: ["קטלבל"],
    difficulty: "intermediate",
    images: ["/fit/exercises/kb_swing.gif"],
    language: "he",
  },

  // --- אירובי ---
  {
    provider: "seed",
    providerId: "cardio_row",
    category: "cardio",
    name: "Rowing Machine",
    nameHe: "חתירה קרדיו",
    descriptionHe: "רצף תפיסה-משיכה-שחרור בקצב קבוע, נשימה סדורה.",
    primaryMusclesHe: ["לב-ריאה", "גב"],
    equipment: ["מכונת חתירה"],
    difficulty: "beginner",
    images: ["/fit/exercises/rower.gif"],
    language: "he",
  },
  {
    provider: "seed",
    providerId: "cardio_bike",
    category: "cardio",
    name: "Air Bike",
    nameHe: "אייר־בייק",
    descriptionHe: "דיווש ודחיפת ידיים יחד בקצב נבחר, אינטרוולים מומלצים.",
    primaryMusclesHe: ["לב-ריאה"],
    equipment: ["מכונה"],
    difficulty: "intermediate",
    images: ["/fit/exercises/air_bike.gif"],
    language: "he",
  },

  // --- מוביליטי ---
  {
    provider: "seed",
    providerId: "mob_hip_opener",
    category: "mobility",
    name: "Hip Opener Stretch",
    nameHe: "פתיחת ירך",
    descriptionHe: "מתיחה דינמית למפרק ירך, תנועתיות ונשימה רגועה.",
    primaryMusclesHe: ["מפשעה", "גלוטאוס"],
    equipment: [],
    difficulty: "beginner",
    images: ["/fit/exercises/hip_opener.gif"],
    language: "he",
  },
  {
    provider: "seed",
    providerId: "mob_thoracic",
    category: "mobility",
    name: "Thoracic Rotation",
    nameHe: "רוטציית בית חזה",
    descriptionHe: "סיבובי בית חזה על ארבע או שכיבה, שחרור גב עליון.",
    primaryMusclesHe: ["גב עליון"],
    equipment: [],
    difficulty: "beginner",
    images: ["/fit/exercises/thoracic.gif"],
    language: "he",
  },

  // תוסיף כאן עוד אם תרצה — המבנה ברור
];

export async function POST(req: Request) {
  const auth = await requireAdminAPI();
  if (!auth.ok)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );

  try {
    let inserted = 0;
    for (const e of SEED) {
      await upsertExercise(e);
      inserted++;
    }
    return NextResponse.json({ ok: true, inserted });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}
