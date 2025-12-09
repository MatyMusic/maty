// src/components/assistant/AssistantButton.tsx
"use client";
import * as React from "react";
import AssistantAvatar from "./AssistantAvatar";
import AssistantPanel from "./AssistantPanel";

export default function AssistantButton() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* כפתור קבוע בפינה עליונה */}
      <div className="fixed z-[220] top-2 right-2 md:top-3 md:right-3">
        <AssistantAvatar
          size={48}
          onClick={() => setOpen(true)}
          title="פתח שורת חיפוש AI (Ctrl/⌘+K)"
        />
      </div>

      {/* הפאנל עצמו */}
      <AssistantPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
