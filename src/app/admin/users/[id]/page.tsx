


// src/app/admin/users/[id]/page.tsx
import UserForm from "@/components/admin/UserForm";

async function getUser(id: string) {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/users/${id}`, { cache: "no-store" });
  const j = await r.json().catch(()=>({}));
  return j?.ok ? j.row : null;
}

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const initial = await getUser(params.id);
  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-2xl font-extrabold">עריכת משתמש</h1>
      <div className="card p-4">
        <UserForm initial={initial || undefined} />
      </div>
    </div>
  );
}
