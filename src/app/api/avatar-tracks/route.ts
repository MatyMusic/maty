// // src/app/api/avatar-tracks/route.ts
// import { authOptions } from "@/lib/auth";
// import { MongoClient, ObjectId } from "mongodb";
// import { getServerSession } from "next-auth";
// import { NextRequest, NextResponse } from "next/server";

// export const dynamic = "force-dynamic";

// const MONGODB_URI = process.env.MONGODB_URI || "";
// const MONGODB_DB = process.env.MONGODB_DB || "maty-music";

// if (!MONGODB_URI) {
//   // חשוב: בלי זה אין DB
//   console.warn(
//     "[avatar-tracks] MONGODB_URI חסר – הנתיב לא יעבוד ללא חיבור למסד נתונים",
//   );
// }

// type AvatarTrackDoc = {
//   _id?: ObjectId;
//   avatar: string;
//   title: string;
//   url: string;
//   artist?: string;
//   cover?: string;
//   link?: string;
//   createdAt: Date;
// };

// let cachedClient: MongoClient | null = null;

// async function getCollection() {
//   if (!MONGODB_URI) {
//     throw new Error("MONGODB_URI לא מוגדר ב־env");
//   }
//   if (!cachedClient) {
//     cachedClient = await new MongoClient(MONGODB_URI).connect();
//   }
//   const db = cachedClient.db(MONGODB_DB);
//   return db.collection<AvatarTrackDoc>("avatar_tracks");
// }

// async function isAdminSession() {
//   try {
//     const session = await getServerSession(authOptions as any);
//     const role = (session as any)?.user?.role;
//     const flag = (session as any)?.user?.isAdmin === true;
//     if (role === "admin" || role === "superadmin" || flag) return true;

//     // אופציונלי: התאמה לזיהוי לפי אימייל (כמו בלייאאוט)
//     const email = (session as any)?.user?.email?.toLowerCase?.() || "";
//     const allow = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
//       .toLowerCase()
//       .split(",")
//       .map((s) => s.trim())
//       .filter(Boolean);
//     if (email && allow.includes(email)) return true;
//   } catch (err) {
//     console.error("[avatar-tracks] isAdminSession error:", err);
//   }
//   return false;
// }

// /**
//  * GET /api/avatar-tracks?avatar=XYZ
//  * מחזיר רשימת שירים לאווטאר מסוים
//  */
// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const avatar = searchParams.get("avatar") || "";

//     const col = await getCollection();
//     const query: any = {};
//     if (avatar) query.avatar = avatar;

//     const docs = await col
//       .find(query)
//       .sort({ createdAt: -1 })
//       .limit(200)
//       .toArray();

//     const tracks = docs.map((d) => ({
//       id: d._id?.toString() || "",
//       avatar: d.avatar,
//       title: d.title,
//       url: d.url,
//       artist: d.artist,
//       cover: d.cover,
//       link: d.link,
//       createdAt: d.createdAt?.toISOString?.() ?? undefined,
//     }));

//     return NextResponse.json({ tracks });
//   } catch (err: any) {
//     console.error("[avatar-tracks][GET] error:", err);
//     return NextResponse.json(
//       { error: "שגיאה בעת טעינת השירים מהשרת." },
//       { status: 500 },
//     );
//   }
// }

// /**
//  * POST /api/avatar-tracks
//  * Body JSON: { avatar, title, url, artist?, cover?, link? }
//  * רק אדמין
//  */
// export async function POST(req: NextRequest) {
//   try {
//     const isAdmin = await isAdminSession();
//     if (!isAdmin) {
//       return NextResponse.json(
//         { error: "אין הרשאה (admin בלבד)." },
//         { status: 403 },
//       );
//     }

//     const body = await req.json().catch(() => null);
//     if (!body) {
//       return NextResponse.json({ error: "Body לא תקין." }, { status: 400 });
//     }

//     const avatar = String(body.avatar || "").trim();
//     const title = String(body.title || "").trim();
//     const url = String(body.url || "").trim();
//     const artist =
//       body.artist && String(body.artist || "").trim().length > 0
//         ? String(body.artist).trim()
//         : undefined;
//     const cover =
//       body.cover && String(body.cover || "").trim().length > 0
//         ? String(body.cover).trim()
//         : undefined;
//     const link =
//       body.link && String(body.link || "").trim().length > 0
//         ? String(body.link).trim()
//         : undefined;

//     if (!avatar || !title || !url) {
//       return NextResponse.json(
//         { error: "חובה לשלוח avatar, title ו־url." },
//         { status: 400 },
//       );
//     }

//     const col = await getCollection();
//     const doc: AvatarTrackDoc = {
//       avatar,
//       title,
//       url,
//       artist,
//       cover,
//       link,
//       createdAt: new Date(),
//     };

//     const result = await col.insertOne(doc);
//     const saved: AvatarTrackDoc = { ...doc, _id: result.insertedId };

//     return NextResponse.json(
//       {
//         track: {
//           id: saved._id?.toString() || "",
//           avatar: saved.avatar,
//           title: saved.title,
//           url: saved.url,
//           artist: saved.artist,
//           cover: saved.cover,
//           link: saved.link,
//           createdAt: saved.createdAt.toISOString(),
//         },
//       },
//       { status: 201 },
//     );
//   } catch (err: any) {
//     console.error("[avatar-tracks][POST] error:", err);
//     return NextResponse.json(
//       { error: "שגיאה בעת יצירת השיר." },
//       { status: 500 },
//     );
//   }
// }

