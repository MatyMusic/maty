// src/components/assistant/AssistantAgent.tsx
"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import AssistantAvatar from "./AssistantAvatar";

const AssistantPanel = dynamic(() => import("./AssistantPanel"), {
  ssr: false,
});

export default function AssistantAgent({
  photoUrl,
}: {
  photoUrl?: string | null;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <AssistantAvatar
        photoUrl={photoUrl || "/assets/images/avatar-soft.png"}
        hatColor="#d3d3d6"
        shirtColor="#ffffff"
        onToggle={() => setOpen((v) => !v)}
        greet
        wander
      />
      <AssistantPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
