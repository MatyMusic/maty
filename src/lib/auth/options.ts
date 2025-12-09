import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";

const hasMongo = !!process.env.MONGODB_URI?.trim();

// טוען Adapter רק אם יש Mongo
let adapter: any = undefined;
if (hasMongo) {
  const { MongoDBAdapter } = await import("@auth/mongodb-adapter");
  const { default: clientPromise } = await import("@/lib/mongodb");
  adapter = MongoDBAdapter(clientPromise) as any;
}

async function isAdminEmailSafe(email?: string | null) {
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
  pages: { signIn: "/auth?mode=login" },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(p) {
        return {
          id: p.sub,
          name: p.name,
          email: p.email,
          image: (p as any).picture ?? null,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      // התחברות ראשונה / החלפת ספק → קבע role + image
      if (account?.provider) {
        const email =
          (profile as any)?.email ?? (user as any)?.email ?? token.email;
        (token as any).role = (await isAdminEmailSafe(email))
          ? "admin"
          : "user";
        (token as any).image =
          (user as any)?.image ??
          (profile as any)?.picture ??
          (token as any).image ??
          null;
      }
      // עדכון תמונה דינמי אם תרצה session.update({ image })
      if (trigger === "update" && session?.image !== undefined) {
        (token as any).image = session.image;
      }
      (token as any).role ??= "user";
      (token as any).image ??= null;
      return token;
    },

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

  debug: process.env.NEXTAUTH_DEBUG === "true",
};
