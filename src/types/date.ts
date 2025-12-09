// src/types/date.ts
export type Level = "strict" | "partial" | "none";
export type Gender = "male" | "female" | "other";
export type Goal = "serious" | "marriage" | "friendship";
export type Tier = "free" | "plus" | "pro" | "vip";
export type SubStatus = "active" | "inactive";

export type Direction =
  | "orthodox"
  | "haredi"
  | "chasidic"
  | "modern"
  | "conservative"
  | "reform"
  | "reconstructionist"
  | "secular";

export const DIR_LABEL: Record<Direction, string> = {
  orthodox: "אורתודוקסי",
  haredi: "חרדי",
  chasidic: "חסידי",
  modern: "אורתודוקסי מודרני",
  conservative: "קונסרבטיבי",
  reform: "רפורמי",
  reconstructionist: "רקונסטרוקטיבי",
  secular: "חילוני/תרבותי",
};

export type Profile = {
  userId: string;
  username: string;
  displayName: string;
  birthDate: string; // YYYY-MM-DD
  gender: Gender;
  country: string;
  city: string;
  languages: string[];
  judaism_direction: Direction | null;
  kashrut_level: Level | null;
  shabbat_level: Level | null;
  goals: Goal | null;
  about_me: string | null;
  avatarUrl: string | null;
  photos: string[];
  verified?: boolean;
  online?: boolean;
  lastActive?: string; // ISO
  tier?: Tier;
  subStatus?: SubStatus;
  updatedAt?: string;
  createdAt?: string;
  matchScore?: number; // 0..100 (אופציונלי)
};
