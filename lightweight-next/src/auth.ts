import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/db";
import { loginSchema } from "@/lib/validations/auth";
import { users } from "../drizzle/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { username, password } = parsed.data;

        const user = await db.query.users.findFirst({
          where: eq(users.username, username),
        });
        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(
          password,
          user.passwordHash
        );
        if (!passwordsMatch) return null;

        return {
          id: String(user.id),
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.email = user.email;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.user.email = token.email;
      session.user.isAdmin = token.isAdmin;
      return session;
    },
    authorized: ({ auth }) => !!auth?.user,
  },
});
