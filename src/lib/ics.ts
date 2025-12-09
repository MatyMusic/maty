// src/lib/ics.ts
function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function addDays(isoDate: string, days: number) {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(
    d.getUTCDate()
  )}`;
}

function esc(s: string) {
  return (s || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function buildICS(p: {
  date: string; // YYYY-MM-DD
  summary: string;
  description?: string;
  location?: string;
  uid?: string;
  organizerEmail?: string;
  attendeeEmail?: string;
}) {
  const ymd = p.date.replace(/-/g, "");
  const next = addDays(p.date, 1);
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z");
  const uid =
    p.uid || `${ymd}-${Math.random().toString(36).slice(2)}@maty-music`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MATY MUSIC//Booking//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${ymd}`,
    `DTEND;VALUE=DATE:${next}`,
    `SUMMARY:${esc(p.summary)}`,
    p.description ? `DESCRIPTION:${esc(p.description)}` : "",
    p.location ? `LOCATION:${esc(p.location)}` : "",
    p.organizerEmail ? `ORGANIZER:MAILTO:${p.organizerEmail}` : "",
    p.attendeeEmail ? `ATTENDEE:MAILTO:${p.attendeeEmail}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return Buffer.from(lines, "utf8");
}
