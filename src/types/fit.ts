export type FitMuscle =
  | "חזה"
  | "גב"
  | "כתפיים"
  | "רגליים"
  | "ישבן"
  | "ירך אחורית"
  | "ירך קדמית"
  | "יד קדמית"
  | "יד אחורית"
  | "אמות"
  | "שוקיים"
  | "בטן"
  | "לב/ריאה"
  | "כללי";

export type FitLevel = "קל" | "בינוני" | "מתקדם" | "כללי";

export type FitEquipment =
  | "דאמבלים"
  | "מוט"
  | "מכונה"
  | "כבלים"
  | "משקל גוף"
  | "קטלבל"
  | "אלסטיות"
  | "ספסל"
  | "TRX"
  | "אחר"
  | "ללא";

export type ExerciseItem = {
  id: string; // global: <provider>:<nativeId>
  provider: "wger" | "exercisedb" | "apininjas" | "demo";
  name: string;
  slug: string;
  muscle: FitMuscle;
  secondary?: FitMuscle[];
  equipment?: FitEquipment[];
  level?: FitLevel;
  instructions?: string;
  images?: string[];
  videoUrl?: string;
  youtubeId?: string;
};

export type ExerciseQuery = {
  q?: string;
  muscle?: FitMuscle | "";
  equipment?: FitEquipment | "";
  level?: FitLevel | "";
  page?: number; // 1-based
  pageSize?: number; // default 24, max 60
  providers?: string[]; // ["wger","exercisedb","apininjas","demo"]
};
