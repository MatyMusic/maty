// מתאם קטן שממפה את הקליינט הקיים שלך לפונקציה getMongoClient
import type { MongoClient } from "mongodb";

// 👇 עדכן את הנתיב לפי איפה שהקובץ שלך יושב (הקוד ששלחת)
import clientPromise from "@/lib/mongodb";
// למשל אם שמך הוא "@/lib/mongo.ts" או "@/lib/db/mongo.ts" — תעדכן את הנתיב פה.

export async function getMongoClient(
  _key = "default",
  _uri?: string
): Promise<MongoClient> {
  return await clientPromise;
}




