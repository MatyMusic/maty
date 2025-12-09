// src/lib/auth/admin-emails.ts
function splitList(v?: string | null) {
  return (v || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function getAdminEmails(): string[] {
  // תומך בכל הוריאציות:
  const fromPlural = splitList(process.env.ADMIN_EMAILS); // "a@b.com,b@c.com"
  const fromSingle = splitList(process.env.ADMIN_EMAIL); // "a@b.com"
  const superPlural = splitList(process.env.SUPERADMIN_EMAILS); // "boss@x.com,cto@x.com"
  const superSingle = splitList(process.env.SUPERADMINS); // "boss@x.com"

  return Array.from(
    new Set([...fromPlural, ...fromSingle, ...superPlural, ...superSingle])
  );
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
