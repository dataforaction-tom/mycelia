import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/lib/db";
import { users, accounts, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/* eslint-disable @typescript-eslint/no-explicit-any */
let _adapter: ReturnType<typeof DrizzleAdapter> | null = null;

function getRealAdapter() {
  if (!_adapter) {
    _adapter = DrizzleAdapter(getDb() as any, {
      usersTable: users as any,
      accountsTable: accounts as any,
      verificationTokensTable: verificationTokens as any,
    });
  }
  return _adapter;
}

// Proxy that defers adapter creation until runtime.
// Both `get` (property access) and `has` (`in` operator) are trapped so that
// Auth.js sees all expected methods when it checks with `"method" in adapter`.
type Adapter = ReturnType<typeof DrizzleAdapter>;

const lazyAdapter = new Proxy({} as Adapter, {
  get(_target, prop: string | symbol) {
    return (getRealAdapter() as any)[prop];
  },
  has(_target, prop: string | symbol) {
    return prop in getRealAdapter();
  },
  ownKeys() {
    return Reflect.ownKeys(getRealAdapter());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getRealAdapter(), prop);
  },
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: lazyAdapter,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Resend({
      from: process.env.EMAIL_FROM ?? "noreply@mycelium.app",
    }),
    ...(process.env.NODE_ENV === "development"
      ? [
          Credentials({
            id: "dev-login",
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "email" },
            },
            async authorize(credentials) {
              const email = credentials?.email as string;
              if (!email) return null;
              const db = getDb();
              const [existing] = await db
                .select()
                .from(users)
                .where(eq(users.email, email))
                .limit(1);
              if (existing) return existing;
              // Auto-create user in dev
              const [created] = await db
                .insert(users)
                .values({ email, name: email.split("@")[0] })
                .returning();
              return created;
            },
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in?verify=1",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.platformRole = user.platformRole ?? "user";
      }

      if (!user && token.id) {
        const db = getDb();
        const [dbUser] = await db
          .select({ platformRole: users.platformRole })
          .from(users)
          .where(eq(users.id, token.id))
          .limit(1);

        if (dbUser) {
          token.platformRole = dbUser.platformRole;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.platformRole = token.platformRole;
      return session;
    },
  },
});
