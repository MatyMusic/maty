// src/app/api/ws/route.ts
export const runtime = "edge";

type Msg =
  | { type: "join"; room: string; userId: string }
  | { type: "presence"; room: string; userId: string }
  | { type: "chat"; room: string; from: string; text: string; ts?: number }
  | {
      type: "sdp-offer" | "sdp-answer";
      room: string;
      from: string;
      to: string;
      sdp: any;
    }
  | { type: "ice"; room: string; from: string; to: string; candidate: any }
  | { type: "leave"; room: string; userId: string };

type WSWithMeta = WebSocket & { __room?: string; __userId?: string };

const g = globalThis as any;
g.__WS_ROOMS__ ||= new Map<string, Set<WSWithMeta>>();
const ROOMS: Map<string, Set<WSWithMeta>> = g.__WS_ROOMS__;

function getRoom(name: string) {
  if (!ROOMS.has(name)) ROOMS.set(name, new Set());
  return ROOMS.get(name)!;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get("room") || "global";
  const userId =
    searchParams.get("user") || `u-${Math.random().toString(36).slice(2)}`;

  // @ts-ignore - WebSocketPair קיים בסביבת Edge
  const pair = new WebSocketPair();
  const client = pair[0] as WSWithMeta;
  const server = pair[1] as WSWithMeta;

  const roomSet = getRoom(room);

  server.accept();
  server.__room = room;
  server.__userId = userId;

  // הצטרפות + הודעת נוכחות
  roomSet.add(server);
  broadcast(room, { type: "presence", room, userId });

  server.addEventListener("message", (ev) => {
    let msg: any;
    try {
      msg = JSON.parse(String(ev.data));
    } catch {
      return;
    }

    // הוסף חותמות
    if (msg && typeof msg === "object") {
      if (!msg.room) msg.room = room;
      if (!msg.from) msg.from = userId;
    }

    // העברה ליעד / לכלל החדר לפי סוג
    switch (msg.type as Msg["type"]) {
      case "chat":
        msg.ts ||= Date.now();
        broadcast(room, msg);
        break;

      case "sdp-offer":
      case "sdp-answer":
      case "ice":
        relayTo(room, msg.to, msg);
        break;

      default:
        // no-op
        break;
    }
  });

  const close = () => {
    try {
      roomSet.delete(server);
      broadcast(room, { type: "presence", room, userId });
    } catch {}
  };
  server.addEventListener("close", close);
  server.addEventListener("error", close);

  // ping כדי לשמר חיבורים חיים
  const ping = setInterval(() => {
    try {
      server.send(JSON.stringify({ type: "presence", room, userId }));
    } catch {}
  }, 25_000);

  // ניקוי
  server.addEventListener("close", () => clearInterval(ping));

  return new Response(null, { status: 101, webSocket: client });
}

function broadcast(room: string, data: any) {
  const set = ROOMS.get(room);
  if (!set) return;
  const payload = JSON.stringify(data);
  for (const ws of set) {
    try {
      ws.send(payload);
    } catch {}
  }
}

function relayTo(room: string, targetUserId: string, data: any) {
  const set = ROOMS.get(room);
  if (!set) return;
  const payload = JSON.stringify(data);
  for (const ws of set) {
    if (ws.__userId === targetUserId) {
      try {
        ws.send(payload);
      } catch {}
    }
  }
}
