"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  initial?: any;
};

export default function UserForm({ initial }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    role: initial?.role ?? "user",
    status: initial?.status ?? "active",
    line1: initial?.address?.line1 ?? "",
    city: initial?.address?.city ?? "",
    country: initial?.address?.country ?? "",
  });

  const submit = () => {
    start(async () => {
      const method = initial?._id ? "PATCH" : "POST";
      const url = initial?._id ? `/api/admin/users/${initial._id}` : "/api/admin/users";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || undefined,
          email: form.email,
          phone: form.phone || undefined,
          role: form.role,
          status: form.status,
          address: {
            line1: form.line1 || undefined,
            city: form.city || undefined,
            country: form.country || undefined,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "בעיה בשמירה");
        return;
      }
      router.push("/admin/users");
      router.refresh();
    });
  };

  const del = () => {
    if (!initial?._id) return;
    if (!confirm("למחוק משתמש?")) return;
    start(async () => {
      const res = await fetch(`/api/admin/users/${initial._id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "בעיה במחיקה");
        return;
      }
      router.push("/admin/users");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-semibold">שם</span>
          <input className="input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-semibold">אימייל *</span>
          <input className="input" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-semibold">טלפון</span>
          <input className="input" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-semibold">תפקיד</span>
            <select className="input" value={form.role} onChange={e=>setForm({...form, role:e.target.value as any})}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-semibold">סטטוס</span>
            <select className="input" value={form.status} onChange={e=>setForm({...form, status:e.target.value as any})}>
              <option value="active">active</option>
              <option value="pending">pending</option>
              <option value="blocked">blocked</option>
            </select>
          </label>
        </div>

        <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <legend className="text-sm font-semibold mb-1">כתובת</legend>
          <input className="input" placeholder="רחוב ומספר" value={form.line1} onChange={e=>setForm({...form, line1:e.target.value})}/>
          <input className="input" placeholder="עיר" value={form.city} onChange={e=>setForm({...form, city:e.target.value})}/>
          <input className="input" placeholder="מדינה/ארץ" value={form.country} onChange={e=>setForm({...form, country:e.target.value})}/>
        </fieldset>
      </div>

      <div className="flex gap-2">
        <button onClick={submit} disabled={pending} className="btn bg-brand text-white border-0">
          {pending ? "שומר..." : "שמור"}
        </button>
        {initial?._id && (
          <button onClick={del} disabled={pending} className="btn border-red-300 text-red-600">
            מחק
          </button>
        )}
      </div>
    </div>
  );
}
