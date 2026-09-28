import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { database } from "@/lib/mongodb";

function isConfigAdmin(email) {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.trim().toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.SESSION_SECRET,
  pages: { signIn: "/signin", error: "/signin" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    signIn: ({ user }) => Boolean(user.email),
    jwt: async ({ token, user }) => {
      if (user?.email) {
        const email = user.email.trim().toLowerCase();
        let isAdmin = isConfigAdmin(email);
        if (!isAdmin) {
          try {
            const db = await database();
            const dbUser = await db.collection("users").findOne({ email }, { projection: { role: 1 } });
            isAdmin = dbUser?.role === "admin";
          } catch (e) {
            console.error("Error verifying admin role in jwt:", e);
          }
        }
        token.isAdmin = Boolean(isAdmin);
      }
      return token;
    },
    session: async ({ session, token }) => {
      const email = session.user?.email?.trim().toLowerCase();
      let isAdmin = token?.isAdmin ?? isConfigAdmin(email);
      if (!isAdmin && email) {
        try {
          const db = await database();
          const dbUser = await db.collection("users").findOne({ email }, { projection: { role: 1 } });
          isAdmin = dbUser?.role === "admin";
        } catch (e) {
          console.error("Error verifying admin role in session:", e);
        }
      }
      return {
        ...session,
        user: {
          ...session.user,
          isAdmin: Boolean(isAdmin),
        },
      };
    },
  },
});

