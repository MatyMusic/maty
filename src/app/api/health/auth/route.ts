// src/app/api/health/auth/route.ts
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    return Response.json({
      ok: true,
      authenticated: !!session,
      user: session?.user || null,
    });
  } catch (e: any) {
    console.error("[health/auth] ERROR:", e?.message, e);
    return new Response(JSON.stringify({ ok: false, error: e?.message }), {
      status: 500,
    });
  }
}
