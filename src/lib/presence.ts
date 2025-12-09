// src/lib/presence.ts
import db from "@/lib/mongoose";
import { UserPresence } from "@/models/UserPresence";

/**
 * נקרא מה-frontend פעם בכמה שניות / בזמן פעילות,
 * ומעדכן שהמשתמש חי.
 */
export async function touchPresence(userId: string, area?: string) {
  if (!userId) return;
  await db;

  await UserPresence.findOneAndUpdate(
    { userId, area: area || null },
    {
      $set: {
        userId,
        area: area || null,
        status: "online",
        lastSeen: new Date(),
      },
    },
    { upsert: true },
  ).lean();
}

/**
 * מחזיר מפה של userId → isOnline (boolean)
 * משתמש ב-lastSeen <= N שניות.
 */
export async function getOnlineMapForUsers(
  userIds: string[],
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  if (!userIds.length) return result;
  await db;

  const now = Date.now();
  const ONLINE_WINDOW_MS = 1000 * 60 * 3; // 3 דקות

  const docs = await UserPresence.find({
    userId: { $in: userIds },
  })
    .select("userId lastSeen status")
    .lean();

  for (const d of docs) {
    const isRecent = now - new Date(d.lastSeen).getTime() <= ONLINE_WINDOW_MS;
    const isOnline = d.status === "online" && isRecent;
    result[d.userId] = isOnline;
  }

  return result;
}
