import "next-auth";
import "next-auth/jwt";

type PlatformRole = "super_admin" | "user";

declare module "next-auth" {
  interface User {
    platformRole?: PlatformRole;
    status?: "active" | "suspended";
    tokenVersion?: number;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      platformRole: PlatformRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    platformRole: PlatformRole;
    tokenVersion?: number;
  }
}
