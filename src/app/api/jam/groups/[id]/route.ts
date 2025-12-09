// src/app/api/jam/groups/[id]/route.ts

import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getJamCollections, normalizeId } from "@/lib/jam/db";
import type { JamGroup, JamMembership } from "@/lib/jam/types";

/**
 * GET /api/jam/groups/:id
 * מחזיר פרטי קבוצה + קצת מידע על חברות המשתמש
 */
export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? String(session.user.id) : null;

    const groupId = ctx.params.id;
    const { groups, memberships } = await getJamCollections();

    let _id: ObjectId;
    try {
      _id = new ObjectId(groupId);
    } catch {
      return NextResponse.json(
        { ok: false, error: "BAD_ID", message: "מזהה קבוצה לא תקין" },
        { status: 400 },
      );
    }

    const doc = await groups.findOne({ _id });
    if (!doc) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND", message: "הקבוצה לא נמצאה" },
        { status: 404 },
      );
    }

    let membership: JamMembership | null = null;
    if (userId) {
      const memDoc = await memberships.findOne({
        groupId: String(_id),
        userId,
      });
      if (memDoc) {
        const { _id: mid, ...rest } = memDoc as any;
        membership = { ...rest, _id: String(mid) };
      }
    }

    return NextResponse.json({
      ok: true,
      item: normalizeId<JamGroup & { _id: any }>(doc),
      membership,
      isOwner: userId ? doc.ownerId === userId : false,
      isAdmin: userId ? doc.adminIds?.includes(userId) : false,
    });
  } catch (err) {
    console.error("[JAM.GROUP.GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: "שגיאה בטעינת הקבוצה" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/jam/groups/:id
 * עדכון בסיסי לקבוצה (שם, תיאור, עיר, טאגים...)
 * רק owner / admin
 */
export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED", message: "חובה להתחבר" },
        { status: 401 },
      );
    }

    const userId = String(session.user.id);
    const groupId = ctx.params.id;

    const { groups } = await getJamCollections();

    let _id: ObjectId;
    try {
      _id = new ObjectId(groupId);
    } catch {
      return NextResponse.json(
        { ok: false, error: "BAD_ID", message: "מזהה קבוצה לא תקין" },
        { status: 400 },
      );
    }

    const doc = await groups.findOne({ _id });
    if (!doc) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND", message: "הקבוצה לא נמצאה" },
        { status: 404 },
      );
    }

    const isAdmin =
      doc.ownerId === userId || (doc.adminIds || []).includes(userId);
    if (!isAdmin) {
      return NextResponse.json(
        {
          ok: false,
          error: "FORBIDDEN",
          message: "רק בעלים/אדמין הקבוצה יכולים לערוך",
        },
        { status: 403 },
      );
    }

    const payload = await req.json();

    const update: any = { updatedAt: new Date().toISOString() };

    if (typeof payload.title === "string") update.title = payload.title.trim();
    if (typeof payload.description === "string")
      update.description = payload.description.trim();
    if (typeof payload.city === "string") update.city = payload.city.trim();
    if (Array.isArray(payload.genres)) update.genres = payload.genres;
    if (Array.isArray(payload.tags)) update.tags = payload.tags;
    if (Array.isArray(payload.purposes)) update.purposes = payload.purposes;
    if (Array.isArray(payload.daws)) update.daws = payload.daws;
    if (Array.isArray(payload.skillsWanted))
      update.skillsWanted = payload.skillsWanted;
    if (typeof payload.isOpen === "boolean") update.isOpen = payload.isOpen;
    if (["public", "private", "unlisted"].includes(payload.visibility)) {
      update.visibility = payload.visibility;
    }

    await groups.updateOne({ _id }, { $set: update });

    const updated = await groups.findOne({ _id });

    return NextResponse.json({
      ok: true,
      item: updated ? normalizeId(updated) : null,
    });
  } catch (err) {
    console.error("[JAM.GROUP.PATCH] error:", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: "שגיאה בעדכון הקבוצה" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/jam/groups/:id
 * body: { action: "join" | "leave" }
 * הצטרפות / עזיבה של קבוצה
 */
export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED", message: "חובה להתחבר" },
        { status: 401 },
      );
    }

    const userId = String(session.user.id);
    const groupId = ctx.params.id;
    const { groups, memberships } = await getJamCollections();

    let _id: ObjectId;
    try {
      _id = new ObjectId(groupId);
    } catch {
      return NextResponse.json(
        { ok: false, error: "BAD_ID", message: "מזהה קבוצה לא תקין" },
        { status: 400 },
      );
    }

    const payload = await req.json();
    const action = payload?.action as "join" | "leave" | undefined;

    if (!action || !["join", "leave"].includes(action)) {
      return NextResponse.json(
        {
          ok: false,
          error: "BAD_REQUEST",
          message: "חייבים לציין action: join/leave",
        },
        { status: 400 },
      );
    }

    const group = await groups.findOne({ _id });
    if (!group) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND", message: "הקבוצה לא נמצאה" },
        { status: 404 },
      );
    }

    if (action === "join") {
      if (!group.isOpen && group.visibility !== "public") {
        return NextResponse.json(
          {
            ok: false,
            error: "CLOSED",
            message: "הקבוצה סגורה להצטרפות חופשית",
          },
          { status: 403 },
        );
      }

      const existing = await memberships.findOne({
        groupId: String(_id),
        userId,
      });
      if (existing) {
        return NextResponse.json({
          ok: true,
          message: "כבר חבר בקבוצה",
        });
      }

      const now = new Date().toISOString();
      const membership: JamMembership = {
        userId,
        groupId: String(_id),
        role: group.ownerId === userId ? "owner" : "member",
        instruments:
          payload.instruments && Array.isArray(payload.instruments)
            ? payload.instruments
            : [],
        skillLevel: payload.skillLevel,
        note: payload.note,
        joinedAt: now,
      };

      await memberships.insertOne(membership as any);
      await groups.updateOne({ _id }, { $inc: { memberCount: 1 } });

      return NextResponse.json({
        ok: true,
        message: "הצטרפת לקבוצה",
      });
    }

    if (action === "leave") {
      // לא מאפשרים לבעלים היחיד לצאת
      if (group.ownerId === userId) {
        return NextResponse.json(
          {
            ok: false,
            error: "OWNER_CANNOT_LEAVE",
            message: "בעל הקבוצה לא יכול לצאת לפני שמעביר בעלות",
          },
          { status: 400 },
        );
      }

      const res = await memberships.deleteOne({ groupId: String(_id), userId });
      if (res.deletedCount > 0) {
        await groups.updateOne({ _id }, { $inc: { memberCount: -1 } });
      }

      return NextResponse.json({
        ok: true,
        message: "יצאת מהקבוצה",
      });
    }

    return NextResponse.json(
      { ok: false, error: "UNKNOWN_ACTION", message: "פעולה לא מוכרת" },
      { status: 400 },
    );
  } catch (err) {
    console.error("[JAM.GROUP.POST(action)] error:", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: "שגיאה בפעולת הקבוצה" },
      { status: 500 },
    );
  }
}
