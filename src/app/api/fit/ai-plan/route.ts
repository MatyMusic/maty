// src/app/api/fit/ai-plan/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/mongoose";
import FitProgram, {
  type FitGoal,
  type FitLevel,
  type FitDay,
} from "@/models/FitProgram";

type ReqBody = {
  userId?: string;
  goal: FitGoal;
  level: FitLevel;
  daysPerWeek: number;
  equipment?: string[];
};

function buildBaseExercises(goal: FitGoal, level: FitLevel): string[] {
  const base: string[] = [];

  if (goal === "fat_loss") {
    base.push("הליכה מהירה / ריצה קלה");
    base.push("בורפיז");
    base.push("סקווטים");
    base.push("שכיבות שמיכה");
  } else if (goal === "muscle_gain") {
    base.push("לחיצת חזה עם משקולות");
    base.push("סקווטים עם משקולות");
    base.push("דדליפט רומני");
    base.push("מתח / חתירה");
  } else if (goal === "endurance") {
    base.push("ריצה מתמשכת");
    base.push("קפיצות בחבל");
    base.push("עליות מדרגות");
  } else {
    base.push("הליכה מהירה");
    base.push("פלנק");
    base.push("שכיבות שמיכה");
    base.push("סקווטים");
  }

  // התאמת קושי
  if (level === "beginner") {
    base.push("תרגילי מוביליטי ומתיחות");
  } else if (level === "advanced") {
    base.push("אינטרוולים עצימים (HIIT)");
  }

  return base;
}

function buildPlan(body: ReqBody): FitDay[] {
  const { goal, level, daysPerWeek, equipment = [] } = body;

  const days: FitDay[] = [];
  const base = buildBaseExercises(goal, level);

  const hasBench = equipment.some((e) => e.toLowerCase().includes("ספה"));
  const hasWeights = equipment.some((e) =>
    e.toLowerCase().includes("משקולת")
  );
  const hasPullup = equipment.some((e) => e.toLowerCase().includes("מתח"));

  for (let i = 0; i < daysPerWeek; i++) {
    const dayIndex = i + 1;
    const exercises: any[] = [];

    // חלוקת קבוצות שריר לפי יום
    if (goal === "fat_loss") {
      // פול-בודי כל אימון
      exercises.push(
        { name: "סקווטים חופשים", sets: 4, reps: 15, restSec: 45 },
        { name: "שכיבות שמיכה", sets: 4, reps: 12, restSec: 45 }
      );
      exercises.push({
        name: "אינטרוולים קצרים (30\" ריצה / 30\" מנוחה)",
        sets: 8,
        timeSec: 30,
        restSec: 30,
      });
    } else if (goal === "muscle_gain") {
      if (dayIndex % 3 === 1) {
        // חזה + כתפיים
        exercises.push(
          {
            name: hasBench
              ? "לחיצת חזה על ספה עם משקולות"
              : "לחיצת חזה בשכיבה על הרצפה עם משקולות",
            sets: 4,
            reps: 8,
            restSec: 90,
          },
          { name: "לחיצת כתף בעמידה", sets: 4, reps: 8, restSec: 90 }
        );
      } else if (dayIndex % 3 === 2) {
        // גב + יד קדמית
        exercises.push(
          {
            name: hasPullup ? "מתח" : "חתירה עם משקולות בגב כפוף",
            sets: 4,
            reps: 8,
            restSec: 90,
          },
          { name: "כפיפות מרפקים (בייספס)", sets: 3, reps: 10, restSec: 75 }
        );
      } else {
        // רגליים + ליבה
        exercises.push(
          {
            name: hasWeights ? "סקווטים עם משקולות" : "סקווטים חופשים",
            sets: 4,
            reps: 10,
            restSec: 90,
          },
          { name: "לאנג׳ים (מכרעים)", sets: 3, reps: 10, restSec: 75 },
          { name: "פלנק", sets: 3, timeSec: 40, restSec: 40 }
        );
      }
    } else if (goal === "endurance") {
      exercises.push(
        { name: "ריצה מתמשכת", sets: 1, timeSec: 20 * 60, restSec: 0 },
        { name: "קפיצות בחבל", sets: 3, timeSec: 60, restSec: 60 }
      );
    } else {
      // general
      exercises.push(
        { name: "הליכה מהירה / ריצה קלה", sets: 1, timeSec: 15 * 60 },
        { name: "שכיבות שמיכה", sets: 3, reps: 12, restSec: 60 },
        { name: "סקווטים", sets: 3, reps: 15, restSec: 60 }
      );
    }

    // קצת ציוד אישי בהשראתך 🙂
    if (hasWeights) {
      exercises.push({
        name: "פרס חזה בשכיבה עם המשקולות 20 קילו שלך",
        sets: 3,
        reps: level === "advanced" ? 12 : 10,
        restSec: 75,
      });
    }
    if (hasPullup) {
      exercises.push({
        name: "אחיזת מתח איזומטרית",
        sets: 3,
        timeSec: 15,
        restSec: 60,
      });
    }

    const title =
      goal === "fat_loss"
        ? `אימון שורף שומן ${dayIndex}`
        : goal === "muscle_gain"
        ? `אימון כוח ${dayIndex}`
        : goal === "endurance"
        ? `אימון סיבולת ${dayIndex}`
        : `אימון כללי ${dayIndex}`;

    const notes =
      level === "beginner"
        ? "שמור על טכניקה, אל תיכנס ישר לקצה – המטרה היא רצף."
        : level === "advanced"
        ? "תן עבודה עד 1–2 חזרות לפני כישלון, שים לב להתאוששות."
        : "תשמור טיפה אוויר, אבל תרגיש דופק.";

    days.push({
      dayIndex,
      title,
      notes,
      exercises,
    });
  }

  return days;
}

export async function POST(req: Request) {
  await db;
  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_json" },
      { status: 400 }
    );
  }

  const { userId, goal, level, daysPerWeek, equipment = [] } = body;

  if (!goal || !level || !daysPerWeek) {
    return NextResponse.json(
      { ok: false, error: "missing_params" },
      { status: 400 }
    );
  }

  const safeDays = Math.min(Math.max(daysPerWeek, 2), 7);
  const uid = userId || "guest";

  const plan = buildPlan({
    userId: uid,
    goal,
    level,
    daysPerWeek: safeDays,
    equipment,
  });

  const doc = await FitProgram.create({
    userId: uid,
    goal,
    level,
    daysPerWeek: safeDays,
    equipment,
    plan,
  });

  return NextResponse.json({ ok: true, program: doc });
}
