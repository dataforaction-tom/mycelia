import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

/**
 * Platform-level (as opposed to organisation-level) authorization.
 *
 * `platformRole` lives on the user and flows into the JWT/session, refreshed
 * from the DB on every request (see src/lib/auth/index.ts). These helpers are
 * the first and only consumers of it — org access is governed separately in
 * ./permissions.ts.
 */

export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.platformRole === "super_admin";
}

/**
 * Guard for admin API route handlers. Throws "Forbidden" for anyone who is
 * not a super_admin (mirrors requireMembership's throw-on-failure contract).
 * Middleware deliberately skips /api, so every admin route must call this
 * itself — do not rely on the layout guard for API protection.
 */
export async function requireSuperAdmin() {
  const session = await auth();
  if (!isSuperAdmin(session)) {
    throw new Error("Forbidden");
  }
  // isSuperAdmin guarantees a session with a user; assert for the type system.
  return session!.user;
}
