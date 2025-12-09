// src/components/club/QuizCreatorPanel.tsx
"use client";

import * as React from "react";

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

type ApiResp = {
  ok: boolean;
  quiz?: Quiz;
  error?: string;
};

type Props = {
  className?: string;
};

export default function QuizCreatorPanel({ className }: Props) {
  const [topic, setTopic] = React.useState("");
  const [count, setCount] = React.useState(4);
  const [busyGen, setBusyGen] = React.useState(false);
  const [busyBroadcast, setBusyBroadcast] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [quiz, setQuiz] = React.useState<Quiz | null>(null);

  // יצירת חידון פנימית
  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!topic.trim() || busyGen) return;

    setBusyGen(true);
    setError(null);
    setSuccess(null);
    setQuiz(null);

    try {
      const res = await fetch("/api/club/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count }),
      });

      const data: ApiResp = await res.json().catch(() => ({
        ok: false,
        error: "שגיאה בקריאת השרת.",
      }));

      if (!data.ok || !data.quiz) {
        setError(
          data.error ||
            (res.status >= 500
              ? "שגיאת שרת ביצירת חידון."
              : "לא הצלחנו לייצר חידון. נסה שוב."),
        );
        return;
      }

      setQuiz(data.quiz);
    } catch (err) {
      console.error("[QuizCreatorPanel] generate error:", err);
      setError("שגיאה כללית. בדוק חיבור או נסה שוב.");
    } finally {
      setBusyGen(false);
    }
  }

  // בניית טקסט יפה לפוסט (סטייל AI)
  function buildQuizPostText(q: Quiz): string {
    const lines: string[] = [];

    lines.push(`🎮 חידון מהיר: ${q.title}`);
    lines.push("");
    if (q.intro) {
      lines.push(q.intro);
      lines.push("");
    }

    lines.push("איך זה עובד?");
    lines.push("• קוראים כל שאלה ובוחרים את התשובה שמתאימה לכם.");
    lines.push("• המשתתפים צוברים נקודות, ואפשר לראות מי הכי בעניינים.");
    lines.push(
      "• אפשר לדמיין שכל אחד הוא אווטאר קטן בתוך זירת משחק – מי שעונה נכון מזנק קדימה 😉",
    );
    lines.push("");

    q.questions.forEach((qq, i) => {
      lines.push(`${i + 1}. ${qq.question}`);
      lines.push(`   א) ${qq.options[0] ?? ""}   ב) ${qq.options[1] ?? ""}`);
      if (qq.options[2] || qq.options[3]) {
        lines.push(`   ג) ${qq.options[2] ?? ""}   ד) ${qq.options[3] ?? ""}`);
      }
      lines.push("");
    });

    lines.push(
      "סמנו בתגובות את התשובות שלכם לפי מספר שאלה ואות (1–א, 2–ב וכו').",
    );
    lines.push("מוכנים? קדימה למשחק! 🎧🕺");

    return lines.join("\n");
  }

  // שידור אמיתי לפיד – יצירת פוסט ב-/api/club/posts
  async function handleBroadcast() {
    if (!quiz || busyBroadcast) return;

    setBusyBroadcast(true);
    setError(null);
    setSuccess(null);

    try {
      const text = buildQuizPostText(quiz);

      const res = await fetch("/api/club/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          genre: "quiz",
          tags: ["חידון", "quiz", "משחק", "club"],
          meta: {
            kind: "quiz",
            title: quiz.title,
            questionsCount: quiz.questions.length,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        console.error("[QuizCreatorPanel] broadcast error:", res.status, data);
        setError(
          data?.error ||
            "החידון נוצר, אבל לא הצלחנו לשדר לפיד. בדוק את /api/club/posts.",
        );
        return;
      }

      setSuccess("החידון שודר לפיד! רענן את הפיד כדי לראות את הפוסט 🎉");
    } catch (err) {
      console.error("[QuizCreatorPanel] broadcast error:", err);
      setError("שגיאה בשידור החידון לפיד.");
    } finally {
      setBusyBroadcast(false);
    }
  }

  // עדכון שאלות ותגובות (עריכה חיה)
  function updateQuestionText(index: number, value: string) {
    setQuiz((prev) => {
      if (!prev) return prev;
      const next: Quiz = {
        ...prev,
        questions: prev.questions.map((q, i) =>
          i === index ? { ...q, question: value } : q,
        ),
      };
      return next;
    });
  }

  function updateOptionText(qIndex: number, optIndex: number, value: string) {
    setQuiz((prev) => {
      if (!prev) return prev;
      const nextOptions = [...prev.questions[qIndex].options];
      nextOptions[optIndex] = value;
      const nextQuestions = prev.questions.map((q, i) =>
        i === qIndex ? { ...q, options: nextOptions } : q,
      );
      return { ...prev, questions: nextQuestions };
    });
  }

  function updateCorrectIndex(qIndex: number, newIndex: number) {
    setQuiz((prev) => {
      if (!prev) return prev;
      const nextQuestions = prev.questions.map((q, i) =>
        i === qIndex ? { ...q, correctIndex: newIndex } : q,
      );
      return { ...prev, questions: nextQuestions };
    });
  }

  const base =
    "flex flex-col rounded-2xl border border-sky-500/70 bg-slate-950/95 px-4 py-3 text-slate-50 shadow-lg shadow-sky-500/25 backdrop-blur text-[13px]";

  return (
    <section className={`${base} ${className ?? ""}`}>
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base md:text-lg font-bold">
            יצירת חידון מהיר ל-CLUB
          </h2>
          <p className="text-[11px] md:text-[12px] text-slate-300/90">
            תכתוב נושא, בחר מספר שאלות – המערכת תיצור לך חידון מוכן שאפשר לערוך
            ולשדר כפוסט לפיד.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end text-[11px] text-sky-300">
          <span>🎯 שימושים:</span>
          <span>• שבירת קרח</span>
          <span>• חידון שבועי</span>
          <span>• שעשועון עם אווטארים ותלת־מימד בהמשך</span>
        </div>
      </header>

      {/* טופס יצירת חידון */}
      <form
        onSubmit={handleGenerate}
        className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-300">
            נושא החידון (משפט קצר)
          </label>
          <input
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="לדוגמה: חידון על מוזיקה ישראלית / חידון חנוכה / חידון כושר..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[13px] text-slate-50 outline-none placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-300">מספר שאלות</label>
          <input
            type="number"
            min={3}
            max={8}
            value={count}
            onChange={(e) =>
              setCount(Math.min(8, Math.max(3, Number(e.target.value || 4))))
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[13px] text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={busyGen || !topic.trim()}
            className="w-full rounded-xl bg-sky-500 px-3 py-2 text-[13px] font-semibold text-slate-950 shadow hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyGen ? "יוצר חידון…" : "צור חידון"}
          </button>
        </div>
      </form>

      {error && <div className="mt-2 text-[11px] text-red-400">{error}</div>}
      {success && (
        <div className="mt-2 text-[11px] text-emerald-400">{success}</div>
      )}

      {/* Preview + עריכה */}
      {quiz && (
        <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-3 text-[13px]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="space-y-1">
              <div className="text-[11px] uppercase text-sky-400">
                Preview & עריכה
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-300">
                  כותרת החידון
                </label>
                <input
                  value={quiz.title}
                  onChange={(e) =>
                    setQuiz((prev) =>
                      prev ? { ...prev, title: e.target.value } : prev,
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[13px] text-slate-50 outline-none focus:border-sky-500"
                />
              </div>
              {quiz.intro !== undefined && (
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-300">
                    טקסט פתיחה
                  </label>
                  <textarea
                    rows={2}
                    value={quiz.intro}
                    onChange={(e) =>
                      setQuiz((prev) =>
                        prev ? { ...prev, intro: e.target.value } : prev,
                      )
                    }
                    className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[12px] text-slate-50 outline-none focus:border-sky-500"
                  />
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              {quiz.questions.length} שאלות
            </div>
          </div>

          <ol className="mt-3 space-y-3 text-[12px]">
            {quiz.questions.map((q, qi) => (
              <li
                key={qi}
                className="rounded-xl bg-slate-950/60 p-2 border border-slate-800"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-300">
                    שאלה {qi + 1}
                  </label>
                  <input
                    value={q.question}
                    onChange={(e) => updateQuestionText(qi, e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[12px] text-slate-50 outline-none focus:border-sky-500"
                  />
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex items-center gap-2 rounded-lg border px-2 py-1 cursor-pointer ${
                        oi === q.correctIndex
                          ? "border-emerald-400/80 bg-emerald-500/10"
                          : "border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={oi === q.correctIndex}
                        onChange={() => updateCorrectIndex(qi, oi)}
                        className="h-3 w-3"
                      />
                      <input
                        value={opt}
                        onChange={(e) =>
                          updateOptionText(qi, oi, e.target.value)
                        }
                        className="flex-1 bg-transparent text-[12px] text-slate-50 outline-none"
                      />
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleBroadcast}
              disabled={busyBroadcast}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-[12px] font-semibold text-slate-950 shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyBroadcast ? "משדר חידון…" : "🎉 שדר חידון לפיד"}
            </button>
            <span className="text-[11px] text-slate-400">
              בהמשך אפשר לחבר את החידון לזירת אווטארים ותלת־מימד שמגיבים לפי
              התוצאות.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
