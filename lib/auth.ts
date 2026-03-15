import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPasswordHash) return null;

        if (credentials.email !== adminEmail) return null;

        const isValid = await compare(
          credentials.password as string,
          adminPasswordHash
        );

        if (!isValid) return null;

        return {
          id: "admin",
          email: adminEmail,
          name: "Admin",
        };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const isAdmin = request.nextUrl.pathname.startsWith("/admin");
      const isLoginPage = request.nextUrl.pathname === "/admin/login";

      if (isAdmin && !isLoginPage && !auth?.user) {
        return Response.redirect(
          new URL("/admin/login", request.nextUrl.origin)
        );
      }

      if (isLoginPage && auth?.user) {
        return Response.redirect(
          new URL("/admin", request.nextUrl.origin)
        );
      }

      return true;
    },
  },
});
