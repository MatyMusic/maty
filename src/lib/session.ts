// src/lib/session.ts
export async function getSessionServer() {
  // נסה NextAuth v5 (auth.ts בשורש הפרויקט)
  try {
    const mod: any = await import("@/auth");
    if (typeof mod.auth === "function") {
      return await mod.auth();
    }
  } catch {
    // נמשיך ל-v4
  }

  // נסה NextAuth v4 (authOptions)
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    return await getServerSession(authOptions as any);
  } catch {
    // אין סשן
  }

  return null;
}
