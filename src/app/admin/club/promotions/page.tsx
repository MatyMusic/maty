// src/app/admin/club/promotions/page.tsx  ← קובץ שרת
import ClientPage from "./ClientPage";

export const metadata = { title: "פרסומות — אדמין" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <ClientPage />;
}
