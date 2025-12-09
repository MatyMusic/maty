"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthButtons() {
  const { data, status } = useSession();
  const user = data?.user;

  if (status === "loading") {
    return <div className="opacity-70 text-sm">טוען…</div>;
  }

  if (!user) {
    return (
      <div className="flex gap-2">
        <Link href="/auth/signin" className="btn">התחבר</Link>
        <Link href="/auth/signup" className="btn">הרשמה</Link>
        {/* או להתחבר מיידית עם גוגל:
        <button className="btn" onClick={()=>signIn("google", { callbackUrl: "/dashboard" })}>
          Google
        </button> */}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/dashboard" className="btn">הדשבורד שלי</Link>
      <button className="btn" onClick={() => signOut({ callbackUrl: "/" })}>התנתק</button>
    </div>
  );
}
