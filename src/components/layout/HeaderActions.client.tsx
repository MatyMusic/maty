"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HeaderActions({
  contactHref = "/contact",
  bookingHref = "/book",
  className = "",
}: {
  contactHref?: string;
  bookingHref?: string;
  className?: string;
}) {
  const router = useRouter();

  function openContact() {
    // ניווט פשוט עדיף עם Link, אבל אם חייבים לוגיקה:
    router.push(contactHref);
  }
  function openBooking() {
    router.push(bookingHref);
  }

  return (
    <div className={className}>
      {/* עדיף Link כשזה רק ניווט */}
      <Link
        href={contactHref}
        className="rounded-xl border px-3 py-1.5 hover:bg-black/5"
      >
        צור קשר
      </Link>

      {/* ואם חייבים onClick – הוא כאן בצד לקוח */}
      <button
        onClick={openBooking}
        className="ms-2 rounded-xl border px-3 py-1.5 hover:bg-black/5"
      >
        הזמן הופעה
      </button>
    </div>
  );
}
