// app/admin/club/posts/new/page.tsx
export const metadata = { title: "פוסט חדש — מועדון" };

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">פוסט חדש</h1>

      <form className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm">כותרת</span>
          <input
            name="title"
            className="w-full rounded border px-3 py-2"
            placeholder="כותרת הפוסט"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">תוכן</span>
          <textarea
            name="body"
            rows={8}
            className="w-full rounded border px-3 py-2"
            placeholder="מה תרצה לכתוב?"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white"
          >
            שמירה
          </button>
          <a href="/admin/club/posts" className="rounded border px-4 py-2">
            ביטול
          </a>
        </div>
      </form>
    </main>
  );
}
