import { cookies } from "next/headers";

/**
 * ⚠️ חשוב:
 * כרגע זה מנסה לקרוא מזהים פשוטים מה־cookies.
 * אתה יכול להחליף את זה ל-NextAuth / JWT / מה שיש לך באמת.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const jar = cookies();
  const fromUid = jar.get("mm_uid")?.value;
  const fromUser = jar.get("userId")?.value;

  const val = fromUid || fromUser || null;
  if (!val) return null;

  return String(val);
}
