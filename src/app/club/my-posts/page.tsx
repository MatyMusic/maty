// src/app/club/my-posts/page.tsx
import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { type ClubPost } from "@/lib/clubStore";
import MyPostsClient from "./MyPostsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "הפוסטים שלי — MATY CLUB",
};

async function fetchMyPosts(uid: string): Promise<ClubPost[]> {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/club/posts?status=all&authorId=${encodeURIComponent(uid)}`;

  // שמירה על קוקיז אוטומטית (same-origin). אם יש NEXT_PUBLIC_BASE_URL, תוודא שהוא לא מצביע לדומיין אחר.
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    // אם אתה עובד על דום אחר, אפשר להעביר מזהה גם בכותרת:
    headers: { "x-mm-uid": uid },
  });

  if (!res.ok) {
    // לא מפיל את הדף, פשוט מחזיר ריק
    return [];
  }
  const json = await res.json();
  return Array.isArray(json?.items) ? (json.items as ClubPost[]) : [];
}

export default async function MyPostsPage() {
  const ck = await cookies();
  const uid = ck.get("mm_uid")?.value || "";

  // אם אין UID — נציג הודעה לעידוד התחברות
  if (!uid) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6" dir="rtl">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold">הפוסטים שלי</h1>
          <nav className="flex items-center gap-2">
            <Link
              href="/club"
              className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              ← חזרה לפיד
            </Link>
            <Link
              href="/club/compose"
              className="rounded-xl bg-violet-600 text-white px-3 py-2 text-sm hover:brightness-110"
            >
              + כתיבת פוסט
            </Link>
          </nav>
        </header>

        <section className="mt-6">
          <div className="rounded-2xl border dark:border-white/10 p-4">
            נראה שאין מזהה משתמש (mm_uid). יש להתחבר כדי לראות פוסטים שפרסמת.
          </div>
        </section>
      </main>
    );
  }

  const items = await fetchMyPosts(uid);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6" dir="rtl">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold">הפוסטים שלי</h1>
        <nav className="flex items-center gap-2">
          <Link
            href="/club"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            ← חזרה לפיד
          </Link>
          <Link
            href="/club/compose"
            className="rounded-xl bg-violet-600 text-white px-3 py-2 text-sm hover:brightness-110"
          >
            + כתיבת פוסט
          </Link>
        </nav>
      </header>

      <section className="mt-4">
        {/* Client component למסננים/אינטרקציה קלה */}
        <MyPostsClient initialItems={items} />
      </section>
    </main>
  );
}
