// src/lib/auth.ts
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import type { User as NAUser, NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { subscribeToMailingList } from "@/lib/mailing-list";
import clientPromise from "@/lib/mongo-client";
import db from "@/lib/mongoose";
import AuditEvent from "@/models/AuditEvent";
import Customer from "@/models/Customer";
import User from "@/models/User";

import bcrypt from "bcryptjs";
import { headers as nextHeaders } from "next/headers";

/* ================= Utils & Config ================= */

function getSuperAdmins(): string[] {
  return String(process.env.SUPERADMINS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Next 15: headers() חייב להיות עם await בתוך Route / Auth.
 * לכן הפונקציה הזו הפכה ל־async ומשתמשת ב־await nextHeaders().
 */
async function getIpUaSafe() {
  try {
    const h = await nextHeaders(); // ⬅⬅⬅ חשוב: await
    const xf = h.get("x-forwarded-for") || "";
    const ip =
      xf
        .split(",")
        .map((s) => s.trim())
        .find(Boolean) ||
      h.get("x-real-ip") ||
      "";
    const ua = h.get("user-agent") || "";
    return { ip, ua };
  } catch {
    return { ip: "", ua: "" };
  }
}

const loginHits = new Map<string, { count: number; ts: number }>();

function hitKey(email: string, ip: string) {
  return `${email.toLowerCase()}|${ip}`;
}

function checkLoginLimit(
  email: string,
  ip: string,
  windowMs = 60_000,
  max = 10,
) {
  const k = hitKey(email, ip);
  const now = Date.now();
  const rec = loginHits.get(k);

  if (!rec || now - rec.ts > windowMs) {
    loginHits.set(k, { count: 1, ts: now });
    return true;
  }

  rec.count += 1;
  if (rec.count > max) return false;
  loginHits.set(k, rec);
  return true;
}

/* ================= NextAuth Options ================= */

export const authOptions: NextAuthOptions = {
  trustHost: true,

  adapter: MongoDBAdapter(clientPromise as any, {
    databaseName: process.env.MONGODB_DB,
  }),

  session: { strategy: "jwt" },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",

  pages: { signIn: "/auth?mode=login" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: { params: { prompt: "select_account" } },
      allowDangerousEmailAccountLinking: process.env.NODE_ENV !== "production",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: (profile.email || "").toLowerCase(),
          image: profile.picture,
        } as unknown as NAUser;
      },
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;

        await db();

        // ⬅ כאן עכשיו הקריאה async – פותרת את השגיאה של headers()
        const { ip, ua } = await getIpUaSafe();

        if (!checkLoginLimit(creds.email, ip)) return null;

        const emailLower = creds.email.toLowerCase();
        const u = await User.findOne({ email: emailLower }).lean();
        if (!u?.passwordHash) return null;

        const ok = await bcrypt.compare(creds.password, u.passwordHash);
        if (!ok) return null;

        try {
          await AuditEvent.create({
            type: "auth.signin",
            userId: String(u._id),
            email: u.email,
            ip,
            ua,
            meta: { provider: "credentials" },
          });
        } catch {}

        try {
          await Customer.updateOne(
            { email: emailLower },
            {
              $setOnInsert: {
                name: u.name ?? "",
                phone: (u as any).phone ?? "",
                source: "site",
                tags: ["lead"],
              },
              $set: { lastSeenAt: new Date() },
            },
            { upsert: true },
          );
        } catch {}

        subscribeToMailingList(emailLower, u.name).catch(() => {});

        return {
          id: String(u._id),
          email: u.email,
          name: u.name,
          image: (u as any).image,
          role: (u as any).role || "user",
        } as any;
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      try {
        await db();
        const email = (user?.email || "").toLowerCase();
        if (!email) return true;

        const supers = getSuperAdmins();
        if (supers.includes(email)) {
          await User.updateOne(
            { email },
            { $set: { role: "superadmin" } },
            { upsert: true },
          );
        }
      } catch {}
      return true;
    },

    async jwt({ token, user }) {
      // 🔹 חשוב: לשמור את מזהה המשתמש ב-JWT (כדי שיהיה token.sub)
      if (user) {
        (token as any).sub = (user as any).id;
      }

      // אם יש role מה־user (למשל ב־Credentials) – ניקח אותו
      if (user && (user as any).role) {
        (token as any).role = (user as any).role;
      }

      if (!(token as any).role) {
        try {
          await db();
          const email = String(
            (user as any)?.email || token.email || "",
          ).toLowerCase();

          const supers = getSuperAdmins();
          if (email && supers.includes(email)) {
            (token as any).role = "superadmin";
          } else if (email) {
            const doc = await User.findOne({ email }, { role: 1 }).lean();
            (token as any).role = (doc as any)?.role || "user";
          } else {
            (token as any).role = "user";
          }
        } catch {
          (token as any).role = (token as any).role || "user";
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = (token as any).role || "user";
        // 🔹 קריטי: להעביר את ה-id גם לצד לקוח
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
};

/* ================= עזרי שרת ================= */

export async function getAuth() {
  return getServerSession(authOptions);
}

export async function auth() {
  return getServerSession(authOptions);
}
