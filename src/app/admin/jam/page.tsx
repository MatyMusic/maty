// src/app/admin/jam/page.tsx
export default async function JamDashboardPage() {
  let stats: any = null;
  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/jam/stats`,
      { cache: "no-store" },
    );
    stats = r.ok ? await r.json() : null;
  } catch {}

  return (
    <div className="p-4" dir="rtl">
      <h2 className="text-xl font-bold">דאשבורד MATY-JAM</h2>
      <p className="opacity-70 text-sm">סקירה מהירה על סשנים/דיווחים.</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4">
        <div className="rounded-xl border p-3">
          <div className="text-xs opacity-70">סה״כ סשנים</div>
          <div className="text-2xl font-extrabold">{stats?.sessions ?? 0}</div>
        </div>
        <div className="rounded-xl border p-3">
          <div className="text-xs opacity-70">ממתינים לאישור</div>
          <div className="text-2xl font-extrabold">{stats?.pending ?? 0}</div>
        </div>
        <div className="rounded-xl border p-3">
          <div className="text-xs opacity-70">מאושרים</div>
          <div className="text-2xl font-extrabold">{stats?.approved ?? 0}</div>
        </div>
        <div className="rounded-xl border p-3">
          <div className="text-xs opacity-70">דיווחים פתוחים</div>
          <div className="text-2xl font-extrabold">
            {stats?.reportsOpen ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
}
