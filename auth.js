import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { database } from "@/lib/mongodb";

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
    session: async ({ session }) => {
      const email = session.user?.email?.trim().toLowerCase();
      const user = email && await (await database()).collection("users").findOne({ email }, { projection: { role: 1 } });
      return { ...session, user: { ...session.user, isAdmin: user?.role === "admin" } };
    },
  },
});
