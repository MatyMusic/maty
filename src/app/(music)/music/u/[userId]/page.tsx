// src/app/(music)/music/u/[userId]/page.tsx
import { getProfile } from "@/lib/db/date-repo";
import { notFound } from "next/navigation";

export const metadata = { title: "פרופיל מוזיקלי — MATY MUSIC" };

export default async function Page(props: any) {
  // Next 15: params הוא Promise, אז צריך לחלץ אותו עם await
  const rawParams: any = await (props as any).params;
  const userId = String(rawParams?.userId ?? "");

  // בינתיים משתמשים בפרופיל של MATY-DATE רק בשביל שם/אווטאר
  const doc: any = await getProfile(userId);
  if (!doc) {
    notFound();
  }

  const canShow = (doc.datePublic || "dating-only") === "everyone";
  const name = doc.displayName || "—";
  const avatar = doc.avatarUrl || "/icon-192.png";

  return (
    <main dir="rtl" className="mx-auto max-w-3xl p-4 grid gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">פרופיל מוזיקלי</h1>
        <a
          href="/"
          className="rounded-full h-10 px-4 grid place-items-center text-sm font-semibold bg-white/80 dark:bg-neutral-900/80 border border-black/10 dark:border-white/10"
        >
          דף הבית
        </a>
      </header>

      {canShow ? (
        <article className="rounded-3xl border border-black/10 dark:border-white/10 overflow-hidden bg-white/80 dark:bg-neutral-900/70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar}
            alt={name}
            className="w-full aspect-[3/2] object-cover"
          />
          <div className="p-4">
            <h2 className="text-lg font-semibold">{name}</h2>
            <p className="text-sm text-neutral-500 mt-1">
              המוזיקה המחברת — הפרופיל הציבורי שלך.
            </p>
            {/* בעתיד: ז׳אנרים אהובים, פלייליסטים, סטטיסטיקות וכו׳ */}
          </div>
        </article>
      ) : (
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 text-sm">
          פרופיל מוזיקלי לא זמין לצפייה ציבורית.
        </div>
      )}
    </main>
  );
}
