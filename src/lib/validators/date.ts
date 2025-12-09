// src/lib/validators/date.ts
export function isValidIsoDate(yyyyMmDd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return false;
  const d = new Date(`${yyyyMmDd}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  // בדיקה "חזקה": שמירה על אותה מחרוזת לאחר parse
  return d.toISOString().slice(0, 10) === yyyyMmDd;
}

export function parseIsoDateStrict(yyyyMmDd: string): Date | null {
  return isValidIsoDate(yyyyMmDd) ? new Date(`${yyyyMmDd}T00:00:00Z`) : null;
}
