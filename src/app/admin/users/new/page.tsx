// src/app/admin/users/new/page.tsx
import UserForm from "@/components/admin/UserForm";

export const metadata = { title: "משתמש חדש — Admin" };

export default function NewUserPage() {
  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-2xl font-extrabold">משתמש חדש</h1>
      <div className="card p-4">
        <UserForm />
      </div>
    </div>
  );
}
