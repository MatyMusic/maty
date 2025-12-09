import mongoose from "mongoose";

/** מנרמל URI */
function normalizeUri(raw: string): string {
  const trimmed = raw.replace(/^["']|["']$/g, "").trim();
  if (!trimmed) throw new Error("Missing MONGODB_URI env var");
  const u = new URL(trimmed);
  if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
    if (!u.searchParams.has("directConnection"))
      u.searchParams.set("directConnection", "true");
  }
  // @ts-ignore - Node 20+
  u.searchParams.sort?.();
  return u.toString();
}

const URI = normalizeUri(process.env.MONGODB_URI || "");
const DB_NAME = process.env.MONGODB_DB || "maty-music";

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  uri?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __MONGOOSE__: Cached | undefined;
}

const g = globalThis as any;
if (!g.__MONGOOSE__)
  g.__MONGOOSE__ = { conn: null, promise: null, uri: undefined } as Cached;
const cached: Cached = g.__MONGOOSE__;

mongoose.set("strictQuery", true);

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.uri = URI;
    const autoIndex = process.env.NODE_ENV !== "production";
    cached.promise = mongoose
      .connect(URI, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10_000,
        connectTimeoutMS: 10_000,
        autoIndex,
        dbName: DB_NAME,
      } as any)
      .then((m) => {
        console.log(
          "[mongoose] connected:",
          m.connection?.db?.databaseName || "(unknown)"
        );
        return m;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;




