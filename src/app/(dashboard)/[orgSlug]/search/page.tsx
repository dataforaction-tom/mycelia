export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import {
  organisations,
  connections,
  moments,
  momentConnections,
} from "@/lib/db/schema";
import { and, count, desc, eq, ilike, inArray, max, sql } from "drizzle-orm";
import { ConnectionCard } from "@/components/connections/connection-card";
import { MomentList } from "@/components/moments/moment-list";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { orgSlug } = await params;
  const { q } = await searchParams;
  const term = (q ?? "").trim();

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, orgSlug))
    .limit(1);

  if (!org) return null;

  const hasQuery = term.length >= 2;

  const connectionRows = hasQuery
    ? await db
        .select({
          id: connections.id,
          name: connections.name,
          type: connections.type,
          createdAt: connections.createdAt,
          updatedAt: connections.updatedAt,
        })
        .from(connections)
        .where(
          and(
            eq(connections.organisationId, org.id),
            ilike(connections.name, `%${term}%`)
          )
        )
        .orderBy(desc(connections.updatedAt))
        .limit(20)
    : [];

  const connectionMomentStats = connectionRows.length
    ? await db
        .select({
          connectionId: momentConnections.connectionId,
          momentCount: count(momentConnections.momentId),
          lastMomentDate: max(moments.createdAt),
        })
        .from(momentConnections)
        .innerJoin(moments, eq(momentConnections.momentId, moments.id))
        .where(
          inArray(
            momentConnections.connectionId,
            connectionRows.map((c) => c.id)
          )
        )
        .groupBy(momentConnections.connectionId)
    : [];

  const statsMap = new Map(
    connectionMomentStats.map((s) => [
      s.connectionId,
      { count: Number(s.momentCount), lastDate: s.lastMomentDate },
    ])
  );

  const connectionsWithStats = connectionRows.map((c) => ({
    ...c,
    momentCount: statsMap.get(c.id)?.count ?? 0,
    lastMomentDate: statsMap.get(c.id)?.lastDate ?? null,
  }));

  const momentRows = hasQuery
    ? await db
        .select({
          id: moments.id,
          content: moments.content,
          source: moments.source,
          createdAt: moments.createdAt,
          eventDate: moments.eventDate,
        })
        .from(moments)
        .where(
          and(
            eq(moments.organisationId, org.id),
            sql`to_tsvector('english', ${moments.content}) @@ plainto_tsquery('english', ${term})`
          )
        )
        .orderBy(desc(moments.createdAt))
        .limit(30)
    : [];

  const momentConnectionLinks = momentRows.length
    ? await db
        .select({
          momentId: momentConnections.momentId,
          id: connections.id,
          name: connections.name,
          type: connections.type,
        })
        .from(momentConnections)
        .innerJoin(connections, eq(momentConnections.connectionId, connections.id))
        .where(
          inArray(
            momentConnections.momentId,
            momentRows.map((m) => m.id)
          )
        )
    : [];

  const momentConnectionsMap = new Map<
    string,
    { id: string; name: string; type: string }[]
  >();
  for (const link of momentConnectionLinks) {
    const list = momentConnectionsMap.get(link.momentId) ?? [];
    list.push({ id: link.id, name: link.name, type: link.type });
    momentConnectionsMap.set(link.momentId, list);
  }

  const momentsWithConnections = momentRows.map((m) => ({
    ...m,
    connections: momentConnectionsMap.get(m.id) ?? [],
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl text-bark">Search</h1>
        <form method="GET" className="mt-5">
          <input
            type="text"
            name="q"
            defaultValue={term}
            placeholder="A name, a place, a conversation…"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-bark shadow-lift placeholder:text-muted-light focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </form>
      </div>

      {!hasQuery ? (
        <p className="text-sm text-muted">
          Type at least 2 characters to search across connections and moments.
        </p>
      ) : (
        <>
          <div>
            <h2 className="font-display text-xl text-bark">Connections</h2>
            {connectionsWithStats.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border bg-surface/60 p-8 text-center">
                <p className="text-sm text-muted">
                  No connections match &ldquo;{term}&rdquo;.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

          <div>
            <h2 className="font-display text-xl text-bark">Moments</h2>
            {momentsWithConnections.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border bg-surface/60 p-8 text-center">
                <p className="text-sm text-muted">
                  No moments mention &ldquo;{term}&rdquo;.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <MomentList moments={momentsWithConnections} orgSlug={orgSlug} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
