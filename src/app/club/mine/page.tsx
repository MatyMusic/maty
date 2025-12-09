// src/app/club/mine/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function MineRedirect() {
  // מפנים לנתיב הדף שקיים
  redirect("/club/my-posts");
}
