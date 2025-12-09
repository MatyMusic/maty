export type Gender = "male" | "female" | "other";
export type Direction =
  | "orthodox"
  | "haredi"
  | "chasidic"
  | "modern"
  | "conservative"
  | "reform"
  | "reconstructionist"
  | "secular";

export type Observance = {
  shabbat: 0 | 1 | 2 | 3; // 0=לא שומר, 3=קפדני
  kashrut: 0 | 1 | 2 | 3;
};

export type MusicGenreWeight = { key: string; weight: number };

export type DateProfile = {
  _id?: string;
  userId: string;
  displayName?: string;
  gender?: Gender | null;
  dob?: string | null; // YYYY-MM-DD
  country?: string | null;
  city?: string | null;
  languages?: string[];
  judaism_direction?: Direction | null;
  observance?: Observance;
  genres?: MusicGenreWeight[];
  artists?: string[];
  signatureTrack?: { title: string; artist: string; url?: string } | null;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  status?: "active" | "review" | "blocked";
};

export type QuestionAnswer = {
  _id?: string;
  userId: string;
  questionId: number;
  answer: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MatchItem = {
  _id: string;
  displayName: string;
  city?: string | null;
  country?: string | null;
  judaism_direction?: Direction | null;
  score: number; // 0..100
  avatarUrl?: string | null;
};
