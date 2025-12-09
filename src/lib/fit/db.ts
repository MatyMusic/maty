// src/lib/fit/db.ts
import mongoose from "mongoose";

/**
 * תיעדוף ENV:
 *  useNigunim=false  -> MONGODB_URI + (אופציונלי) MONGODB_DB
 *  useNigunim=true   -> MONGODB_URI_NIGUNIM + (אופציונלי) MONGODB_DB_NIGUNIM
 *
 * במידה וה-URI כולל שם DB בנתיב (path), זה גובר; אחרת ניקח מה-ENV של ה-DB.
 */

type ConnectOpts = {
  useNigunim?: boolean;
  overrideDbName?: string; // עדיפות עליונה אם סופק
  log?: boolean;           // הדפסה נקייה בעת התחברות
  poolSize?: number;       // maxPoolSize
  serverSelectionTimeoutMS?: number;
};

// מחזור חיבור בין HMR/רענונים של Next.js (Node only)
declare global {
  // eslint-disable-next-line no-var
  var __MONGOOSE_PROMISE__: Promise<typeof mongoose> | null | undefined;
  // eslint-disable-next-line no-var
  var __MONGOOSE_CONN__: typeof mongoose | null | undefined;
}

const g = global as typeof global & {
  __MONGOOSE_PROMISE__?: Promise<typeof mongoose> | null;
  __MONGOOSE_CONN__?: typeof mongoose | null;
};

function pickMongoEnv(useNig: boolean) {
  const uri = useNig ? process.env.MONGODB_URI_NIGUNIM : process.env.MONGODB_URI;
  const dbEnv = useNig ? process.env.MONGODB_DB_NIGUNIM : process.env.MONGODB_DB;
  return { uri, dbEnv };
}

function resolveDbNameFromUri(uri: string): string | undefined {
  try {
    const u = new URL(uri);
    const path = (u.pathname || "").replace(/^\/+/, ""); // בלי /
    return path || undefined;
  } catch {
    return undefined;
  }
}

function sanitizeForLog(uri: string, dbName?: string) {
  try {
    const u = new URL(uri);
    const host = u.host;
    const db = dbName ?? resolveDbNameFromUri(uri) ?? "(no-db)";
    return `${host}/${db}`;
  } catch {
    return "(invalid-uri)";
  }
}

export async function connectMongo(opts: ConnectOpts = {}) {
  if (g.__MONGOOSE_CONN__) return g.__MONGOOSE_CONN__;

  const useNig = !!opts.useNigunim;
  const { uri, dbEnv } = pickMongoEnv(useNig);

  if (!uri) {
    const which = useNig ? "MONGODB_URI_NIGUNIM" : "MONGODB_URI";
    throw new Error(`Missing ${which} (.env.local)`);
  }

  // קביעת dbName: override > מה-URI > מה-ENV > undefined (ניתן במפורש ב-URI)
  const dbName =
    opts.overrideDbName || resolveDbNameFromUri(uri) || dbEnv || undefined;

  mongoose.set("strictQuery", true);

  const promise =
    g.__MONGOOSE_PROMISE__ ||
    mongoose.connect(uri, {
      dbName,
      maxPoolSize: opts.poolSize ?? 10,
      serverSelectionTimeoutMS: opts.serverSelectionTimeoutMS ?? 15000,
      // אפשר להרחיב כאן אפשרויות במידת הצורך (appName מגיע מה-URI שלך כבר)
    });

  g.__MONGOOSE_PROMISE__ = promise;
  g.__MONGOOSE_CONN__ = await promise;

  if (opts.log !== false) {
    // לוג נקי בלי סיסמאות
    console.log("✅ Mongo connected:", sanitizeForLog(uri, dbName));
  }

  return g.__MONGOOSE_CONN__!;
}

/** אופציונלי: סגירה מסודרת (לסקריפטים) */
export async function closeMongo() {
  if (g.__MONGOOSE_CONN__) {
    await g.__MONGOOSE_CONN__.disconnect();
    g.__MONGOOSE_CONN__ = null;
    g.__MONGOOSE_PROMISE__ = null;
    console.log("🛑 Mongo disconnected");
  }
}
