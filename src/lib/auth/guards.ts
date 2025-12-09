// src/lib/auth/currentUserId.ts
import { cookies } from "next/headers";

export async function getCurrentUserId(): Promise<string | null> {
  // ב-Next 15 cookies() היא async
  const store = await cookies();

  const mmUid = store.get("mm_uid")?.value;
  const userId = store.get("userId")?.value;

  return mmUid || userId || null;
}
// ==== STUBS SAFE ====

export async function isSiteAdmin(..._args: any[]): Promise<boolean> {
  // בהמשך תעשה פה לוגיקה אמיתית
  return false;
}

export async function requireUser(..._args: any[]): Promise<void> {
  // כרגע לא זורק כלום כדי שלא ישבור routes
  return;
}

export async function getSessionUser(..._args: any[]): Promise<any | null> {
  return null;
}
