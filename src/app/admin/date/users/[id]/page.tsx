// src/app/admin/users/[id]/page.tsx
export const dynamic = "force-dynamic";

export const metadata = {
  title: "פרופיל משתמש · MATY-ADMIN",
};

type PageParams = {
  id: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

export default async function AdminUserPage(props: PageProps) {
  // Next 15 – params זה Promise, חייבים await
  const { id } = await props.params;

  // פה בעתיד אפשר לחבר DB אמיתי / API / requireAdmin וכו'
  // כרגע שומרים את זה פשוט כדי לעבור את ה-type-check
  return (
    <div className="mx-auto max-w-4xl px-4 py-8" dir="rtl">
      <h1 className="mb-4 text-2xl font-extrabold">פרופיל משתמש (אדמין)</h1>

      <div className="rounded-2xl border border-black/10 bg-white/80 p-4 text-sm shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
        <p className="mb-2">
          כאן בעתיד תופיע תצוגת פרופיל מלאה של המשתמש מהמערכת.
        </p>
        <p className="text-xs opacity-70">
          <span className="font-semibold">User ID:</span> {id}
        </p>
      </div>
    </div>
  );
}
