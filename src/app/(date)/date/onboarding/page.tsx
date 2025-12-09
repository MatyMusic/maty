// אין "use client" כאן!
import { redirect } from "next/navigation";

export const metadata = { title: "MATY-DATE" };

export default function Page() {
  // שרת: מפנה ישירות לטופס הפרופיל
  redirect("/date/profile");
}
