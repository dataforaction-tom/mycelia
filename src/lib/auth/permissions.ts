import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organisationMemberships } from "@/lib/db/schema";

export type OrgRole = "owner" | "admin" | "contributor" | "viewer";

/**
 * Role hierarchy from most to least privileged.
 * Index 0 = highest privilege.
 */
export const ORG_ROLE_HIERARCHY: OrgRole[] = [
  "owner",
  "admin",
  "contributor",
  "viewer",
];

/**
 * Returns true if `userRole` is at least as privileged as `requiredRole`.
 */
export function hasMinRole(userRole: OrgRole, requiredRole: OrgRole): boolean {
  const userIndex = ORG_ROLE_HIERARCHY.indexOf(userRole);
  const requiredIndex = ORG_ROLE_HIERARCHY.indexOf(requiredRole);

  if (userIndex === -1 || requiredIndex === -1) return false;

  return userIndex <= requiredIndex;
}

/**
 * Queries the database for a user's membership in an organisation.
 * Returns the membership row or null.
 */
export async function getMembership(userId: string, organisationId: string) {
  const [membership] = await db
    .select()
    .from(organisationMemberships)
    .where(
      and(
        eq(organisationMemberships.userId, userId),
        eq(organisationMemberships.organisationId, organisationId),
      ),
    )
    .limit(1);

  return membership ?? null;
}

/**
 * Checks that the user holds at least `minRole` in the given organisation.
 * Throws an error if the user has no membership or insufficient role.
 * Returns the membership row on success.
 */
export async function requireMembership(
  userId: string,
  organisationId: string,
  minRole: OrgRole = "viewer",
) {
  const membership = await getMembership(userId, organisationId);

  if (!membership) {
    throw new Error("Not a member of this organisation");
  }

  if (!hasMinRole(membership.role, minRole)) {
    throw new Error(
      `Insufficient role: requires ${minRole}, you have ${membership.role}`,
    );
  }

  return membership;
}
