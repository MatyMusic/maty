/** מחזיר מחרוזת YYYY-MM-DD לפי תאריך (UTC) */
export function toDateKeyUTC(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** כעת UTC */
export function nowUTC() {
  return new Date(Date.now());
}
