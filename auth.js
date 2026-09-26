import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const admins = new Set((process.env.ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));

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
    session: ({ session }) => ({ ...session, user: { ...session.user, isAdmin: admins.has(session.user?.email?.toLowerCase()) } }),
  },
});
