// src/app/rtc-test/page.tsx
"use client";

import RtcCallPanel from "@/components/rtc/RtcCallPanel";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function RtcTestPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const qpRoomId = searchParams.get("roomId");
  const defaultRoomId = "maty-demo-room";
  const roomId = qpRoomId || defaultRoomId;

  const meId =
    (session?.user as any)?.id ||
    (session?.user as any)?._id ||
    (session?.user as any)?.email ||
    null;

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-4xl flex-col gap-4 px-4 py-8">
      <h1 className="text-center text-2xl font-bold text-slate-100">
        בדיקת שיחת וידאו (RTC Test)
      </h1>

      {!meId && (
        <p className="rounded-xl bg-amber-900/40 px-3 py-2 text-sm text-amber-200">
          אתה לא מחובר. כדי לבדוק RTC עם משתמשים אמיתיים, כדאי להתחבר קודם
          (Login) – כרגע אני רק משתמש ב־roomId, אז אפשר לבדוק גם בלי.
        </p>
      )}

      <p className="text-sm text-slate-300">
        אתה כרגע ב־roomId:{" "}
        <span className="font-mono text-emerald-300">{roomId}</span>
        <br />
        אפשר להעביר roomId אחר ב־URL, לדוגמה:
        <br />
        <span className="font-mono text-xs text-sky-300">
          /rtc-test?roomId=my-room-123
        </span>
      </p>

      <RtcCallPanel roomId={roomId} meId={meId} />

      <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-900/70 p-3 text-xs text-slate-300">
        <p className="mb-1 font-semibold">איך לבדוק בפועל?</p>
        <ol className="list-inside list-decimal space-y-1">
          <li>
            פתח את העמוד{" "}
            <span className="font-mono text-[11px] text-emerald-300">
              /rtc-test
            </span>{" "}
            בשני דפדפנים / שני מחשבים / חלונות אינקוגניטו.
          </li>
          <li>
            ודא שבשניהם ה־roomId זהה (ברירת מחדל:{" "}
            <span className="font-mono text-[11px] text-emerald-300">
              maty-demo-room
            </span>
            ).
          </li>
          <li>בכל צד לחץ &quot;הפעל מצלמה + מיקרופון&quot; ואשר לדפדפן.</li>
          <li>בצד אחד לחץ &quot;אני מתקשר (Caller)&quot;.</li>
          <li>בצד השני לחץ &quot;אני עונה (Callee)&quot;.</li>
          <li>תוך כמה שניות אמור להופיע וידאו נכנס בשני הצדדים.</li>
        </ol>
      </div>
    </main>
  );
}
