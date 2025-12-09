export const metadata = { title: "קוד קהילה · MATY-DATE" };

export default function GuidelinesPage() {
  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-gradient-to-br from-violet-50 to-pink-50 dark:from-neutral-950 dark:to-violet-950/20"
    >
      <section className="mx-auto max-w-3xl my-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-neutral-900/70 p-6 md:p-8 shadow-card text-right leading-7">
        <h1 className="text-2xl md:text-3xl font-extrabold">
          קוד קהילה — צניעות וכבוד
        </h1>
        <ul className="mt-4 grid gap-2 text-sm">
          <li>• יחס מכבד, ללא לשון הרע/הטרדה.</li>
          <li>• תמונות צנועות ומכבדות בלבד.</li>
          <li>• אמיתות בפרופיל; אין זיוף נתונים.</li>
          <li>• הגנה על פרטיות; אין הפצה/צילום מסך של צ׳טים ללא הסכמה.</li>
          <li>• בטיחות במפגשים: מקום ציבורי, ליידע אדם קרוב.</li>
          <li>• אכיפה: אזהרה → השעיה → חסימה מיידית בהפרות חמורות.</li>
        </ul>
      </section>
    </main>
  );
}
