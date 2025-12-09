// src/app/api/club/quiz/generate/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

type Quiz = {
  title: string;
  intro?: string;
  questions: QuizQuestion[];
};

function buildQuickQuiz(topicRaw: string, count: number): Quiz {
  const topic = topicRaw.trim() || "כללי";

  const safeCount = Math.min(Math.max(count, 3), 8);

  const baseTitle = `חידון מהיר על ${topic}`;
  const intro =
    "חידון קצר וקליל. ענו בצורה אינטואיטיבית ותראו כמה אתם בעניינים 😉";

  const questions: QuizQuestion[] = [];

  for (let i = 1; i <= safeCount; i++) {
    const q: QuizQuestion = {
      question: `שאלה ${i} בנושא "${topic}" – כתוב כאן שאלה מותאמת לקהל שלך.`,
      options: [
        "תשובה א' (אפשר לערוך)",
        "תשובה ב' (אפשר לערוך)",
        "תשובה ג' (אפשר לערוך)",
        "תשובה ד' (אפשר לערוך)",
      ],
      correctIndex: 0,
    };
    questions.push(q);
  }

  return {
    title: baseTitle,
    intro,
    questions,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const topic = String(body?.topic || "").trim();
    const count = Number(body?.count || 4);

    if (!topic) {
      return NextResponse.json(
        {
          ok: false,
          error: "חסר נושא לחידון (topic).",
        },
        { status: 400 },
      );
    }

    const quiz = buildQuickQuiz(topic, count);

    return NextResponse.json(
      {
        ok: true,
        quiz,
      },
      { status: 200 },
    );
  } catch (e: any) {
    console.error("[quiz-generate] error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: "שגיאה ביצירת החידון.",
      },
      { status: 500 },
    );
  }
}