// /**
//  * DELETE /api/avatar-tracks?id=XXXX
//  * מחיקת שיר לפי id – admin בלבד
//  */
// export async function DELETE(req: NextRequest) {
//   try {
//     const isAdmin = await isAdminSession();
//     if (!isAdmin) {
//       return NextResponse.json(
//         { error: "אין הרשאה (admin בלבד)." },
//         { status: 403 },
//       );
//     }

//     const { searchParams } = new URL(req.url);
//     const id = searchParams.get("id");
//     if (!id) {
//       return NextResponse.json(
//         { error: "חסר id בשורת הכתובת." },
//         { status: 400 },
//       );
//     }

//     let oid: ObjectId;
//     try {
//       oid = new ObjectId(id);
//     } catch {
//       return NextResponse.json({ error: "id לא תקין." }, { status: 400 });
//     }

//     const col = await getCollection();
//     const res = await col.deleteOne({ _id: oid });
//     if (res.deletedCount === 0) {
//       return NextResponse.json(
//         { error: "לא נמצא מסמך למחיקה." },
//         { status: 404 },
//       );
//     }

//     return NextResponse.json({ ok: true });
//   } catch (err: any) {
//     console.error("[avatar-tracks][DELETE] error:", err);
//     return NextResponse.json(
//       { error: "שגיאה בעת מחיקת השיר." },
//       { status: 500 },
//     );
//   }
// }

// src/app/api/avatar-tracks/route.ts
import { authOptions } from "@/lib/auth";
import { MongoClient, ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB = process.env.MONGODB_DB || "maty-music";
const COLL = process.env.AVATAR_TRACKS_COLLECTION || "avatar_tracks";

const SUPERADMINS =
  (process.env.SUPERADMINS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean) || [];

let cachedClient: MongoClient | null = null;

type AvatarTrackDoc = {
  _id?: ObjectId;
  avatar: string;
  title: string;
  url: string;
  artist?: string;
  cover?: string;
  link?: string;
  createdAt?: string;
  updatedAt?: string;
};

async function getCollection() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI לא מוגדר ב־env");
  }
  if (!cachedClient) {
    cachedClient = await new MongoClient(MONGODB_URI).connect();
  }
  const db = cachedClient.db(MONGODB_DB);
  return db.collection<AvatarTrackDoc>(COLL);
}

async function isAdminSession() {
  try {
    const session = await getServerSession(authOptions as any);
    const email = (session as any)?.user?.email as string | undefined;
    if (!email) return false;
    const lower = email.toLowerCase();
    if (SUPERADMINS.includes(lower)) return true;
    // אפשר להוסיף כאן role מה-DB אם תרצה
    return false;
  } catch (err) {
    console.error("[avatar-tracks] isAdminSession error:", err);
    return false;
  }
}

/**
 * GET /api/avatar-tracks?avatar=XYZ
 * מחזיר רשימת שירים לאווטאר מסוים
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const avatar = searchParams.get("avatar") || "";

    const col = await getCollection();
    const query: any = {};
    if (avatar) query.avatar = avatar;

    const docs = await col
      .find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    const tracks = docs.map((d) => ({
      id: d._id?.toString() || "",
      avatar: d.avatar,
      title: d.title,
      url: d.url,
      artist: d.artist || "",
      cover: d.cover || "",
      link: d.link || "",
      createdAt: d.createdAt,
    }));

    return NextResponse.json({ ok: true, tracks });
  } catch (err: any) {
    console.error("[avatar-tracks][GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "שגיאה בטעינת שירי האווטאר." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/avatar-tracks
 * גוף: { avatar, title, url, artist?, cover?, link? }
 * אדמין בלבד
 */
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAdminSession();
    if (!isAdmin) {
      return NextResponse.json(
        { ok: false, error: "אין הרשאה (admin בלבד)." },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const avatar = String(body.avatar || "").trim();
    const title = String(body.title || "").trim();
    const url = String(body.url || "").trim();
    const artist = body.artist ? String(body.artist).trim() : undefined;
    const cover = body.cover ? String(body.cover).trim() : undefined;
    const link = body.link ? String(body.link).trim() : undefined;

    if (!avatar || !title || !url) {
      return NextResponse.json(
        { ok: false, error: "חובה לשלוח avatar, title ו־url." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const doc: AvatarTrackDoc = {
      avatar,
      title,
      url,
      artist,
      cover,
      link,
      createdAt: now,
      updatedAt: now,
    };

    const col = await getCollection();
    const res = await col.insertOne(doc);
    const saved = { ...doc, _id: res.insertedId };

    const docs = await col
      .find({ avatar })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();
    const tracks = docs.map((d) => ({
      id: d._id?.toString() || "",
      avatar: d.avatar,
      title: d.title,
      url: d.url,
      artist: d.artist || "",
      cover: d.cover || "",
      link: d.link || "",
      createdAt: d.createdAt,
    }));

    return NextResponse.json({ ok: true, saved, tracks });
  } catch (err: any) {
    console.error("[avatar-tracks][POST] error:", err);
    return NextResponse.json(
      { ok: false, error: "שגיאה בעת יצירת השיר." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/avatar-tracks?id=XXXX
 * מחיקת שיר לפי id – admin בלבד
 */
export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await isAdminSession();
    if (!isAdmin) {
      return NextResponse.json(
        { ok: false, error: "אין הרשאה (admin בלבד)." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "חסר id בשורת הכתובת." },
        { status: 400 },
      );
    }

    const col = await getCollection();
    const res = await col.deleteOne({ _id: new ObjectId(id) });
    if (!res.deletedCount) {
      return NextResponse.json(
        { ok: false, error: "לא נמצא מסמך למחיקה." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[avatar-tracks][DELETE] error:", err);
    return NextResponse.json(
      { ok: false, error: "שגיאה בעת מחיקת השיר." },
      { status: 500 },
    );
  }
}
