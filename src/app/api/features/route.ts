// src/app/api/features/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  // בדיקת משתמש אדמין (דרך session או cookie)
  const session = await getServerSession(authConfig as any);
  const user: any = session?.user;
  const role = user?.role || null;
  let isAdmin = false;
  if (role === "admin" || role === "superadmin") {
    isAdmin = true;
  } else {
    const cookieStore = cookies();
    const roleCookie = cookieStore.get("mm_role")?.value || "";
    if (roleCookie === "admin" || roleCookie === "superadmin") {
      isAdmin = true;
    }
  }

  // אם המשתמש אדמין – כל הפיצ'רים פתוחים
  if (isAdmin) {
    return NextResponse.json({
      ok: true,
      canUseChat: true,
      canUseVideo: true,
      canAccessPremium: true,
    });
  }

  // דורש משתמש מחובר עבור שאר המקרים
  if (!user || !user.email) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();
    // שליפת נתוני המשתמש מהמסד (לבדיקת מנוי)
    const email = (user.email as string).toLowerCase();
    const userDoc: any = await User.findOne({ email });
    const sub = userDoc?.subscription; // אובייקט המנוי (אם קיים)
    const status = sub?.status || "inactive";
    const tier = sub?.tier || "free";

    // קביעת הרשאות ברירת מחדל (למשתמש ללא מנוי פעיל)
    let canUseChat = false;
    let canUseVideo = false;
    let canAccessPremium = false;

    if (status === "active") {
      // למנוי פעיל – קביעת הרשאות לפי tier
      if (tier === "plus") {
        canUseChat = true; // PLUS מאפשר שליחת הודעות
        canUseVideo = false;
      } else if (tier === "pro" || tier === "vip") {
        canUseChat = true;
        canUseVideo = true;
      }
      canAccessPremium = tier !== "free"; // כל מנוי בתשלום נחשב premium
    }

    return NextResponse.json({
      ok: true,
      canUseChat,
      canUseVideo,
      canAccessPremium,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "failed" },
      { status: 500 },
    );
  }
}
