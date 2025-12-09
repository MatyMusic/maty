import { NextResponse } from "next/server";

// אופציונלי: שימוש ב-next-auth אם קיים
async function getSessionSafe() {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth").catch(() => ({
      authOptions: undefined as any,
    }));
    return await getServerSession(authOptions as any);
  } catch {
    return null;
  }
}

export async function GET() {
  // נסה session קודם
  const session = await getSessionSafe();
  if (session?.user?.id) {
    return NextResponse.json({
      ok: true,
      loggedIn: true,
      userId: session.user.id as string,
    });
  }

  // פולבק ל-cookie (אם אתה משתמש בו)
  const { cookies } = await import("next/headers");
  const c = await cookies();
  const uid = c.get("mm_uid")?.value || null;

  return NextResponse.json({
    ok: true,
    loggedIn: Boolean(uid),
    userId: uid,
  });
}
