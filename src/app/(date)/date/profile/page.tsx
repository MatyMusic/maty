// src/app/(date)/date/profile/page.tsx
// שים לב: זה קובץ Server Component (אין "use client" כאן)

import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import { redirect } from "next/navigation";
import DateProfileForm from "@/components/maty-date/DateProfileForm";
import { getProfile } from "@/lib/db/date-repo";

export const metadata = { title: "הפרופיל שלי — MATY-DATE" };

// דף אסינכרוני תקני ב-App Router (Next 15)
export default async function Page() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    redirect("/login?next=/date/profile");
  }

  const userId = String(session.user.id);
  const profile = await getProfile(userId); // null אם אין

  // הכנת פרופס לטופס ה-Client
  const initialProfile = profile
    ? {
        displayName: profile.displayName ?? null,
        birthDate: profile.birthDate ?? null, // "YYYY-MM-DD"
        gender: (profile.gender ?? null) as any,

        country: profile.country ?? null,
        city: profile.city ?? null,
        languages: Array.isArray(profile.languages) ? profile.languages : [],

        judaism_direction: profile.judaism_direction ?? null,
        kashrut_level: profile.kashrut_level ?? null,
        shabbat_level: profile.shabbat_level ?? null,

        goals: (profile.goals ?? null) as any,

        about_me: profile.about_me ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        photos: Array.isArray(profile.photos) ? profile.photos : [],
      }
    : {};

  return (
    <main dir="rtl" className="mx-auto max-w-5xl p-4">
      {/* DateProfileForm הוא Client Component עם "use client" ולכן אפשר לרנדר אותו כאן */}
      <DateProfileForm initialProfile={initialProfile} />
    </main>
  );
}
