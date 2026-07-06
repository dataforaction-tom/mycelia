export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { organisations, observations, connections } from "@/lib/db/schema";
import { and, eq, desc, inArray } from "drizzle-orm";
import { ObservationCard } from "@/components/observations/observation-card";
import { ObservationStatusFilter } from "@/components/observations/observation-status-filter";
import { GeneratePatternsButton } from "@/components/observations/generate-patterns-button";

export default async function ObservationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { orgSlug } = await params;
  const { status } = await searchParams;

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, orgSlug))
    .limit(1);

  if (!org) return null;

  const conditions = [eq(observations.organisationId, org.id)];
  if (status) {
    conditions.push(
      eq(
        observations.status,
        status as "new" | "seen" | "acted_on" | "dismissed"
      )
    );
  }

  const rows = await db
    .select()
    .from(observations)
    .where(and(...conditions))
    .orderBy(desc(observations.createdAt));

  const connectionIds = [...new Set(rows.flatMap((r) => r.connections))];

  const linkedConnections = connectionIds.length
    ? await db
        .select({ id: connections.id, name: connections.name, type: connections.type })
        .from(connections)
        .where(inArray(connections.id, connectionIds))
    : [];

  const connectionById = new Map(linkedConnections.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bark">Observations</h1>
          <p className="mt-1 text-sm text-muted">
            Gentle patterns noticed across your network
          </p>
        </div>
        <GeneratePatternsButton organisationId={org.id} />
      </div>

      <ObservationStatusFilter selected={status} />

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-white p-8 text-center">
          <p className="text-sm text-muted">
            No observations yet. Click &ldquo;Check for patterns&rdquo; to
            look for dormant connections, quality shifts, and structural
            dependencies across your network.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((observation) => (
            <ObservationCard
              key={observation.id}
              id={observation.id}
              type={observation.type}
              content={observation.content}
              severity={observation.severity}
              status={observation.status}
              connections={observation.connections
                .map((id) => connectionById.get(id))
                .filter((c): c is NonNullable<typeof c> => Boolean(c))}
              organisationId={org.id}
              orgSlug={orgSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
