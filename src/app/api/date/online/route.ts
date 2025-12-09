// src/app/api/date/online/route.ts
import { searchMatches } from "@/lib/db/date-repo";
import { NextResponse } from "next/server";

// אם יש לך authOptions במקום אחר – תתאים את הנתיב הזה
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

function oneLinerFromProfile(p: any): string {
  const parts: string[] = [];

  if (p.goals === "marriage") parts.push("מחפש/ת קשר רציני");
  else if (p.goals === "serious") parts.push("מחפש/ת היכרות משמעותית");
  else if (p.goals === "friendship") parts.push("פתוח/ה לחברות חדשה");

  if (p.judaism_direction)
    parts.push(`כיוון יהדות: ${String(p.judaism_direction)}`);

  if (p.city) parts.push(p.city);
  else if (p.country) parts.push(p.country);

  if (!parts.length) return "מחובר/ת עכשיו ב-MATY-DATE.";
  return parts.join(" · ");
}

export async function GET(req: Request) {
  // אפשר למשוך פרמטר limit מה־URL אם תרצה
  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit") || "24");
  const limit = Math.min(Math.max(limitParam, 6), 48);

  // TODO (אופציונלי): להוציא userId מה-session ולהעביר כ-excludeUserId
  // const session = await getServerSession(authOptions);
  // const meId = (session as any)?.user?.id as string | undefined;

  const { items } = await searchMatches({
    limit,
    onlineOnly: true, // רק מי שמסומנים online:true ב-date_profiles
    hasPhoto: true, // לפחות תמונה / אווטאר
    // excludeUserId: meId, // אם תוציא userId מה־session
  });

  // נהפוך למבנה פשוט לקרוסלה
  const users = items.map((p) => {
    const avatar = (p.photos && p.photos[0]) || p.avatarUrl || null;

    return {
      id: p.userId,
      name: p.displayName || "משתמש/ת",
      age: p.age ?? null,
      city: p.city ?? null,
      country: p.country ?? null,
      avatarUrl: avatar,
      judaism_direction: p.judaism_direction ?? null,
      goals: p.goals ?? null,
      online: !!p.online,
      oneLiner: oneLinerFromProfile(p),
    };
  });

  return NextResponse.json(
    {
      ok: true,
      users,
    },
    { status: 200 },
  );
}
