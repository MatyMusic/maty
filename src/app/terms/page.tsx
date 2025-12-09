// src/app/terms/page.tsx
export const metadata = { title: "תנאי שימוש · MATY MUSIC" };

export default function Page() {
  return (
    <main dir="rtl" className="mx-auto max-w-3xl p-6 text-right">
      <h1 className="text-2xl font-extrabold mb-3">תנאי שימוש</h1>
      <p className="opacity-80">
        זהו דף תנאי שימוש בסיסי לצורכי פיתוח. ניתן לעדכן כאן את הנוסח המלא מאוחר
        יותר. בשימוש באתר הינך מאשר/ת את התנאים.
      </p>
      <hr className="my-6 opacity-20" />
      <p className="text-sm opacity-70">
        עודכן: {new Date().toLocaleDateString("he-IL")}
      </p>
    </main>
  );
}
