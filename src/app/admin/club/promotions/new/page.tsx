// src/app/admin/club/promotions/new/page.tsx
import PromotionForm from "@/components/club/PromotionForm";
import { redirect } from "next/navigation";

export const metadata = { title: "יצירת פרסום — MATY-CLUB" };

export default function Page() {
  async function onSaved(_: any) {
    "use server";
    redirect("/admin/club/promotions");
  }

  return (
    <div dir="rtl" className="p-4 space-y-4">
      <h2 className="text-xl font-bold">יצירת פרסום חדש (CLUB)</h2>
      <div className="card p-4">
        {/* Server Action: לאחר שמירה נחזור לרשימה */}
        <PromotionForm
          initial={{ active: true, placement: "feed_top", weight: 1 }}
          onSaved={onSaved as any}
        />
      </div>
    </div>
  );
}
