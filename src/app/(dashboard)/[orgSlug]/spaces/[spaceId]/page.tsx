export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  organisations,
  spaces,
  connections,
  connectionSpaces,
  moments,
  momentConnections,
} from "@/lib/db/schema";
import { and, eq, desc, inArray, count, max } from "drizzle-orm";
import { SpaceIcon } from "@/lib/config/space-icons";
import { lastGatheringLabel } from "@/lib/spaces/last-gathering";
import { AddMomentButton } from "@/components/moments/add-moment-button";
import { MomentList } from "@/components/moments/moment-list";
import { ConnectionCard } from "@/components/connections/connection-card";

export default async function SpaceDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; spaceId: string }>;
}) {
  const { orgSlug, spaceId } = await params;

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, orgSlug))
    .limit(1);

  if (!org) notFound();

  // Org-scope the space lookup so a valid id from another org 404s here too.
  const [space] = await db
    .select()
    .from(spaces)
    .where(and(eq(spaces.id, spaceId), eq(spaces.organisationId, org.id)))
    .limit(1);

  if (!space) notFound();

  // Threads through this space: connections explicitly linked to it (the same
  // set the spaces list counts), newest-touched first.
  const linkedConnections = await db
    .select({
      id: connections.id,
      name: connections.name,
      type: connections.type,
      createdAt: connections.createdAt,
      updatedAt: connections.updatedAt,
      threadSummary: connections.threadSummary,
    })
    .from(connectionSpaces)
    .innerJoin(connections, eq(connectionSpaces.connectionId, connections.id))
    .where(
      and(
        eq(connectionSpaces.spaceId, spaceId),
        eq(connections.organisationId, org.id),
      ),
    )
    .orderBy(desc(connections.updatedAt));

  const connectionIds = linkedConnections.map((c) => c.id);

  // Overall moment activity per connection drives each card's vitality dot —
  // same semantics as the connections list, scoped to just these ids.
  const momentStats = connectionIds.length
    ? await db
        .select({
          connectionId: momentConnections.connectionId,
          momentCount: count(momentConnections.momentId),
          lastMomentDate: max(moments.createdAt),
        })
        .from(momentConnections)
        .innerJoin(moments, eq(momentConnections.momentId, moments.id))
        .where(inArray(momentConnections.connectionId, connectionIds))
        .groupBy(momentConnections.connectionId)
    : [];

  const statsMap = new Map(
    momentStats.map((s) => [
      s.connectionId,
      { count: s.momentCount, lastDate: s.lastMomentDate },
    ]),
  );

  const connectionsWithStats = linkedConnections.map((c) => ({
    ...c,
    momentCount: statsMap.get(c.id)?.count ?? 0,
    lastMomentDate: statsMap.get(c.id)?.lastDate ?? null,
  }));

  // Gatherings here: moments filed to this space, newest first.
  const spaceMoments = await db
    .select({
      id: moments.id,
      content: moments.content,
      source: moments.source,
      createdAt: moments.createdAt,
      eventDate: moments.eventDate,
    })
    .from(moments)
    .where(and(eq(moments.spaceId, spaceId), eq(moments.organisationId, org.id)))
    .orderBy(desc(moments.createdAt));

  const momentIds = spaceMoments.map((m) => m.id);

  // Who each moment involves, so the timeline can link out to their stories.
  const momentConns = momentIds.length
    ? await db
        .select({
          momentId: momentConnections.momentId,
          id: connections.id,
          name: connections.name,
          type: connections.type,
        })
        .from(momentConnections)
        .innerJoin(connections, eq(momentConnections.connectionId, connections.id))
        .where(inArray(momentConnections.momentId, momentIds))
    : [];

  const connectionsByMoment = new Map<
    string,
    { id: string; name: string; type: string }[]
  >();
  for (const row of momentConns) {
    const list = connectionsByMoment.get(row.momentId) ?? [];
    list.push({ id: row.id, name: row.name, type: row.type });
    connectionsByMoment.set(row.momentId, list);
  }

  const momentsWithConnections = spaceMoments.map((m) => ({
    ...m,
    connections: connectionsByMoment.get(m.id) ?? [],
  }));

  // The most recent gathering — event date if given, else when it was recorded.
  const lastGathering = spaceMoments.reduce<Date | null>((latest, m) => {
    const when = m.eventDate ?? m.createdAt;
    return !latest || when > latest ? when : latest;
  }, null);

  const threadCount = connectionsWithStats.length;

  return (
    <div className="stagger-children space-y-8">
      <div>
        <Link
          href={`/${orgSlug}/spaces`}
          className="text-sm text-muted transition-colors hover:text-bark"
        >
          ← All spaces
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <SpaceIcon seed={space.id} />
            <div>
              <h1 className="font-display text-4xl text-bark">{space.name}</h1>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="rounded-full bg-green/10 px-2.5 py-0.5 text-[12px] text-green-dark">
                  {threadCount} {threadCount === 1 ? "thread" : "threads"}
                </span>
                <span className="text-muted-light">
                  {lastGatheringLabel(lastGathering)}
                </span>
              </div>
            </div>
          </div>
          <AddMomentButton seedText={space.name} />
        </div>

        {space.description && (
          <p className="mt-4 max-w-2xl font-serif text-lg leading-relaxed text-bark-light">
            {space.description}
          </p>
        )}
      </div>

      <div>
        <h2 className="font-display text-xl text-bark">Threads through here</h2>
        <p className="mt-1 text-sm text-muted">
          The connections that gather in this space
        </p>
        <div className="mt-4">
          {connectionsWithStats.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface/60 p-8 text-center">
              <p className="text-sm text-muted">
                No threads pass through {space.name} yet. Link a connection to
                this space from their story, or mention it in a moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {connectionsWithStats.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  orgSlug={orgSlug}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl text-bark">Gatherings here</h2>
        <p className="mt-1 text-sm text-muted">
          Moments that happened in this space
        </p>
        <div className="mt-4">
          <MomentList moments={momentsWithConnections} orgSlug={orgSlug} />
        </div>
      </div>
    </div>
  );
}
