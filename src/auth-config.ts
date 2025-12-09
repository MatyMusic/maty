// src/auth-config.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";

import clientPromise from "@/lib/mongo-client";

// ---------- helpers ----------
const DB_NAME = process.env.MONGODB_DB || "maty-music";
const PROFILE_REFRESH_EVERY = 10 * 60; // seconds
const DEBUG =
  process.env.NEXTAUTH_DEBUG === "true" ||
  process.env.NODE_ENV !== "production";

const SUPERADMINS = new Set(
  String(process.env.SUPERADMINS || "")
    .split(/[,;\s]+/)
    .filter(Boolean)
    .map((s) => s.trim().toLowerCase())
);

const ADMINS = new Set(
  String(process.env.ADMIN_EMAILS || "")
    .split(/[,;\s]+/)
    .filter(Boolean)
    .map((s) => s.trim().toLowerCase())
);

const normEmail = (e?: string | null) => (e || "").trim().toLowerCase();

async function usersCol() {
  const cli = await clientPromise;
  return cli.db(DB_NAME).collection("users");
}

async function getUserByEmail(email: string) {
  const Users = await usersCol();
  const doc = await Users.findOne(
    { email: normEmail(email) },
    {
      projection: {
        _id: 1,
        email: 1,
        name: 1,
        image: 1,
        role: 1,
        passwordHash: 1, // אנחנו שומרים בשדה הזה ברישום ידני
        password: 1, // תאימות ל־legacy אם נשמר
        style: 1,
        avatarId: 1,
      },
    }
  );
  return doc as
    | ({
        _id: any;
        email: string;
        name?: string;
        image?: string;
        role?: string;
        passwordHash?: string;
        password?: string;
        style?: string;
        avatarId?: string;
      } & Record<string, any>)
    | null;
}

function computeRole(email: string, currentRole?: string) {
  const e = normEmail(email);
  if (SUPERADMINS.has(e)) return "admin";
  if (ADMINS.has(e)) return "admin";
  return currentRole || "user";
}

// ---------- NextAuth config ----------
export const authConfig: NextAuthOptions = {
  trustHost: true,
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/auth?mode=login" },
  debug: DEBUG,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: process.env.NODE_ENV !== "production",
    }),

    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = normEmail(credentials?.email);
        const password = credentials?.password || "";
        if (!email || !password) return null;

        const user = await getUserByEmail(email);
        if (!user) return null;

        const hash = user.passwordHash || user.password;
        if (!hash || typeof hash !== "string") return null;

        const ok = await bcrypt.compare(password, hash).catch(() => false);
        if (!ok) return null;

        return {
          id: String(user._id),
          name: user.name || email.split("@")[0],
          email,
          role: computeRole(email, user.role),
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      const email = normEmail((token.email as string) || (user as any)?.email);
      const now = Math.floor(Date.now() / 1000);

      const shouldRefresh =
        !!user || // כניסה עכשיו
        typeof (token as any).upt !== "number" ||
        now - (token as any).upt > PROFILE_REFRESH_EVERY;

      if (email && shouldRefresh) {
        const doc = await getUserByEmail(email);
        const role = computeRole(email, doc?.role);

        (token as any).role = role;
        (token as any).style = doc?.style || (token as any).style || "soft";
        (token as any).avatarId = doc?.avatarId || (token as any).avatarId;

        if (doc?.name) token.name = doc.name;
        if (doc?.image) (token as any).picture = doc.image;

        (token as any).upt = now;
      }

      return token;
    },

    async session({ session, token }) {
      const role = (token as any).role || "user";
      const style = (token as any).style || "soft";
      const avatarId = (token as any).avatarId;

      (session as any).role = role;
      (session.user as any).role = role;

      (session as any).style = style;
      (session.user as any).style = style;

      if ((token as any).picture) {
        session.user.image = (token as any).picture as string;
      }
      if (token.name) session.user.name = token.name;
      if (avatarId) (session.user as any).avatarId = avatarId;

      // נוח שיהיה לנו גם id בסשן
      if (!(session.user as any).id && token.sub) {
        (session.user as any).id = token.sub;
      }

      // flag לסופר־אדמין אם תרצה
      if (SUPERADMINS.has(normEmail(token.email as string))) {
        (session as any).isSuperAdmin = true;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },

  events: {
    async createUser({ user }) {
      try {
        const Users = await usersCol();
        const email = normEmail(user.email);
        if (!email) return;

        await Users.updateOne(
          { email },
          {
            $setOnInsert: {
              role: computeRole(email, (user as any).role),
              status: "active",
              createdAt: new Date().toISOString(),
            },
            $set: {
              name: user.name ?? email.split("@")[0],
              image: user.image ?? undefined,
              updatedAt: new Date().toISOString(),
            },
          },
          { upsert: true }
        );
      } catch (e) {
        console.warn("[NextAuth events.createUser] upsert failed:", e);
      }
    },
  },
};

export default authConfig;
