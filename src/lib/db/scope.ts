import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections, spaces, moments } from "@/lib/db/schema";

/**
 * Cross-tenant write guards.
 *
 * A scoped SELECT (`WHERE organisationId = ...`) naturally prevents reading
 * another org's rows, but an INSERT / UPDATE / link-row write has no such
 * natural guard: a caller can supply another org's resource UUIDs and the
 * write lands against that org (IDOR). Every route that inserts or links
 * records by a user-supplied `connectionId` / `spaceId` / `momentId` must
 * first confirm those IDs belong to the caller's org using these helpers.
 */

/** Return the subset of `ids` that are connections belonging to the org. */
export async function ownedConnectionIds(
  ids: string[],
  organisationId: string,
): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select({ id: connections.id })
    .from(connections)
    .where(
      and(
        eq(connections.organisationId, organisationId),
        inArray(connections.id, ids),
      ),
    );
  return rows.map((row) => row.id);
}

/** Return the subset of `ids` that are spaces belonging to the org. */
export async function ownedSpaceIds(
  ids: string[],
  organisationId: string,
): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select({ id: spaces.id })
    .from(spaces)
    .where(
      and(eq(spaces.organisationId, organisationId), inArray(spaces.id, ids)),
    );
  return rows.map((row) => row.id);
}

/** Whether `connectionId` exists and belongs to the org. */
export async function isConnectionInOrg(
  connectionId: string,
  organisationId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: connections.id })
    .from(connections)
    .where(
      and(
        eq(connections.id, connectionId),
        eq(connections.organisationId, organisationId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/** Whether `momentId` exists and belongs to the org. */
export async function isMomentInOrg(
  momentId: string,
  organisationId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: moments.id })
    .from(moments)
    .where(
      and(eq(moments.id, momentId), eq(moments.organisationId, organisationId)),
    )
    .limit(1);
  return Boolean(row);
}
