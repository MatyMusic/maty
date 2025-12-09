// דף מלא — src/lib/promos/types.ts
import { z } from "zod";
import { normalizeLocale } from "@/lib/i18n/locale";

/** URL מלא או path יחסי שמתחיל ב-"/" או ריק */
const Urlish = z
  .string()
  .trim()
  .optional()
  .transform((v) => v ?? "")
  .refine(
    (v) =>
      v === "" ||
      v.startsWith("http://") ||
      v.startsWith("https://") ||
      v.startsWith("/"),
    { message: "url חייב להיות http(s):// או נתיב שמתחיל ב-/" },
  );

export const CreativeZ = z.object({
  id: z.string(),
  title: z.string().optional(),
  imageUrl: Urlish,
  body: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: Urlish,
});

export const PromoZ = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["active", "paused", "archived"]),
  type: z.enum(["banner", "card", "inline"]).default("banner"),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  audience: z.object({
    categories: z.array(z.string()).default([]),
    moods: z.array(z.string()).default([]),
    tempos: z.array(z.string()).default([]),
    bpmMin: z.number().nullable().default(null),
    bpmMax: z.number().nullable().default(null),
    // נרמול שפות כבר בשכבה הזו (he-IL → he)
    locales: z
      .array(z.string())
      .default([])
      .transform((arr) => arr.map(normalizeLocale)),
  }),
  schedule: z.object({
    startAt: z.string().nullable().default(null),
    endAt: z.string().nullable().default(null),
    timezone: z.string().default("Asia/Jerusalem"),
    capping: z.object({
      maxImpressions: z.number().nullable().default(null),
      dailyCap: z.number().nullable().default(null),
      perUserCap: z.number().nullable().default(null),
    }),
    pacing: z.enum(["asap", "even"]).default("asap"),
  }),
  budget: z.object({
    model: z.enum(["CPM", "CPC", "Flat"]).default("CPM"),
    bid: z.number().nullable().default(null),
    totalBudget: z.number().nullable().default(null),
  }),
  creatives: z.array(CreativeZ).default([]),
  stats: z.object({
    impressions: z.number().default(0),
    clicks: z.number().default(0),
    ctr: z.number().default(0),
    spends: z.number().default(0),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Promo = z.infer<typeof PromoZ>;
