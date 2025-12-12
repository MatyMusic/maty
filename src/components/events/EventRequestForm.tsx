// src/components/events/EventRequestForm.tsx
"use client";

import { EventBookingFields } from "@/components/events/EventBookingFields";
import { EventSongsPicker } from "@/components/events/EventSongsPicker";
import { EventsCtaBookingSubmit } from "@/components/events/EventsCtaBookingSubmit";
import { useSession } from "next-auth/react";

export function EventRequestForm() {
  const { data: session } = useSession();
  const user = session?.user as any | undefined;

  const userId = user?._id || user?.id || "";
  const userName = user?.name || "";
  const userEmail = user?.email || "";

  return (
    <form
      action="/api/events/request"
      method="POST"
      className="space-y-6"
      // אם תרצה בעתיד – אפשר להחליף ל־server action
    >
      {/* מידע משתמש מוסתר – כדי שתדע מי זה גם אם הוא לא מילא שדות */}
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="userName" value={userName} />
      <input type="hidden" name="userEmail" value={userEmail} />

      {/* פרטי האירוע והלקוח */}
      <EventBookingFields initialFullName={userName} initialEmail={userEmail} />

      {/* בחירת שירים – חייב להכיל hidden favSongIds כמו שבנינו */}
      <EventSongsPicker />

      {/* כפתור שליחה + טקסט שיווקי */}
      <EventsCtaBookingSubmit />
    </form>
  );
}
