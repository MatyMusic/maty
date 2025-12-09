import "dotenv/config";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { Server } from "socket.io";
import { MongoClient } from "mongodb";
import getPort from "get-port";

const ENV_PORT = Number(process.env.SOCKET_PORT || 4002);

type Msg = {
  _id?: any;
  room: string; // "<a>|<b>" (a<=b)
  from: string;
  to: string;
  text: string;
  at: string; // ISO
};

function roomKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

function requestHandler(req: IncomingMessage, res: ServerResponse) {
  // מסלולי עזר קטנים לזיהוי מהיר מהצד של Next
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end("ok");
    return;
  }
  if (req.url === "/info") {
    const payload = {
      ok: true,
      port: serverPort,
      url: `http://localhost:${serverPort}`,
    };
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(payload));
    return;
  }
  // ברירת מחדל – שקט. Socket.IO תופס את שאר הבקשות (handshake)
  res.writeHead(404);
  res.end();
}

let serverPort = ENV_PORT;

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ Missing MONGODB_URI (בדוק .env.local)");
    process.exit(1);
  }
  const mongoDb = process.env.MONGODB_DB || "maty-music";

  // בחר פורט פנוי (מעדיף ENV_PORT, אחריו +1, +2)
  serverPort = await getPort({ port: [ENV_PORT, ENV_PORT + 1, ENV_PORT + 2] });

  const httpServer = createServer(requestHandler);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Mongo
  const cli = new MongoClient(mongoUri);
  await cli.connect();
  const db = cli.db(mongoDb);
  const col = db.collection<Msg>("date_chat");

  io.on("connection", (socket) => {
    let meId: string | null = null;

    socket.on("hello", (data: any) => {
      meId = (data?.meId || "").toString();
      if (!meId) {
        socket.emit("error", { error: "missing_meId" });
        return;
      }
      socket.join(`u:${meId}`);
    });

    socket.on("join", (data: any) => {
      if (!meId) return;
      const peerId = (data?.peerId || "").toString();
      if (!peerId) return;
      const room = roomKey(meId, peerId);
      socket.join(`r:${room}`);
      socket.emit("joined", { room, peerId });
    });

    socket.on("chat:send", async (data: any, cb?: Function) => {
      if (!meId) return cb?.({ ok: false, error: "unauthorized" });
      const peerId = (data?.to || "").toString();
      const text = (data?.text || "").toString().slice(0, 2000);
      if (!peerId || !text) return cb?.({ ok: false, error: "bad_request" });

      const room = roomKey(meId, peerId);
      const doc: Msg = {
        room,
        from: meId,
        to: peerId,
        text,
        at: new Date().toISOString(),
      };
      const ins = await col.insertOne(doc as any);

      io.to(`r:${room}`).emit("chat:new", {
        id: String(ins.insertedId),
        from: meId,
        to: peerId,
        text,
        at: doc.at,
      });

      cb?.({
        ok: true,
        item: { id: String(ins.insertedId), fromMe: true, text, at: doc.at },
      });
    });

    socket.on("chat:history", async (data: any, cb?: Function) => {
      if (!meId) return cb?.({ ok: false, error: "unauthorized" });
      const peerId = (data?.peerId || "").toString();
      const limit = Math.min(Math.max(Number(data?.limit || 100), 1), 300);
      const room = roomKey(meId, peerId);
      const items = await col
        .find({ room })
        .sort({ at: 1 })
        .limit(limit)
        .toArray();

      cb?.({
        ok: true,
        items: items.map((m) => ({
          id: String(m._id || ""),
          fromMe: m.from === meId,
          text: m.text,
          at: m.at,
        })),
      });
    });
  });

  httpServer.on("error", (err: any) => {
    if (err?.code === "EADDRINUSE") {
      console.error(
        `❌ פורט ${ENV_PORT} עדיין תפוס. (ניסינו לבחור אחר אוטומטית)`
      );
    } else {
      console.error("Server error:", err);
    }
    process.exit(1);
  });

  httpServer.listen(serverPort, () => {
    const chosen =
      serverPort === ENV_PORT
        ? `✅ מאזין על הפורט שביקשת (${serverPort})`
        : `⚠️ הפורט ${ENV_PORT} היה תפוס — מאזין על ${serverPort} במקום`;
    console.log(
      `🚀 Socket.IO: ${chosen}\n   URL: http://localhost:${serverPort}\n   Env SOCKET_PORT=${ENV_PORT}`
    );
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
