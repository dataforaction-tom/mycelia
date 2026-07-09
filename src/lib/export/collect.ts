import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  organisations,
  connections,
  moments,
  momentConnections,
  spaces,
  connectionSpaces,
  qualities,
  observations,
  networkLinks,
  organisationMemberships,
  users,
} from "@/lib/db/schema";
import type { OrgExport, ExportMember } from "./types";

/**
 * The set of org-owned entities `collectOrgData` mirrors into an export.
 * The coverage guard test asserts against this so the export can never
 * silently drop (or forget to add) an entity as the schema grows.
 */
export const EXPORTED_ENTITY_KEYS = new Set([
  "connections",
  "moments",
  "momentConnections",
  "spaces",
  "connectionSpaces",
  "qualities",
  "observations",
  "networkLinks",
  "members",
] as const);

/**
 * Read every org-owned table for a single organisation and assemble a plain
 * `OrgExport` graph. This is a faithful mirror: if any read throws we let it
 * propagate so callers never persist a partial export.
 *
 * Scoping notes:
 * - `connections`, `moments`, `spaces`, `observations`, `networkLinks` are
 *   scoped directly by `organisationId`.
 * - `momentConnections` has no org column — scope it by the org's moment ids.
 * - `connectionSpaces` and `qualities` have no org column — scope them by the
 *   org's connection ids.
 * - Drizzle's `inArray(col, [])` is unsafe, so when an id list is empty we
 *   short-circuit to `[]` rather than querying.
 * - `members` joins memberships → users and exposes only role/name/email —
 *   never password, tokens, or other secret columns.
 */
export async function collectOrgData(orgId: string): Promise<OrgExport> {
  const [
    organisationRow,
    connectionRows,
    momentRows,
    spaceRows,
    observationRows,
    networkLinkRows,
    memberRows,
  ] = await Promise.all([
    db
      .select({
        id: organisations.id,
        name: organisations.name,
        slug: organisations.slug,
        plan: organisations.plan,
        createdAt: organisations.createdAt,
      })
      .from(organisations)
      .where(eq(organisations.id, orgId)),
    db.select().from(connections).where(eq(connections.organisationId, orgId)),
    db.select().from(moments).where(eq(moments.organisationId, orgId)),
    db.select().from(spaces).where(eq(spaces.organisationId, orgId)),
    db
      .select()
      .from(observations)
      .where(eq(observations.organisationId, orgId)),
    db
      .select()
      .from(networkLinks)
      .where(eq(networkLinks.organisationId, orgId)),
    db
      .select({
        role: organisationMemberships.role,
        name: users.name,
        email: users.email,
      })
      .from(organisationMemberships)
      .innerJoin(users, eq(organisationMemberships.userId, users.id))
      .where(eq(organisationMemberships.organisationId, orgId)),
  ]);

  const connectionIds = connectionRows.map((row) => row.id);
  const momentIds = momentRows.map((row) => row.id);

  const [connectionSpaceRows, qualityRows, momentConnectionRows] =
    await Promise.all([
      connectionIds.length === 0
        ? Promise.resolve([])
        : db
            .select()
            .from(connectionSpaces)
            .where(inArray(connectionSpaces.connectionId, connectionIds)),
      connectionIds.length === 0
        ? Promise.resolve([])
        : db
            .select()
            .from(qualities)
            .where(inArray(qualities.connectionId, connectionIds)),
      momentIds.length === 0
        ? Promise.resolve([])
        : db
            .select()
            .from(momentConnections)
            .where(inArray(momentConnections.momentId, momentIds)),
    ]);

  const organisation = organisationRow[0];
  if (!organisation) {
    throw new Error(`Organisation not found: ${orgId}`);
  }

  const members: ExportMember[] = memberRows;

  return {
    exportedAt: new Date().toISOString(),
    organisation,
    connections: connectionRows,
    moments: momentRows,
    momentConnections: momentConnectionRows,
    spaces: spaceRows,
    connectionSpaces: connectionSpaceRows,
    qualities: qualityRows,
    observations: observationRows,
    networkLinks: networkLinkRows,
    members,
  };
}
