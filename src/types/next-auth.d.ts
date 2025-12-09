import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser { id: string; role: "admin" | "user"; }
  interface Session {
    user: { id: string; role: "admin" | "user"; } & DefaultSession["user"];
  }
}
declare module "next-auth/jwt" {
  interface JWT { sub?: string; role?: "admin" | "user"; picture?: string | null; }
}
