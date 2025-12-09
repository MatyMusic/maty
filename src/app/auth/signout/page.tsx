"use client";

import { signOut } from "next-auth/react";

export default function SignOutPage() {
  function handleSignOut() {
    // מנקה זיכרון מקומי אם נשמר שם אווטאר / ז'אנר
    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedAvatar");
      localStorage.removeItem("preferredGenres");
      localStorage.removeItem("lastPlayedGenre");
    }

    // מתנתק ומחזיר לדף הבית
    signOut({ callbackUrl: "/" });
  }

  return (
    <main className="container-section section-padding text-center">
      <h1 className="text-2xl font-bold mb-3">להתנתק?</h1>
      <button
        className="btn bg-brand text-white border-0 px-6 py-2 rounded-lg hover:opacity-90"
        onClick={handleSignOut}
      >
        התנתק
      </button>
    </main>
  );
}
