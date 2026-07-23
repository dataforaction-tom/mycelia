import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { users, accounts, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Never a valid bcrypt hash for any real password — compared against on
// every failed lookup so authorize() takes the same time whether the email
// exists or not, closing a user-enumeration timing side-channel.
const DUMMY_PASSWORD_HASH =
  "$2b$12$CwTycUXWue0Thq9StjUM0uJ8Q3f2jjOxOOAmyMNPKlp5GsjR7yCu6";

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
    // Magic link is the primary sign-in and always available: the email
    // address doubles as the identity invites are sent to, and a
    // successful magic-link sign-in is the one action that proves inbox
    // ownership (see the `signIn` callback's reclaim logic below).
    Resend({
      from: process.env.EMAIL_FROM ?? "noreply@tending.network",
      // Tending-styled magic link instead of NextAuth's default template.
      // Throws on failure so the sign-in page reports the error rather
      // than claiming "check your email".
      async sendVerificationRequest({ identifier, url }) {
        const { sendMagicLinkEmail } = await import("@/lib/email/messages");
        // Never email the raw callback URL directly: corporate link
        // scanners (Microsoft Safe Links, Proofpoint, Mimecast) prefetch
        // every link in an email to scan it for phishing, which silently
        // burns the single-use token before the real user ever clicks.
        // Wrapping it in an interstitial page that requires an actual
        // button click defeats that prefetch (scanners fetch, they don't
        // click) — see src/app/(auth)/sign-in/confirm/page.tsx.
        const confirmUrl = new URL("/sign-in/confirm", url);
        confirmUrl.search = "";
        confirmUrl.searchParams.set("url", url);
        await sendMagicLinkEmail(identifier, confirmUrl.toString());
      },
    }),
    Credentials({
      id: "password",
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const db = getDb();
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        // Compare against a dummy hash even on a miss so a non-existent
        // account and a wrong password take the same amount of time.
        const hash = existing?.passwordHash ?? DUMMY_PASSWORD_HASH;
        const valid = await bcrypt.compare(password, hash);
        if (!existing || !existing.passwordHash || !valid) return null;

        return existing;
      },
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
              // Dev-login bypasses the adapter, so accept invites here too.
              const { acceptPendingInvitations } = await import(
                "@/lib/invitations/accept"
              );
              await acceptPendingInvitations(created.id, created.email);
              return created;
            },
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  events: {
    // When a brand-new user is created (their first magic-link sign-in),
    // fold in any organisation invitations waiting on their email address.
    async createUser({ user }) {
      if (!user.id) return;
      const { acceptPendingInvitations } = await import(
        "@/lib/invitations/accept"
      );
      await acceptPendingInvitations(user.id, user.email);
    },
  },
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in?verify=1",
  },
  callbacks: {
    // Block suspended accounts at sign-in. The verification email may still be
    // sent, but the sign-in cannot complete.
    async signIn({ user, account }) {
      if ((user as { status?: string }).status === "suspended") return false;

      // A successful magic-link sign-in is the one moment we know for
      // certain the person controls this inbox. If this is the *first*
      // time that's been proven (emailVerified still null on the existing
      // row), treat it as reclaiming the account: evict any password set
      // before proof — closing the account-pre-hijacking hole where an
      // attacker pre-registers someone else's email with a password of
      // their own choosing — and release invitations that were withheld
      // pending verification (see the register route, which deliberately
      // skips acceptPendingInvitations for unverified accounts).
      //
      // Re-fetch by email rather than trusting `user` here: for a
      // brand-new magic-link signup `user.id` is a client-fabricated stub
      // that doesn't exist in the DB yet (the row is created after this
      // callback runs), so `existing` is correctly undefined and this
      // block is skipped — that case is already handled by the
      // `createUser` event below.
      if (account?.provider === "resend" && user.email) {
        const db = getDb();
        const [existing] = await db
          .select({
            id: users.id,
            emailVerified: users.emailVerified,
            passwordHash: users.passwordHash,
          })
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (existing && !existing.emailVerified) {
          if (existing.passwordHash) {
            await db
              .update(users)
              .set({ passwordHash: null })
              .where(eq(users.id, existing.id));
          }
          const { acceptPendingInvitations } = await import(
            "@/lib/invitations/accept"
          );
          await acceptPendingInvitations(existing.id, user.email);
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id!;
        token.platformRole = user.platformRole ?? "user";
        token.tokenVersion = user.tokenVersion ?? 0;
      }

      // `account` is only present on the JWT callback invocation right
      // after a sign-in, not on later refreshes — so this records which
      // provider authenticated *this* token, and when, rather than being
      // overwritten on every request. See wasRecentlyVerifiedByEmail, which
      // uses it to let a magic link stand in for a forgotten password.
      if (account) {
        token.authProvider = account.provider;
        token.authTime = Date.now();
      }

      if (!user && token.id) {
        const db = getDb();
        const [dbUser] = await db
          .select({
            platformRole: users.platformRole,
            status: users.status,
            tokenVersion: users.tokenVersion,
          })
          .from(users)
          .where(eq(users.id, token.id))
          .limit(1);

        // Retire the session (returning null) when the account is gone,
        // suspended, or has been forcibly signed out (tokenVersion bumped).
        // Tokens minted before this field existed default to 0 and so are
        // left intact until an admin actually bumps the version.
        if (!dbUser) return null;
        if (dbUser.status === "suspended") return null;
        if (dbUser.tokenVersion !== (token.tokenVersion ?? 0)) return null;

        token.platformRole = dbUser.platformRole;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.platformRole = token.platformRole;
      session.authProvider = token.authProvider;
      session.authTime = token.authTime;
      return session;
    },
  },
});
