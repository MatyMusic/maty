import type { ReactNode } from "react";
import type { Metadata } from "next";
import DateProviders from "./DateProviders"; // קומפוננטת Client (למטה)

export const metadata: Metadata = {
  title: "MATY-DATE",
  description: "שידוכים חכמים לקהילות יהודיות",
  openGraph: {
    title: "MATY-DATE",
    description: "שידוכים חכמים לקהילות יהודיות",
  },
  twitter: { card: "summary_large_image", title: "MATY-DATE" },
};

export default function DateLayout({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="rtl text-right mx-auto max-w-5xl px-4 py-6">
      {/* כל מה שתלוי בלקוח (Toast/Providers) נמצא בתוך DateProviders */}
      <DateProviders>{children}</DateProviders>
    </div>
  );
}
