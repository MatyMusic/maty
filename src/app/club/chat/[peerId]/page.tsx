// src/app/club/chat/[peerId]/page.tsx
"use client";
import React from "react";
import { ConsentGate } from "@/components/club/ConsentGate";

export default function ChatWithPeer({
  params,
}: {
  params: { peerId: string };
}) {
  const { peerId } = params;
  return (
    <main className="mx-auto max-w-lg px-4 py-6" dir="rtl">
      <h1 className="mb-3 text-xl font-extrabold">צ׳אט עם משתמש</h1>
      <ConsentGate peerId={peerId} />
      <div className="mt-4 text-sm opacity-70">
        לאחר ששני הצדדים אישרו “צ׳אט בהסכמה” — תופיע כאן תיבת הצ׳אט.
      </div>
    </main>
  );
}
