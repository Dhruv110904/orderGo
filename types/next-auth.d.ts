import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "seller";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "admin" | "seller";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "seller";
  }
}
