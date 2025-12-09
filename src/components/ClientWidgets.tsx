// src/components/ClientWidgets.tsx
"use client";

import dynamic from "next/dynamic";

// שני הווידג'טים נטענים רק בלקוח, בלי SSR, אז זה תקין כאן.
const ContactDock = dynamic(() => import("@/components/ContactDock"), {
  ssr: false,
});
const MatyAIWidget = dynamic(() => import("@/components/chat/MatyAIWidget"), {
  ssr: false,
});

export default function ClientWidgets() {
  return (
    <>
      <ContactDock />
      <MatyAIWidget />
    </>
  );
}
