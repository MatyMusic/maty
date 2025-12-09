// src/lib/db.ts
import { Collection, Db, MongoClient } from "mongodb";

// ---------- MongoDB (קיים) ----------

// קורא את ה-URI מתוך ה-ENV ודואג ל-trim
const MAIN_URI = (process.env.MONGODB_URI || "").trim();
const MAIN_DB = process.env.MONGODB_DB || "maty-music";

// פונקציה קטנה להסתרת הסיסמה בלוגים
function maskMongoUri(uri: string): string {
  if (!uri) return "(EMPTY)";
  try {
    const u = new URL(uri.replace("mongodb+srv://", "http://"));
    const user = u.username || "user";
    const host = u.host || "host";
    const pathname = u.pathname || "";
    return `mongodb+srv://${user}:***@${host}${pathname}`;
  } catch {
    // אם זה לא Parsed טוב – מחזירים כמו שהוא
    return uri;
  }
}

// לוג דיבאג נוח בסביבת פיתוח
if (process.env.NODE_ENV === "development") {
  console.log(
    "[DB] MONGODB_URI from env:",
    MAIN_URI ? maskMongoUri(MAIN_URI) : "(NOT SET)",
  );
  console.log("[DB] MAIN_DB from env:", MAIN_DB);
}

// קאש גלובלי של קליינטים (ל-dev/HMR)
declare global {
  // eslint-disable-next-line no-var
  var __mongoClients__: Record<string, Promise<MongoClient>> | undefined;
  // eslint-disable-next-line no-var
  var __prisma__: any | undefined;
}
if (!global.__mongoClients__) global.__mongoClients__ = {};

/**
 * מחזיר/יוצר MongoClient לפי label (לוגי) ו/או URI .
 * שימוש לדוגמה: getMongoClient("next-auth")  או  getMongoClient("main", OTHER_URI)
 */
export function getMongoClient(
  label = "main",
  uri?: string,
): Promise<MongoClient> {
  const finalUri = (uri ?? MAIN_URI).trim();
  if (!finalUri) {
    throw new Error(
      "Missing MONGODB_URI (.env.local) – ודא שהגדרת MONGODB_URI ושאתה מריץ את השרת מתיקיית הפרויקט הנכונה.",
    );
  }

  const key = `${label}:${finalUri}`;
  if (!global.__mongoClients__![key]) {
    if (process.env.NODE_ENV === "development") {
      console.log("[DB] creating new MongoClient for key:", label);
    }
    const client = new MongoClient(finalUri);
    global.__mongoClients__![key] = client.connect();
  }
  return global.__mongoClients__![key];
}

export async function getDb(
  dbName = MAIN_DB,
  label = "main",
  uri?: string,
): Promise<Db> {
  const client = await getMongoClient(label, uri);
  return client.db(dbName);
}

export async function getCollection<T = any>(
  name: string,
  dbName = MAIN_DB,
  label = "main",
  uri?: string,
): Promise<Collection<T>> {
  const db = await getDb(dbName, label, uri);
  return db.collection<T>(name);
}

// ---------- Prisma (ל-Membership/Badge ועוד) ----------

/**
 * Prisma רץ **רק** ב-Node runtime (לא Edge).
 * ודא שב-Route Handlers שמשתמשים בו הגדרת:
 *   export const runtime = "nodejs";
 */
const isEdgeRuntime = typeof (globalThis as any).EdgeRuntime !== "undefined";

let _prisma: import("@prisma/client").PrismaClient | null = null;

export function getPrisma() {
  if (isEdgeRuntime) {
    throw new Error(
      'Prisma is not supported on the Edge runtime. Set `export const runtime = "nodejs"` in this route.',
    );
  }
  if (_prisma) return _prisma;

  const { PrismaClient } =
    require("@prisma/client") as typeof import("@prisma/client");

  // סינגלטון ל-HMR
  if (!global.__prisma__) {
    global.__prisma__ = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  }
  _prisma = global.__prisma__;
  return _prisma as import("@prisma/client").PrismaClient;
}

/**
 * ייצוא נוח: `import { prisma } from "@/lib/db"`
 * הערה: אל תייבא את זה בקבצי Edge.
 */
export const prisma = (() => {
  try {
    if (isEdgeRuntime) return undefined;
    return getPrisma();
  } catch {
    return undefined;
  }
})();

// ---------- טיפוסי עזר (Mongo) לאוסף המועדון (אם תבחר לשמור במונגו) ----------

export type MembershipDoc = {
  _id?: any;
  userId: string;
  tier: "guest" | "club" | "allaccess" | "vip";
  stripeSubId?: string | null;
  status: "active" | "canceled" | "past_due";
  currentPeriodEnd?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BadgeDoc = {
  _id?: any;
  code: string; // "first-like"
  name: string;
  emoji: string;
  createdAt: Date;
};

export type UserBadgeDoc = {
  _id?: any;
  userId: string;
  badgeId: string; // ref ל-Badge._id או code, לפי איך שתגדיר
  earnedAt: Date;
};

// דוגמה לשימוש Mongo (אופציונלי):
// const membershipCol = await getCollection<MembershipDoc>("memberships");

// ➜ פונקציה מפורשת לחיבור (אפשר לקרוא בתחילת Routeים כבדים)

export async function connectDB(): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log(
      "[DB] connectDB() using URI:",
      MAIN_URI ? maskMongoUri(MAIN_URI) : "(NOT SET)",
    );
  }
  await getMongoClient("main");
}

export default connectDB;
