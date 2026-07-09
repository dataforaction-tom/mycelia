export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { organisations, observations, connections } from "@/lib/db/schema";
import { and, eq, desc, inArray, ne } from "drizzle-orm";
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

  const conditions = [
    eq(observations.organisationId, org.id),
    // Follow-up reminders awaiting their due date are hidden here — the daily
    // cron flips them to "new" once due, and only then do they appear.
    ne(observations.status, "scheduled"),
  ];
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

  // The single most-severe, most-recent unresolved observation gets the
  // large featured slot; everything else (including resolved rows) sits in
  // the grid. Rows are already ordered by recency, so a stable severity
  // sort keeps ties recency-first.
  const severityRank: Record<string, number> = {
    important: 0,
    noteworthy: 1,
    gentle: 2,
  };
  const unresolved = rows.filter(
    (r) => r.status === "new" || r.status === "seen"
  );
  const featured = [...unresolved].sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity]
  )[0];
  const rest = rows.filter((r) => r.id !== featured?.id);

  return (
    <div className="stagger-children space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-bark">Field notes</h1>
          <p className="mt-2 text-muted">
            Patterns the network is showing you — noticed, not measured
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
        <div className="grid gap-4 lg:grid-cols-2">
          {featured && (
            <div className="lg:row-span-2">
              <ObservationCard
                key={featured.id}
                id={featured.id}
                type={featured.type}
                content={featured.content}
                severity={featured.severity}
                status={featured.status}
                connections={featured.connections
                  .map((id) => connectionById.get(id))
                  .filter((c): c is NonNullable<typeof c> => Boolean(c))}
                organisationId={org.id}
                orgSlug={orgSlug}
                featured
              />
            </div>
          )}
          {rest.map((observation) => (
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
