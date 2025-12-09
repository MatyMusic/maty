// src/app/club/layout.tsx
import LiveFeedBar from "@/components/club/LiveFeedBar";
import RightSidebar from "@/components/club/RightSidebar";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function ClubLayout({ children }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-6xl gap-4 px-3 py-4">
      {/* טור מרכזי – הפיד + LIVE BAR */}
      <main className="flex-1 min-w-0 space-y-4">
        {/* פס שידורים חיים מעל הפיד */}
        <LiveFeedBar />
        {children}
      </main>

      {/* טור ימני – פאנל לייב + מפה + עזרה וכו׳ */}
      <aside className="hidden lg:block w-80 flex-shrink-0">
        <RightSidebar />
      </aside>
    </div>
  );
}
