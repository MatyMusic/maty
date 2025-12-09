import type { Metadata } from "next";
import MatyDateFaqClient from "./MatyDateFaqClient";

export const metadata: Metadata = {
  title: "MATY-DATE • שאלות ותשובות",
  description:
    "כל מה שצריך לדעת על MATY-DATE — התאמות ושידוכים לקהילות חרדיות/חסידיות/דתיות, עם אלגוריתם זהיר, אימות משתמשים ומדיניות פרטיות מוקפדת.",
};

export default function Page() {
  return <MatyDateFaqClient />;
}
