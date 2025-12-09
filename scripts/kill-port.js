// scripts/kill-port.js
// הורג תהליך שתופס את הפורט (קרוס־פלטפורם)
// שימוש: node scripts/kill-port.js 4002
const { execSync } = require("node:child_process");

const port = Number(process.argv[2] || process.env.SOCKET_PORT || 4002);

function log(msg) {
  process.stdout.write(`[socket:free] ${msg}\n`);
}

try {
  if (process.platform === "win32") {
    // Windows
    const lines = execSync(`netstat -ano | findstr :${port}`, {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    })
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const pids = new Set(
      lines.map((l) => l.split(/\s+/).pop()).filter((x) => /^\d+$/.test(x))
    );

    if (pids.size === 0) {
      log(`פורט ${port} פנוי`);
      process.exit(0);
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        log(`נוקָה PID ${pid} שתפס את ${port}`);
      } catch {}
    }
  } else {
    // macOS / Linux
    execSync(`lsof -ti tcp:${port} | xargs -r kill -9`, {
      stdio: "ignore",
      shell: "/bin/bash",
    });
    log(`נוקָה הפורט ${port} (אם היה בשימוש)`);
  }
  process.exit(0);
} catch (e) {
  // גם אם אין תהליך — זה תקין
  log(`הפורט ${port} כנראה פנוי`);
  process.exit(0);
}
