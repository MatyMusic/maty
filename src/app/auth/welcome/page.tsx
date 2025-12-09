// src/app/auth/welcome/page.tsx
"use client";

import Link from "next/link";

export default function AuthWelcomePage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="max-w-md w-full mm-card text-right space-y-4">
        <h1 className="text-2xl font-bold">ברוך הבא ל-MATY MUSIC 🎵</h1>
        <p className="text-sm opacity-80">
          נרשמת בהצלחה! עכשיו אפשר לבחור לאן להמשיך:
        </p>
        <div className="grid gap-3">
          <Link href="/" className="mm-btn mm-btn-primary w-full text-center">
            להיכנס ל-MATY MUSIC
          </Link>
          <Link href="/date" className="mm-btn w-full text-center">
            להמשיך ל-MATY DATE
          </Link>
        </div>
      </div>
    </div>
  );
}
