import { NextResponse } from "next/server";

function withTimeout<T>(p: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export async function GET() {
  const basePort = Number(process.env.SOCKET_PORT || 4002);
  const candidates = [basePort, basePort + 1, basePort + 2];

  for (const port of candidates) {
    try {
      const res = await withTimeout(
        fetch(`http://localhost:${port}/health`, { cache: "no-store" }),
        500
      );
      if (res.ok) {
        return NextResponse.json({
          ok: true,
          url: `http://localhost:${port}`,
          wsPath: "/", // ברירת מחדל
          port,
        });
      }
    } catch {}
  }
  return NextResponse.json(
    { ok: false, error: "socket_unavailable" },
    { status: 503 }
  );
}
