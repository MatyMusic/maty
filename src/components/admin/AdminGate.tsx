// src/components/admin/AdminGate.tsx
"use client";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const admin = useIsAdmin();

  if (admin === null) {
    return (
      <div className="m-6 mm-card p-6" dir="rtl">
        טוען הרשאות…
      </div>
    );
  }
  if (admin === false) {
    return (
      <div className="m-6 mm-card p-6" dir="rtl">
        <h2 className="text-xl font-bold mb-2">פאנל ניהול – נעול</h2>
        <p className="opacity-80">
          אין לך הרשאה. התחבר/י או הפעל/י BYPASS לפיתוח.
        </p>
        <div className="mt-3 space-x-2 space-x-reverse">
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
            BYPASS
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
