// src/app/(date)/date/u/[userId]/page.tsx
import authConfig from "@/auth-config";
import ProfileCard from "@/components/maty-date/ProfileCard";
import { getProfile } from "@/lib/db/date-repo";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

export const metadata = { title: "כרטיס משתמש — MATY-DATE" };

// חשוב: לא מTypings את הפרופס לפי PageProps.
// נותנים any, ובפנים מחכים ל־params (יכול להיות Promise לפי Next 15).
export default async function Page(props: any) {
  // Next 15: params לעתים הוא Promise, לעתים אובייקט רגיל.
  // await יעבוד בשני המקרים (אם זה לא Promise – הוא יחזיר את הערך כמו שהוא).
  const rawParams: any = await (props as any).params;
  const userId = String(rawParams?.userId ?? "");

  if (!userId) {
    notFound();
  }

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    redirect(`/login?next=/date/u/${userId}`);
  }

  const viewerId = String(session.user.id);

  // אם בעתיד תרצה להשתמש ב-viewerId לפרטיות, אפשר להוסיף לוגיקה כאן.
  const doc: any = await getProfile(userId);
  if (!doc) {
    notFound();
  }

  const vm = {
    displayName: doc.displayName ?? null,
    birthDate: doc.birthDate ?? null,
    city: doc.city ?? null,
    country: doc.country ?? null,
    languages: Array.isArray(doc.languages) ? doc.languages : [],
    judaism_direction: doc.judaism_direction ?? null,
    shabbat_level: doc.shabbat_level ?? null,
    kashrut_level: doc.kashrut_level ?? null,
    about_me: doc.about_me ?? null,
    avatarUrl: doc.avatarUrl ?? null,
    photos: Array.isArray(doc.photos) ? doc.photos : [],
    verified: !!doc.verified,
    online: !!doc.online,
    videoIntroUrl: doc.videoIntroUrl || null,
  };

  return (
    <main dir="rtl" className="mx-auto grid max-w-4xl gap-5 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">כרטיס משתמש</h1>
        <div className="flex gap-2">
          <a
            href="/date/matches"
            className="grid h-10 place-items-center rounded-full border border-black/10 bg-white/80 px-4 text-sm font-semibold dark:border-white/10 dark:bg-neutral-900/80"
          >
            חזרה להתאמות
          </a>
          <a
            href="/date/profile/view"
            className="grid h-10 place-items-center rounded-full bg-neutral-900 px-4 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
          >
            הפרופיל שלי
          </a>
        </div>
      </div>

      <ProfileCard p={vm} />

      {vm.videoIntroUrl && (
        <section className="grid gap-2">
          <h2 className="text-base font-semibold">🎬 סרטון היכרות</h2>
          <video
            src={vm.videoIntroUrl}
            controls
            className="w-full rounded-xl border border-black/10 dark:border-white/10"
          />
        </section>
      )}

      {vm.photos?.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-base font-semibold">תמונות</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {vm.photos.map((u: string) => (
              <li
                key={u}
                className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={u}
                  alt="photo"
                  className="aspect-square w-full object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
