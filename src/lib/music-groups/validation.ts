import { z } from "zod";

export const geoPointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([z.number(), z.number()]),
});

export const createGroupSchema = z.object({
  title: z.string().min(2).max(80),
  description: z.string().max(2000).optional(),
  purposes: z
    .array(
      z.enum([
        "collab",
        "rehearsal",
        "learning",
        "mix_master",
        "gear_swap",
        "jam",
        "community",
      ]),
    )
    .min(1),
  daws: z
    .array(
      z.enum([
        "cubase",
        "ableton",
        "logic",
        "reaper",
        "studioone",
        "protools",
        "other",
      ]),
    )
    .optional(),
  skills: z
    .array(z.enum(["beginner", "intermediate", "advanced", "pro"]))
    .optional(),
  tags: z.array(z.string().min(1).max(24)).optional(),
  city: z.string().max(80).nullable().optional(),
  location: geoPointSchema.nullable().optional(),
  visibility: z.enum(["public", "private", "hidden"]).default("public"),
  joinPolicy: z.enum(["open", "request", "invite"]).default("open"),
  maxMembers: z.number().int().positive().max(500).nullable().optional(),
  meetingDays: z
    .array(z.enum(["sun", "mon", "tue", "wed", "thu", "fri", "sat"]))
    .optional(),
  meetingTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

export const statusChangeSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "suspended"]),
  note: z.string().max(500).optional(),
});
