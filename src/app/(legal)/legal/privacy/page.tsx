export const metadata = { title: "מדיניות פרטיות · MATY-DATE" };

export default function PrivacyPage() {
  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-gradient-to-br from-violet-50 to-pink-50 dark:from-neutral-950 dark:to-violet-950/20"
    >
      <section className="mx-auto max-w-3xl my-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-neutral-900/70 p-6 md:p-8 shadow-card text-right leading-7">
        <h1 className="text-2xl md:text-3xl font-extrabold">מדיניות פרטיות</h1>
        <p className="opacity-70 text-sm">גרסה v1.0 · מעודכן: 01/09/2025</p>
        <ul className="mt-4 grid gap-3 text-sm">
          <li>
            <b>איסוף מידע:</b> פרטי חשבון, העדפות התאמה, תמונות, לוגי אבטחה
            וקוקיות.
          </li>
          <li>
            <b>שימוש:</b> תפעול השירות, התאמות, אבטחה, שיפור, אכיפה, עמידה בדין.
          </li>
          <li>
            <b>שיתוף:</b> ספקי תשתית/אבטחה; רשויות לפי דין; אין מכירת מידע לצד
            שלישי לפרסום.
          </li>
          <li>
            <b>זכויות:</b> גישה/תיקון/מחיקה; התנגדות/הגבלה; תלונה לרשות להגנת
            הפרטיות.
          </li>
          <li>
            <b>אבטחה ושמירה:</b> הצפנה בתעבורה; בקרות גישה; שמירת נתונים רק ככל
            הנדרש.
          </li>
          <li>
            <b>קטינים:</b> אין שימוש מתחת לגיל 18.
          </li>
          <li>
            <b>עדכונים:</b> פרסום גרסה חדשה עם תאריך מעודכן.
          </li>
        </ul>
      </section>
    </main>
  );
}
