
// /src/app/api/auth/[...nextauth]/auth-options.ts

import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";

const hasMongo = !!process.env.MONGODB_URI?.trim();

// נטען adapter רק אם יש MONGODB_URI
let adapter: any = undefined;
if (hasMongo) {
  const { MongoDBAdapter } = await import("@auth/mongodb-adapter");
  const { default: clientPromise } = await import("@/lib/mongodb");
  adapter = MongoDBAdapter(clientPromise) as any;
}

// עוזר לבדוק אם מייל הוא אדמין (לא חובה)
async function isAdminEmailSafe(email?: string | null): Promise<boolean> {
  if (!email) return false;
  try {
    const { isAdminEmail } = await import("@/lib/auth/admin-emails").catch(
      () => ({ isAdminEmail: () => false }),
    );
    return isAdminEmail(email);
  } catch {
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  ...(adapter ? { adapter } : {}),

  session: { strategy: "jwt" },
  secret:
    process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "dev-secret",

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // מוודאים שמגיע picture ב-user בכניסה ראשונה
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: (profile as any).picture ?? null,
        };
      },
    }),
  ],

  pages: { signIn: "/auth?mode=login" },

  callbacks: {
    // ה-JWT הוא מקור האמת. נטמיע בו role + image, ונאפשר update דינמי.
    async jwt({ token, user, account, profile, trigger, session }) {
      // בפעם הראשונה אחרי התחברות – נכניס role ו-image
      if (account?.provider) {
        const email =
          (profile as any)?.email ?? (user as any)?.email ?? token.email;
        const role = (await isAdminEmailSafe(email)) ? "admin" : "user";
        (token as any).role = role;

        const picture =
          (user as any)?.image ??
          (profile as any)?.picture ??
          (token as any).image ??
          null;
        (token as any).image = picture;
      }

      // תמיכה ב-update({ image }) מצד הקליינט
      if (trigger === "update" && session?.image !== undefined) {
        (token as any).image = session.image;
      }

      // פולבקים
      (token as any).role = (token as any).role ?? "user";
      (token as any).image = (token as any).image ?? null;
      return token;
    },

    // session.user = מה שיש ב-token
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = (token as any).role ?? "user";
        (session.user as any).image =
          (token as any).image ?? session.user.image ?? null;
      }
      return session;
    },
  },
};
