import { getServerSession } from "next-auth";
import { authOptions } from "./options";

// ייבוא יחיד לכל הראוטים: "@/lib/auth"
export { authOptions };

// alias עקבי לקבלת הסשן ב-App Router/Route Handlers
export async function auth() {
  return getServerSession(authOptions);
}
