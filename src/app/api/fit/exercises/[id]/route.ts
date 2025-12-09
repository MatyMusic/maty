// src/app/api/fit/exercises/[id]/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** ========= Types ========= */
type Difficulty = "" | "beginner" | "intermediate" | "advanced";
type FitDetail = {
  _id: string;
  name: string;
  description?: string;
  category: string;
  primaryMuscles?: string[];
  equipment?: string[];
  images?: string[];
  difficulty?: Difficulty;
  steps?: string[];
};

/** ========= Utils ========= */
const stripHtml = (html?: string) =>
  (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
function mapDifficulty(v?: string | null): Difficulty {
  const t = (v || "").toLowerCase();
  if (t.includes("begin")) return "beginner";
  if (t.includes("inter") || t.includes("medium")) return "intermediate";
  if (t.includes("adv") || t.includes("expert")) return "advanced";
  return "";
}
function inferCategory(muscles: string[], fallback?: string): string {
  const s = muscles.map((m) => m.toLowerCase());
  if (s.some((m) => /(chest|pect|push-up|bench|pec)/.test(m))) return "chest";
  if (s.some((m) => /(back|lats|row|latissimus)/.test(m))) return "back";
  if (s.some((m) => /(quad|hamstring|glute|leg|calf|thigh)/.test(m)))
    return "legs";
  if (s.some((m) => /(shoulder|deltoid|overhead|press)/.test(m)))
    return "shoulders";
  if (s.some((m) => /(bicep|tricep|arm|curl|extension)/.test(m))) return "arms";
  if (s.some((m) => /(abs|core|abdom|oblique|crunch|plank)/.test(m)))
    return "abs";
  if (s.some((m) => /(mobility|stretch)/.test(m))) return "mobility";
  if (s.some((m) => /(run|cardio|aerobic|jump rope|hiit)/.test(m)))
    return "cardio";
  return (fallback || "other").toLowerCase().replace(/[^a-z_]/g, "") || "other";
}

/** ========= Providers ========= */
const EXDB_HOST = process.env.EXERCISEDB_HOST || "exercisedb.p.rapidapi.com";
const WGER_INFO = "https://wger.de/api/v2/exerciseinfo/";

// id יכול להגיע כ־"wger:123", "exdb:abcd", "nin:...". אם אין פרפיקס – ננסה לפי provider=? או נבדוק לפי סדר.
function parsePrefixedId(raw: string): {
  provider?: "wger" | "exercisedb" | "ninjas";
  id: string;
} {
  const s = String(raw);
  if (s.startsWith("wger:")) return { provider: "wger", id: s.slice(5) };
  if (s.startsWith("exdb:")) return { provider: "exercisedb", id: s.slice(5) };
  if (s.startsWith("nin:")) return { provider: "ninjas", id: s.slice(4) };
  return { id: s };
}

/* --- WGER detail (exerciseinfo כולל images/muscles/equipment) --- */
async function getFromWger(id: string): Promise<FitDetail | null> {
  const r = await fetch(
    `${WGER_INFO}${encodeURIComponent(id)}/?language=2&status=2`,
    { next: { revalidate: 300 } },
  );
  if (!r.ok) return null;
  const x = await r.json();
  const muscles: string[] = [
    ...((x.muscles ?? []).map((m: any) => m.name ?? m.name_en ?? "") || []),
    ...((x.muscles_secondary ?? []).map(
      (m: any) => m.name ?? m.name_en ?? "",
    ) || []),
  ].filter(Boolean);
  const equipment: string[] = (x.equipment ?? [])
    .map((e: any) => e.name ?? e.name_en ?? "")
    .filter(Boolean);
  const images: string[] = (x.images ?? [])
    .map((im: any) => im.image ?? im.image_main ?? "")
    .filter(Boolean);

  return {
    _id: `wger:${String(x.id ?? id)}`,
    name: x.name ?? x.name_translations?.en ?? "Unnamed",
    description: stripHtml(x.description || ""),
    category: inferCategory(muscles, x.category?.name),
    primaryMuscles: muscles,
    equipment,
    images,
    difficulty: mapDifficulty(x.level ?? x.difficulty ?? ""),
    steps: [], // לרוב אין צעד-אחר-צעד ב-WGER info
  };
}

/* --- ExerciseDB detail --- */
async function getFromExerciseDB(id: string): Promise<FitDetail | null> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return null;
  const r = await fetch(
    `https://${EXDB_HOST}/exercises/exercise/${encodeURIComponent(id)}`,
    {
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": EXDB_HOST },
      next: { revalidate: 300 },
    },
  );
  if (!r.ok) return null;
  const x = await r.json();
  const muscles: string[] = [
    x?.target,
    ...(Array.isArray(x?.secondaryMuscles) ? x.secondaryMuscles : []),
  ].filter(Boolean);
  const steps: string[] = Array.isArray(x?.instructions) ? x.instructions : [];

  return {
    _id: `exdb:${String(x?.id ?? id)}`,
    name: x?.name || "Unnamed",
    description: steps.join(" ").trim(),
    category: inferCategory(muscles, x?.bodyPart),
    primaryMuscles: muscles,
    equipment: x?.equipment ? [String(x.equipment)] : [],
    images: x?.gifUrl ? [String(x.gifUrl)] : [],
    difficulty: mapDifficulty(x?.difficulty),
    steps,
  };
}

/** ========= GET ========= */
export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const rawId = ctx.params.id;
    const parsed = parsePrefixedId(rawId);
    const sp = new URL(req.url).searchParams;
    const providerHint =
      (sp.get("provider") as "wger" | "exercisedb" | "ninjas" | null) || null;

    let out: FitDetail | null = null;

    // סדר החלטה:
    // 1) אם יש פרפיקס — נלך עליו
    // 2) אם אין, אבל יש provider Hint — ננסה אותו
    // 3) ננסה לפי סדר WGER -> ExerciseDB (Ninjas לא תומך ב-id)
    if (parsed.provider === "wger") out = await getFromWger(parsed.id);
    else if (parsed.provider === "exercisedb")
      out = await getFromExerciseDB(parsed.id);
    else if (providerHint === "wger") out = await getFromWger(parsed.id);
    else if (providerHint === "exercisedb")
      out = await getFromExerciseDB(parsed.id);
    else {
      out =
        (await getFromWger(parsed.id)) ||
        (await getFromExerciseDB(parsed.id)) ||
        null;
    }

    if (!out)
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 },
      );
    return NextResponse.json(
      { ok: true, item: out },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    );
  }
}
