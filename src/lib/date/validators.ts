// src/lib/date/validators.ts
import { z } from "zod";

export const profileSchema = z.object({
  displayName: z.string().min(1).max(80),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  languages: z
    .union([z.array(z.string().min(1)), z.string()])
    .optional()
    .nullable(),
  judaism_direction: z
    .union([
      z.enum([
        "orthodox",
        "haredi",
        "chasidic",
        "modern",
        "conservative",
        "reform",
        "reconstructionist",
        "secular",
      ]),
      z.null(),
    ])
    .optional(),
  kashrut_level: z.string().max(60).optional().nullable(),
  shabbat_level: z.string().max(60).optional().nullable(),
  goals: z
    .union([z.array(z.string().min(1)), z.string()])
    .optional()
    .nullable(),
  about_me: z.string().max(1500).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const preferencesSchema = z.object({
  genderWanted: z
    .union([z.enum(["male", "female", "other"]), z.literal("any")])
    .optional()
    .nullable(),
  ageMin: z.number().int().min(18).max(100).optional(),
  ageMax: z.number().int().min(18).max(100).optional(),
  countries: z.array(z.string()).optional(),
  directions: z.array(z.string()).optional(),
  advanced: z.record(z.any()).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type PrefsInput = z.infer<typeof preferencesSchema>;
