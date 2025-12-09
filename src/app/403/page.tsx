// src/app/403/page.tsx
export default function ForbiddenPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-bold">גישה חסומה</h1>
      <p className="mt-2 opacity-80">
        אין לך הרשאה לפאנל ניהול. התחבר/י עם משתמש אדמין או הפעל/י מצב דמו.
      </p>

      <div className="mt-4 space-x-2 space-x-reverse">
        <a href="/auth?from=/admin" className="mm-btn mm-pressable">
          התחברות
        </a>
        <button
          className="mm-btn mm-pressable"
          onClick={() => {
            document.cookie = "mm-admin=1; path=/";
            location.reload();
          }}
        >
          הפעל BYPASS (לוקלי)
        </button>
      </div>

      <div className="mt-4 text-xs opacity-70">
        טיפ: לפיתוח אפשר גם לשים <code>DEMO_UNLOCK=1</code> ב־
        <code>.env.local</code>.
      </div>
    </main>
  );
}
