import { getServerSession } from "next-auth";
import { authOptions } from "./options";

export { authOptions };
export async function auth() {
  return getServerSession(authOptions);
}
