// src/app/music/groups/new/page.tsx
"use client";
import * as React from "react";
import CreateGroupForm from "@/components/music/CreateGroupForm";

export default function NewGroupPage() {
  return (
    <main dir="rtl" className="container mx-auto px-3 py-6">
      <h1 className="text-2xl font-bold mb-3">פתיחת קבוצה חדשה</h1>
      <CreateGroupForm
        onCreated={(g) => (window.location.href = "/music/groups")}
      />
    </main>
  );
}
