// src/app/(community)/farbrengen/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  const r = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/farbrengen/rooms`,
    { cache: "no-store" },
  );
  const j = await r.json().catch(() => ({ ok: false, items: [] }));
  const items = j?.items || [];

  return (
    <main dir="rtl" className="container-section section-padding">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold">התוועדויות</h1>
        <p className="text-sm opacity-70">
          שיעורים, התוועדויות, ניגונים ושיח קהילתי.
        </p>
      </header>

      <div className="mb-4">
        <a href="/farbrengen/create" className="mm-btn mm-btn-primary">
          פתח/י חדר חדש
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((r: any) => (
          <Link
            key={r._id}
            href={`/farbrengen/${r._id}`}
            className="mm-card p-4 hover:shadow-md transition"
          >
            <div className="text-xs opacity-70 mb-1">
              {r.audience === "men"
                ? "גברים"
                : r.audience === "women"
                  ? "נשים"
                  : "מעורב"}
            </div>
            <h2 className="font-semibold">{r.title}</h2>
            <p className="text-sm opacity-70 line-clamp-2 mt-1">
              {r.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(r.tags || []).map((t: string) => (
                <span key={t} className="mm-badge">
                  {t}
                </span>
              ))}
            </div>
            {r.live && (
              <div className="mt-2 text-emerald-600 text-sm">● חי עכשיו</div>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}
