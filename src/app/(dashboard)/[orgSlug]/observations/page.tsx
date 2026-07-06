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
    <div className="stagger-children space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-bark">Observations</h1>
          <p className="mt-2 text-muted">
            Patterns the network has noticed, offered gently.
          </p>
        </div>
        <GeneratePatternsButton organisationId={org.id} />
      </div>

      <ObservationStatusFilter selected={status} />

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface/60 p-10 text-center">
          <p className="font-display text-lg text-bark">All quiet for now</p>
          <p className="mt-1.5 max-w-md text-sm text-muted">
            Choose &ldquo;Check for patterns&rdquo; to look for dormant
            connections, quality shifts, and relationships your network
            depends on.
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
