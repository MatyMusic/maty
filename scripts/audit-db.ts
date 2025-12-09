import "dotenv/config";
import { MongoClient } from "mongodb";

async function run() {
  const uri = process.env.MONGODB_URI!;
  const client = await new MongoClient(uri).connect();
  const db = client.db(process.env.MONGODB_DB);
  console.log("[db name]:", db.databaseName);

  const cols = await db.listCollections().toArray();
  for (const c of cols) {
    const name = c.name;
    const count = await db.collection(name).countDocuments();
    console.log(`- ${name}: ${count}`);

    const sample = await db
      .collection(name)
      .find({}, { projection: { _id: 0 } })
      .limit(3)
      .toArray();
    if (sample.length) {
      const keys = Object.keys(
        sample.reduce((acc, doc) => {
          Object.keys(doc).forEach((k) => (acc[k] = true));
          return acc;
        }, {} as any)
      );
      console.log(
        `  keys: ${keys.slice(0, 25).join(", ")}${keys.length > 25 ? " …" : ""}`
      );
    }
  }

  await client.close();
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
