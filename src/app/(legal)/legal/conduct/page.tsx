import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "כללי קהילה והתנהגות | MATY-DATE",
  description: "כללי קהילה והתנהגות לשימוש בטוח ומכבד ב-MATY-DATE.",
  robots: { index: false },
};

export default function ConductPage() {
  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-gradient-to-br from-violet-50 to-pink-50 dark:from-neutral-950 dark:to-violet-950/20"
    >
      <section className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-neutral-900/70 p-6 md:p-8 shadow-card text-right">
          <h1 className="text-2xl md:text-3xl font-extrabold">
            כללי קהילה והתנהגות
          </h1>
          <p className="opacity-80 text-sm mt-2">
            כדי לשמור על מרחב בטוח, מכבד ונעים לכולם ב-MATY-DATE, נבקש לעקוב
            אחרי הכללים הבאים.
          </p>

          <div className="mt-6 space-y-5 text-[15px] leading-7">
            <section>
              <h2 className="font-semibold text-lg mb-1">כבוד ובטיחות</h2>
              <ul className="list-disc pr-5 space-y-1">
                <li>דברו בנימוס, בלי שפה פוגענית, הטרדה או השפלה.</li>
                <li>אין לשתף תכנים אלימים, מאיימים או פורנוגרפיים.</li>
                <li>כבדו גבולות – לא שולחים הודעות חוזרות אחרי “לא” ברור.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-1">פרטיות ושקיפות</h2>
              <ul className="list-disc pr-5 space-y-1">
                <li>
                  אל תבקשו או תפרסמו פרטים מזהים (כתובת, מקום עבודה, מס’ מזהה).
                </li>
                <li>אין לשתף צילומי מסך או תוכן שיחות ללא הסכמה מפורשת.</li>
                <li>היו אותנטיים – משתמש אחד לאדם, בלי התחזות.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-1">אסור בהחלט</h2>
              <ul className="list-disc pr-5 space-y-1">
                <li>הסתה, גזענות, אפליה, אלימות, רמייה או בקשות כספיות.</li>
                <li>שידול לקטינים או כל פעילות לא חוקית.</li>
                <li>שימוש ב-MATY-DATE למכירה/פרסום מסחרי ללא אישור.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-1">דיווח ואכיפה</h2>
              <p>
                נתקלתם בהתנהגות בעייתית? דווחו לנו דרך “צור קשר” או מתוך
                הפרופיל. הפרות עלולות להביא להגבלות, חסימה או פנייה לגורמי
                אכיפה.
              </p>
            </section>

            <section className="opacity-80 text-sm">
              <p>
                שימוש ב-MATY-DATE כפוף גם ל־{" "}
                <a
                  className="underline"
                  href="/legal/terms"
                  target="_blank"
                  rel="noopener"
                >
                  תנאי השימוש
                </a>{" "}
                ו־{" "}
                <a
                  className="underline"
                  href="/legal/privacy"
                  target="_blank"
                  rel="noopener"
                >
                  מדיניות הפרטיות
                </a>
                .
              </p>
              <p className="mt-2">
                העדכון האחרון: {new Date().toLocaleDateString("he-IL")}.
              </p>
            </section>
          </div>

          <div className="mt-6 flex gap-2 justify-end">
            <a
              href="/legal/consent?next=/maty-date"
              className="mm-btn mm-btn-primary"
            >
              חזרה לאישור והמשך
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
