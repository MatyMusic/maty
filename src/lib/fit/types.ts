// src/lib/fit/types.ts
export type FitDifficulty = "" | "beginner" | "intermediate" | "advanced";

export type FitRow = {
  _id: string;
  name: string;
  nameHe?: string;
  description?: string;
  descriptionHe?: string;
  category: string; // chest/back/legs/shoulders/arms/abs/full_body/cardio/mobility/other
  primaryMuscles?: string[];
  primaryMusclesHe?: string[];
  equipment?: string[];
  images?: string[]; // תמונות/GIFs
  difficulty?: FitDifficulty;
};

export type FitDetail = FitRow & {
  steps?: string[]; // הוראות מסודרות אם קיימות (ExerciseDB)
};

export type FitQuery = {
  q?: string;
  category?: string;
  muscle?: string;
  equipment?: string;
  difficulty?: FitDifficulty;
  page?: number;
  limit?: number;
  provider?: "wger" | "exercisedb" | "ninjas" | "hybrid";
};

export type PagedResp<T> = {
  ok: boolean;
  items: T[];
  page: number;
  pages: number;
  total: number;
  error?: string;
};
