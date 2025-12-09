// src/auth.ts
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "dev-insecure-secret-change-me";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const providers = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  }),
];

export const authConfig: NextAuthConfig = {
  // חשוב בסביבות dev/פרוקסי למנוע Client fetch errors
  trustHost: true,

  // אם תריץ מאחורי דומיין/פורט אחר – וודא שה-URL נכון ב-.env
  // NEXTAUTH_URL / AUTH_URL ישלימו את זה אוטומטית; basePath כאן רק לשקיפות
  basePath: "/api/auth",

  secret: AUTH_SECRET,

  session: { strategy: "jwt" },

  // ספקים
  providers,

  // פחות רעש
  debug: false,
  logger: {
    error: (...args) => console.error("[auth:error]", ...args),
    warn: (...args) => console.warn("[auth:warn]", ...args),
    debug: (..._args) => {},
  },

  // דפים מותאמים (לא חובה) — בטל אם אין לך /login
  // pages: { signIn: "/login" },

  callbacks: {
    async jwt({ token, account, profile }) {
      // מילוי פרטים בהתחברות ראשונה
      if (account && profile) {
        const p = profile as any;
        token.name = p?.name ?? token.name;
        token.picture = p?.picture ?? token.picture;
        token.email = p?.email ?? token.email;
      }
      // ROLE לפי ADMIN_EMAILS
      const email = (token.email ?? "") as string;
      (token as any).role = ADMIN_EMAILS.includes(email.toLowerCase())
        ? "admin"
        : "user";
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.name = (token.name as string) ?? session.user.name;
        // @ts-ignore – מוסיפים image/id/role
        session.user.image = (token.picture as string) ?? session.user.image;
        // @ts-ignore
        session.user.id = (token.sub as string) ?? session.user.id;
        // @ts-ignore
        session.user.role = (token as any).role ?? "user";
      }
      return session;
    },

    // אופציונלי: חסימת גישה לנתיבים, אם תרצה
    // authorized({ auth, request }) { return true }
  },

  // אירועים — לוגים רכים
  events: {
    signIn: (m) => console.log("[auth:event] signIn", m?.user?.email),
    signOut: (m) =>
      console.log("[auth:event] signOut", m?.session?.user?.email),
  },
};

// מייצא גם handlers לנתיב ה־API וגם auth/signIn/signOut לשימוש בפרויקט
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
