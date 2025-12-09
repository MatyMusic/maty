// src/app/admin/loading.tsx
export default function AdminLoading() {
  return (
    <div className="container-section section-padding" dir="rtl">
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="card p-4">
          <div className="h-4 w-24 bg-black/10 dark:bg-white/10 rounded mb-3" />
          <div className="space-y-2">
            <div className="h-8 bg-black/10 dark:bg-white/10 rounded" />
            <div className="h-8 bg-black/10 dark:bg-white/10 rounded" />
            <div className="h-8 bg-black/10 dark:bg-white/10 rounded" />
          </div>
        </aside>
        <main className="min-w-0">
          <div className="card p-6">
            <div className="h-5 w-40 bg-black/10 dark:bg-white/10 rounded mb-4" />
            <div className="h-3 w-full bg-black/10 dark:bg-white/10 rounded" />
          </div>
        </main>
      </div>
    </div>
  );
}
