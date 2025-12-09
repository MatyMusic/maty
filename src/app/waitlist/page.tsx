export const dynamic = "force-dynamic";

export const metadata = {
  title: "ממתין לאישור • MATY MUSIC",
  description: "החשבון שלך בתהליך בדיקה. נקפיץ אותך פנימה ברגע שמאשרים.",
};

export default function WaitlistPage() {
  return (
    <main
      dir="rtl"
      className="min-h-dvh flex items-center justify-center px-4 py-12 bg-gradient-to-b from-white to-violet-50/30 dark:from-neutral-950 dark:to-violet-950/10"
    >
      <div className="w-full max-w-xl rounded-2xl border dark:border-neutral-800/60 bg-white/90 dark:bg-neutral-950/90 backdrop-blur p-6 sm:p-8 shadow-xl">
        <header className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            הבקשה שלך התקבלה ✅
          </h1>
          <p className="text-sm opacity-70 mt-1">
            החשבון נמצא בבדיקה ידנית. לאחר אישור תקבל גישה מלאה לרשת.
          </p>
        </header>

        <section className="space-y-4 text-sm leading-7">
          <p>
            אנו שומרים על קהילה מכובדת ונקיה. האישור נדרש כדי למנוע ספאם ותוכן
            לא ראוי. בדרך-כלל זה קצר.
          </p>
          <div className="rounded-xl border dark:border-neutral-800/60 p-4 bg-neutral-50/80 dark:bg-neutral-900/60">
            <div className="font-medium mb-1">מה אפשר לעשות בינתיים?</div>
            <ul className="list-disc me-6 space-y-1">
              <li>לגלוש ב-MATY MUSIC, לשמוע שירים ולצפות בעדכונים ציבוריים.</li>
              <li>
                להשלים פרטי פרופיל ב-MATY-DATE (ביוגרפיה, תחומי עניין, תמונות).
              </li>
              <li>להשאיר לנו הודעה אם צריך זירוז.</li>
            </ul>
          </div>
        </section>

        <footer className="mt-6 flex flex-wrap gap-3">
          <a
            href="/"
            className="rounded-xl border px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            חזרה לדף הבית
          </a>
          <a
            href="/contact"
            className="rounded-xl border px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            צרו קשר
          </a>
        </footer>
      </div>
    </main>
  );
}
