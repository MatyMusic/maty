"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session) {
    return (
      <div className="flex items-center gap-2">
        {session.user?.image ? (
          // תמונת פרופיל
          <img
            src={session.user.image}
            alt={session.user?.name ?? "user"}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          // פלייסהולדר עגול אם אין תמונה
          <div className="h-8 w-8 rounded-full bg-gray-300" />
        )}
        <span className="font-medium truncate max-w-[160px]" title={session.user?.name ?? ""}>
          {session.user?.name ?? "משתמש"}
        </span>
        <button onClick={() => signOut()}>התנתק</button>
      </div>
    );
  }

  // התחברות עם חזרה הביתה (שנה לנתיב שלך אם צריך)
  return (
    <button onClick={() => signIn("google", { callbackUrl: "/" })}>
      התחבר עם Google
    </button>
  );
}
