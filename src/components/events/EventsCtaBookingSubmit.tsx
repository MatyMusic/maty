// src/components/events/EventsCtaBookingSubmit.tsx

import { ArrowLeft, Music4 } from "lucide-react";

export function EventsCtaBookingSubmit() {
  return (
    <section className="rounded-3xl border border-violet-600/30 bg-gradient-to-r from-violet-600/90 via-fuchsia-600/85 to-violet-700/90 text-white px-5 sm:px-7 py-5 sm:py-6 shadow-lg text-right space-y-3">
      <h3 className="text-lg sm:text-xl font-extrabold">
        מסכם את האירוע + השירים, ושולח אליי לבקשת הצעת מחיר.
      </h3>
      <p className="text-xs sm:text-sm opacity-90 max-w-xl">
        הפרטים + רשימת השירים שסימנת יגיעו אליי, ואני אחזור אליך לווטסאפ/טלפון
        עם זמינות ותמחור מסודר.
      </p>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-2xl bg-white text-violet-700 text-sm font-semibold px-4 py-2 hover:bg-neutral-100"
      >
        שליחת בקשת אירוע
        <ArrowLeft className="w-4 h-4" />
        <Music4 className="w-4 h-4" />
      </button>
    </section>
  );
}
