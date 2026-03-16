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
        // Normalize ADMIN_PASSWORD in case the value was stored with escaped dollar
        // signs (e.g. "\$2b\$...") which can happen when exporting from some
        // shells or tools. Convert "\$" → "$" so bcrypt compare works.
        const rawAdminPassword = process.env.ADMIN_PASSWORD ?? "";
        const adminPasswordHash = rawAdminPassword.replace(/\\\$/g, "$");

        if (!adminEmail || !adminPasswordHash) return null;

        if (!adminEmail) return null;
        if (String(credentials.email).toLowerCase() !== String(adminEmail).toLowerCase())
          return null;

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
