// src/app/api/jam/groups/[id]/members/route.ts

import db from "@/lib/mongoose";
import { getOnlineMapForUsers } from "@/lib/presence"; // נוסיף בשלב 2
import type { JamRole } from "@/models/JamMembership";
import { JamMembership } from "@/models/JamMembership";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

type JamMemberLite = {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: JamRole;
  instruments?: string[];
  skillLevel?: string;
  city?: string;
  gearNotes?: string;
  jamCount?: number;
  isOnline?: boolean;
};

export async function GET(
  req: NextRequest,
  context: { params: { id: string } },
) {
  await db; // לוודא חיבור ל־Mongo
  const { id: groupId } = context.params;

  try {
    console.log("[JAM MEMBERS API] group:", groupId);

    const url = new URL(req.url);
    const withPresence = url.searchParams.get("withPresence") === "1";

    // ----- 1. מביאים חברות מהקבוצה -----
    const memberships = await JamMembership.find({ groupId }).lean();

    if (!memberships.length) {
      return NextResponse.json(
        { ok: true, items: [] as JamMemberLite[] },
        { status: 200 },
      );
    }

    const userIds = memberships.map((m) => m.userId);

    // ----- 2. מביאים משתמשים -----
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id name image city gearNotes jamCount")
      .lean();

    const userMap = new Map<string, any>();
    for (const u of users) {
      userMap.set(String(u._id), u);
    }

    // ----- 3. נוכחות (Presence) -----
    let onlineMap: Record<string, boolean> = {};
    if (withPresence) {
      onlineMap = await getOnlineMapForUsers(userIds);
    }

    // ----- 4. בניית RESPONSE -----
    const items: JamMemberLite[] = memberships.map((m) => {
      const u = userMap.get(m.userId);
      const displayName =
        (u?.name as string) || (u?.email as string) || "משתמש ללא שם";

      return {
        userId: m.userId,
        displayName,
        avatarUrl: (u?.image as string) || undefined,
        role: m.role,
        instruments: m.instruments || [],
        skillLevel: m.skillLevel || undefined,
        city: (u?.city as string) || undefined,
        gearNotes: (u?.gearNotes as string) || undefined,
        jamCount: typeof u?.jamCount === "number" ? u.jamCount : undefined,
        isOnline: onlineMap[m.userId] ?? false,
      };
    });

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (err: any) {
    console.error("[JAM MEMBERS API] ERROR", err);
    return NextResponse.json(
      {
        ok: false,
        error: "SERVER_ERROR",
        message: err?.message || "שגיאת שרת",
      },
      { status: 500 },
    );
  }
}
