// src/app/api/presence/stream/route.ts
import { addSseClient, getOnlineCount } from "@/lib/liveStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      function send(obj: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      }
      const remove = addSseClient(send);

      // שליחת keepalive
      const iv = setInterval(() => {
        send({ type: "keep", online: getOnlineCount() });
      }, 15_000);

      // נציג התחברות מיידית
      send({ type: "init", online: getOnlineCount() });

      controller.enqueue(encoder.encode(":ok\n\n")); // comment line to open stream

      return () => {
        clearInterval(iv);
        remove();
      };
    },
    cancel() {
      // הניקוי מתבצע ב-return שב-start
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
