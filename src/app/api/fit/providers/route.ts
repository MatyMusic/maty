export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { listProviders } from "@/lib/fit/aggregate";

export async function GET() {
  const providers = await listProviders();
  return Response.json(
    { ok: true, providers },
    { headers: { "Cache-Control": "no-store" } },
  );
}
