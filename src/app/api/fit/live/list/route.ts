// src/app/api/fit/live/list/route.ts
import { NextResponse } from "next/server";

type LiveItem = {
  id: string;
  userName: string;
  areaName?: string;
  kind: "public" | "one_to_one";
  startedAt: string;
};

export async function GET() {
  const now = new Date();
  const iso = (m: number) =>
    new Date(now.getTime() - m * 60 * 1000).toISOString();

  const items: LiveItem[] = [
    {
      id: "demo1",
      userName: "MATY – חזה וכתפיים לייב",
      areaName: "מודיעין – בולם 6",
      kind: "public",
      startedAt: iso(5),
    },
    {
      id: "demo2",
      userName: "אימון גב ובטן – אונליין",
      areaName: "נתניה",
      kind: "public",
      startedAt: iso(17),
    },
    {
      id: "demo3",
      userName: "התייעצות 1 על 1 – בניית תוכנית",
      areaName: "זום",
      kind: "one_to_one",
      startedAt: iso(32),
    },
  ];

  return NextResponse.json({ ok: true, items });
}
