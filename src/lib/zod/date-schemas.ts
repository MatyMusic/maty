import { z } from "zod";

export const GenderEnum = z.enum(["male", "female", "other"]);
export const JudaismStream = z.enum([
  "orthodox",
  "haredi",
  "chassidic",
  "modern_orthodox",
  "conservative",
  "reform",
  "reconstructionist",
  "cultural",
]);
export const Level3 = z.enum(["strict", "partial", "none"]);
export const Frequency3 = z.enum(["daily", "sometimes", "never"]);

export const DateProfileSchema = z.object({
  userId: z.string(),
  displayName: z.string().min(2),
  jewishName: z.string().optional(),
  birthYear: z
    .number()
    .int()
    .min(1940)
    .max(new Date().getFullYear() - 18),
  gender: GenderEnum,
  country: z.string().optional(),
  city: z.string().optional(),
  willingToRelocate: z.boolean().optional().default(false),
  languages: z.array(z.string()).default(["he"]),
  bio: z.string().max(1000).optional().default(""),
  photos: z.array(z.string().url()).max(10).default([]),
  avatarUrl: z.string().url().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type TDateProfile = z.infer<typeof DateProfileSchema>;

export const JewishIdentitySchema = z.object({
  userId: z.string(),
  jewishByMother: z.boolean().optional(),
  conversion: z.boolean().optional(),
  judaismDirection: JudaismStream.optional(),
  kashrut: Level3.optional(),
  shabbat: Level3.optional(),
  prayer: Frequency3.optional(),
  tzniut: Level3.optional(),
  torahReading: Frequency3.optional(),
  communityParticipation: z.enum(["active", "periodic", "none"]).optional(),
  holidays: z.array(z.string()).optional(),
  giurSupport: z.boolean().optional(),
  knowledgeLevel: z.enum(["deep", "basic", "minimal"]).optional(),
  updatedAt: z.date().default(() => new Date()),
});
export type TJewishIdentity = z.infer<typeof JewishIdentitySchema>;

export const PreferencesSchema = z.object({
  userId: z.string(),
  ageMin: z.number().int().min(18).max(99).default(20),
  ageMax: z.number().int().min(18).max(99).default(40),
  genders: z.array(GenderEnum).default(["female"]).optional(),
  judaismDirections: z.array(JudaismStream).optional(),
  kashrut: z.array(Level3).optional(),
  shabbat: z.array(Level3).optional(),
  cities: z.array(z.string()).optional(),
  willingToRelocate: z.boolean().optional(),
  languages: z.array(z.string()).optional(),
  withChildrenOk: z.boolean().optional(),
  updatedAt: z.date().default(() => new Date()),
});
export type TPreferences = z.infer<typeof PreferencesSchema>;

export const SwipeSchema = z.object({
  userId: z.string(),
  targetUserId: z.string(),
  action: z.enum(["like", "pass"]),
  createdAt: z.date().default(() => new Date()),
});
export type TSwipe = z.infer<typeof SwipeSchema>;

export const MessageSchema = z.object({
  senderId: z.string(),
  receiverId: z.string(),
  content: z.string().min(1).max(5000),
  sentAt: z.date().default(() => new Date()),
});
export type TMessage = z.infer<typeof MessageSchema>;
