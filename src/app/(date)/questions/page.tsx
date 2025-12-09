"use client";
import { useState } from "react";

const QUESTIONS = [
  { id: 1, q: "איזה חג יהודי הכי קרוב אליך ולמה?" },
  { id: 2, q: "מהו ניגון שנותן לך השראה?" },
  { id: 3, q: "מה חשוב לך יותר: שבת, כשרות או לימוד תורה?" },
];

export default function DateQuestionsPage() {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  function setAnswer(id: number, val: string) {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  }

  return (
    <main dir="rtl" className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">שאלות התאמה</h1>
      {QUESTIONS.map((q) => (
        <div key={q.id} className="space-y-2">
          <p className="font-medium">{q.q}</p>
          <textarea
            className="w-full rounded-xl border p-3"
            rows={3}
            value={answers[q.id] || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
          />
        </div>
      ))}
      <button
        className="rounded-xl bg-violet-600 text-white px-6 py-2"
        onClick={() => console.log("saved", answers)}
      >
        שמור תשובות
      </button>
    </main>
  );
}
