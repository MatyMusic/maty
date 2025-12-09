// src/app/messages/page.tsx
import MessagesPageClient from "@/components/messages/MessagesPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ההודעות שלי | MATY MUSIC",
};

export default function MessagesPage() {
  return (
    <main className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <MessagesPageClient />
      </div>
    </main>
  );
}
