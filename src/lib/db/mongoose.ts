
// src/lib/db/mongoose.ts
import mongoose from "mongoose";
const URI = process.env.MONGODB_URI || "";
const DB = process.env.MONGODB_DB || "maty-music";

declare global {
  // eslint-disable-next-line no-var
  var __mongoose_conn__: Promise<typeof mongoose> | undefined;
}

export default async function connectDB(): Promise<typeof mongoose> {
  if (!URI) throw new Error("Missing MONGODB_URI");
  if (mongoose.connection.readyState === 1) return mongoose;

  if (!global.__mongoose_conn__) {
    global.__mongoose_conn__ = mongoose
      .connect(URI, {
        dbName: DB,
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10,
      })
      .catch((e) => {
        global.__mongoose_conn__ = undefined;
        throw e;
      });
  }
  return await global.__mongoose_conn__;
}
