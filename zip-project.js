// zip-project.js
// סקריפט שמייצר זיפ של כל תיקיית הפרויקט לשולחן העבודה (Windows)

const { exec } = require("child_process");
const path = require("path");
const os = require("os");

async function main() {
  const projectDir = process.cwd();
  const desktop = path.join(os.homedir(), "Desktop");
  const outZip = path.join(desktop, "MATY-project.zip");

  // פקודת PowerShell שמכווצת את כל התיקיה הנוכחית
  const cmd = `powershell -Command "Compress-Archive -Path '${projectDir}\\*' -DestinationPath '${outZip}' -Force"`;

  console.log("מכווץ את:", projectDir);
  console.log("אל:", outZip);

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error("שגיאה ביצירת ZIP:", err);
      console.error(stderr);
      process.exit(1);
    } else {
      console.log("✅ ZIP נוצר בהצלחה:", outZip);
      console.log(stdout);
      process.exit(0);
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
