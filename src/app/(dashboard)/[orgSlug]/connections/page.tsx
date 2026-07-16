export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import {
  organisations,
  connections,
  momentConnections,
  moments,
  connectionSpaces,
  spaces,
} from "@/lib/db/schema";
import { and, eq, desc, count, max, asc } from "drizzle-orm";
import { ConnectionList } from "@/components/connections/connection-list";
import { AddConnectionButton } from "@/components/connections/add-connection-button";
import { SpaceFilterSelect } from "@/components/spaces/space-filter-select";

export default async function ConnectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ spaceId?: string }>;
}) {
  const { orgSlug } = await params;
  const { spaceId } = await searchParams;

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, orgSlug))
    .limit(1);

  if (!org) return null;

  const allSpaces = await db
    .select({ id: spaces.id, name: spaces.name })
    .from(spaces)
    .where(eq(spaces.organisationId, org.id))
    .orderBy(asc(spaces.name));

  const rows = spaceId
    ? await db
        .select({
          id: connections.id,
          organisationId: connections.organisationId,
          name: connections.name,
          type: connections.type,
          threadSummary: connections.threadSummary,
          threadUpdatedAt: connections.threadUpdatedAt,
          metadata: connections.metadata,
          createdAt: connections.createdAt,
          updatedAt: connections.updatedAt,
        })
        .from(connections)
        .innerJoin(
          connectionSpaces,
          eq(connectionSpaces.connectionId, connections.id)
        )
        .where(
          and(
            eq(connections.organisationId, org.id),
            eq(connectionSpaces.spaceId, spaceId)
          )
        )
        .orderBy(desc(connections.updatedAt))
    : await db
        .select()
        .from(connections)
        .where(eq(connections.organisationId, org.id))
        .orderBy(desc(connections.updatedAt));

  // Get last moment date and count for each connection. Scope to this org's
  // moments — without the filter this aggregates momentConnections across
  // every organisation (a full cross-tenant scan whose cost grows with the
  // whole platform, not this org).
  const momentStats = await db
    .select({
      connectionId: momentConnections.connectionId,
      momentCount: count(momentConnections.momentId),
      lastMomentDate: max(moments.createdAt),
    })
    .from(momentConnections)
    .innerJoin(moments, eq(momentConnections.momentId, moments.id))
    .where(eq(moments.organisationId, org.id))
    .groupBy(momentConnections.connectionId);

  const statsMap = new Map(
    momentStats.map((s) => [
      s.connectionId,
      { count: s.momentCount, lastDate: s.lastMomentDate },
    ])
  );

  const connectionsWithStats = rows.map((c) => ({
    ...c,
    momentCount: statsMap.get(c.id)?.count ?? 0,
    lastMomentDate: statsMap.get(c.id)?.lastDate ?? null,
  }));

  return (
    <div className="stagger-children space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-bark text-4xl">Connections</h1>
          <p className="text-muted mt-2">
            {rows.length === 1
              ? "1 relationship you're tending"
              : `${rows.length} relationships you're tending`}
          </p>
        </div>
        <AddConnectionButton />
      </div>

      {allSpaces.length > 0 && (
        <SpaceFilterSelect spaces={allSpaces} selected={spaceId} />
      )}

      <ConnectionList connections={connectionsWithStats} orgSlug={orgSlug} />
    </div>
  );
}
