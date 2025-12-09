import { z } from "zod";

export const DateProfileSchema = z.object({
  displayName: z.string().min(2).max(40),
  gender: z.enum(["male","female","other"]).nullable().default(null),
  age: z.number().min(18).max(120).nullable().default(null),
  country: z.string().min(2).max(60).nullable().default(null),
  city: z.string().min(2).max(60).nullable().default(null),

  judaism_direction: z.enum([
    "orthodox","haredi","chasidic","modern",
    "conservative","reform","reconstructionist","secular"
  ]).nullable().default(null),

  // העדפות התאמה בסיסיות:
  goal: z.enum(["serious","marriage","friendship"]).nullable().default(null),
  minAge: z.number().min(18).max(120).nullable().default(null),
  maxAge: z.number().min(18).max(120).nullable().default(null),

  // מדיה:
  avatarUrl: z.string().url().optional(),
  about: z.string().max(800).nullable().default(null),
});

export type DateProfile = z.infer<typeof DateProfileSchema>;
