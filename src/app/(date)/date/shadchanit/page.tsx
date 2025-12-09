// src/app/(date)/date/shadchanit/page.tsx
"use client";
import { motion } from "framer-motion";

const WA =
  "https://wa.me/972532770198?text=" +
  encodeURIComponent("שלום מרים, הגעתי מ-MATY. אשמח לשידוך 🙂");
const MAIL =
  "mailto:Moshiachbeitar@gmail.com?subject=" +
  encodeURIComponent("פנייה לשדכנית — MATY") +
  "&body=" +
  encodeURIComponent("שלום מרים,\nשמי … ואני מחפש/ת …\nטלפון: …");

export default function ShadchanitPage() {
  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-gradient-to-b from-violet-50 to-pink-50 dark:from-neutral-950 dark:to-violet-950/20"
    >
      <section className="mx-auto max-w-4xl p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold">
            השדכנית · מרים פורטנוי
          </h1>
          <p className="mt-2 opacity-80">
            ליווי אישי למציאת בן/בת זוג — מעבר למסלול החודשי.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl p-6 bg-white/85 dark:bg-neutral-900/75 border border-black/10 dark:border-white/10"
          >
            <h2 className="text-xl font-bold">מה מקבלים?</h2>
            <ul className="mt-3 text-sm space-y-2">
              <li>• שיחת היכרות ובניית פרופיל ערכי</li>
              <li>• סינון מועמדים איכותי עפ״י קהילה/זרם/ערכים</li>
              <li>• ליווי יד־ביד עד הדייט</li>
              <li>• דיסקרטיות מלאה</li>
            </ul>
            <div className="mt-4 text-sm opacity-70">
              תמחור נפרד (ללא מנוי חודשי). נקבע לפי היקף הליווי.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl p-6 bg-white/85 dark:bg-neutral-900/75 border border-black/10 dark:border-white/10"
          >
            <h2 className="text-xl font-bold">צור/י קשר</h2>
            <div className="mt-3 grid gap-2 text-sm">
              <a
                href={WA}
                target="_blank"
                className="h-10 rounded-full bg-emerald-600 text-white grid place-items-center"
              >
                ווטסאפ ישיר: 053-277-0198
              </a>
              <a
                href={MAIL}
                className="h-10 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 grid place-items-center"
              >
                שלח מייל: Moshiachbeitar@gmail.com
              </a>
            </div>

            <form
              className="mt-4 grid gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget as HTMLFormElement);
                const r = await fetch("/api/shadchanit/contact", {
                  method: "POST",
                  body: JSON.stringify(Object.fromEntries(fd.entries())),
                  headers: { "Content-Type": "application/json" },
                });
                const j = await r.json().catch(() => null);
                alert(
                  j?.ok ? "הפנייה נשלחה! נחזור אליך בהקדם." : "שגיאה בשליחה"
                );
                (e.currentTarget as HTMLFormElement).reset();
              }}
            >
              <input
                name="name"
                required
                placeholder="שם מלא"
                className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
              />
              <input
                name="phone"
                required
                placeholder="טלפון"
                className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
              />
              <textarea
                name="about"
                rows={3}
                placeholder="כמה מילים עליך ומה חשוב לך…"
                className="rounded-xl border p-3 bg-white/95 dark:bg-neutral-900/90"
              />
              <button className="h-11 rounded-full bg-rose-600 text-white">
                שליחה לשדכנית
              </button>
            </form>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 rounded-3xl p-6 text-center bg-gradient-to-r from-violet-600/10 to-pink-600/10 border border-violet-400/30"
        >
          צריך חיבור “מיוחד”? לפעמים מספיק מבט שני נכון. אנחנו כאן בשביל זה. ✨
        </motion.div>
      </section>
    </main>
  );
}
