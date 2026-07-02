export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import {
  organisations,
  connections,
  momentConnections,
  moments,
} from "@/lib/db/schema";
import { eq, desc, count, max } from "drizzle-orm";
import Link from "next/link";
import { ConnectionList } from "@/components/connections/connection-list";

export default async function ConnectionsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, orgSlug))
    .limit(1);

  if (!org) return null;

  const rows = await db
    .select()
    .from(connections)
    .where(eq(connections.organisationId, org.id))
    .orderBy(desc(connections.updatedAt));

  // Get last moment date and count for each connection
  const momentStats = await db
    .select({
      connectionId: momentConnections.connectionId,
      momentCount: count(momentConnections.momentId),
      lastMomentDate: max(moments.createdAt),
    })
    .from(momentConnections)
    .innerJoin(moments, eq(momentConnections.momentId, moments.id))
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bark">Connections</h1>
          <p className="mt-1 text-sm text-muted">
            {rows.length} {rows.length === 1 ? "connection" : "connections"} in
            your network
          </p>
        </div>
        <Link
          href={`/${orgSlug}/connections/new`}
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark"
        >
          Add connection
        </Link>
      </div>

      <ConnectionList
        connections={connectionsWithStats}
        orgSlug={orgSlug}
      />
    </div>
  );
}
