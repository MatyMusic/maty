import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db/mongo-client";

export async function GET() {
  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_DB as string);

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const rows = await db
    .collection("plays")
    .aggregate([
      { $match: { at: { $gte: since } } },
      { $group: { _id: "$trackId", plays: { $sum: 1 } } },
      { $sort: { plays: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "tracks",
          localField: "_id",
          foreignField: "_id",
          as: "t",
        },
      },
      { $unwind: "$t" },
      {
        $match: {
          "t.youtube.id": { $exists: true, $ne: "" },
          "t.isDisabled": { $ne: true },
          "t.published": { $ne: false },
        },
      },
      {
        $project: {
          _id: 0,
          id: { $toString: "$t._id" },
          title: "$t.title",
          artist: "$t.artist",
          coverUrl: "$t.coverUrl",
          youtube: "$t.youtube",
          genres: "$t.genres",
          plays: 1,
        },
      },
    ])
    .toArray();

  return NextResponse.json({ items: rows });
}
