import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    isAdmin: boolean;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      email: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    isAdmin: boolean;
  }
}
