// src/lib/auth/config.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authConfig: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    // אפשר להוסיף כאן ספקים נוספים (GitHub, Credentials וכו')
  ],
  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token }) {
      // פלג אדמין לפי רשימת מיילים (ENV: NEXT_PUBLIC_ADMIN_EMAILS)
      const allow = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .toLowerCase()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const email = (token.email || "").toLowerCase();
      if (email && allow.includes(email)) {
        (token as any).isAdmin = true;
        (token as any).role = "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).isAdmin = Boolean((token as any).isAdmin);
        (session.user as any).role = (token as any).role || "user";
      }
      return session;
    },
  },

  // pages: { signIn: "/auth?mode=login" }, // אופציונלי
};
