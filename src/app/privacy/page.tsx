// src/app/privacy/page.tsx
export const metadata = { title: "מדיניות פרטיות · MATY MUSIC" };

export default function Page() {
  return (
    <main dir="rtl" className="mx-auto max-w-3xl p-6 text-right">
      <h1 className="text-2xl font-extrabולד mb-3">מדיניות פרטיות</h1>
      <p className="opacity-80">
        זהו דף פרטיות בסיסי לצורכי פיתוח. נתוני משתמשים נשמרים רק לשם הפעלת
        השירות, ולא יועברו לצד ג׳ ללא בסיס חוקי/הסכמה. ניתן לעדכן כאן את הנוסח
        המלא.
      </p>
      <hr className="my-6 opacity-20" />
      <p className="text-sm opacity-70">
        עודכן: {new Date().toLocaleDateString("he-IL")}
      </p>
    </main>
  );
}
