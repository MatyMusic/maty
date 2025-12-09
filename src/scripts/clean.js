// scripts/clean.js
const fs = require("fs");
["node_modules", ".next", "package-lock.json"].forEach((p) => {
  try {
    fs.rmSync(p, { recursive: true, force: true });
  } catch {}
});
console.log("Cleaned node_modules, .next, package-lock.json");
