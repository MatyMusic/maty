export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  const hash = process.env.ADMIN_BYPASS_HASH;
  const secret = process.env.BYPASS_SECRET;

  return NextResponse.json(
    {
      ok: true,
      node: process.version,
      // האם נטען בכלל
      hasHash: !!hash,
      hashLen: hash?.length ?? null,
      hashPrefix: hash ? hash.slice(0, 7) : null, // אמור להיות משהו כמו `$2b$12`
      hasSecret: !!secret,
      secretLen: secret?.trim()?.length ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  const hash = process.env.ADMIN_BYPASS_HASH || "";
  let match = false,
    err: string | undefined;
  try {
    match = !!password && !!hash && (await bcrypt.compare(password, hash));
  } catch (e: any) {
    err = e?.message || "compare_failed";
  }
  return NextResponse.json(
    {
      ok: true,
      envHasHash: !!hash,
      testedPasswordLen: (password || "").length,
      match,
      err: err || null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
