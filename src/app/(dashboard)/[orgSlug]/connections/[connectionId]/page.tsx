export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  organisations,
  connections,
  momentConnections,
  moments,
  qualities,
  connectionSpaces,
  spaces,
} from "@/lib/db/schema";
import { and, eq, desc, asc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MomentList } from "@/components/moments/moment-list";
import { QualitySpectrums } from "@/components/qualities/quality-spectrums";
import { SpacePicker } from "@/components/spaces/space-picker";

export default async function ConnectionDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; connectionId: string }>;
}) {
  const { orgSlug, connectionId } = await params;

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, orgSlug))
    .limit(1);

  if (!org) notFound();

  const [connection] = await db
    .select()
    .from(connections)
    .where(
      and(
        eq(connections.id, connectionId),
        eq(connections.organisationId, org.id)
      )
    )
    .limit(1);

  if (!connection) notFound();

  // Get moments for this connection
  const connectionMoments = await db
    .select({
      id: moments.id,
      content: moments.content,
      source: moments.source,
      createdAt: moments.createdAt,
      eventDate: moments.eventDate,
    })
    .from(momentConnections)
    .innerJoin(moments, eq(momentConnections.momentId, moments.id))
    .where(eq(momentConnections.connectionId, connectionId))
    .orderBy(desc(moments.createdAt));

  const qualityRows = await db
    .select({
      spectrum: qualities.spectrum,
      position: qualities.position,
      createdAt: qualities.createdAt,
      source: qualities.source,
    })
    .from(qualities)
    .where(eq(qualities.connectionId, connectionId))
    .orderBy(asc(qualities.createdAt));

  const allSpaces = await db
    .select({ id: spaces.id, name: spaces.name })
    .from(spaces)
    .where(eq(spaces.organisationId, org.id))
    .orderBy(asc(spaces.name));

  const linkedSpaceIds = (
    await db
      .select({ spaceId: connectionSpaces.spaceId })
      .from(connectionSpaces)
      .where(eq(connectionSpaces.connectionId, connectionId))
  ).map((row) => row.spaceId);

  const typeColors: Record<string, string> = {
    person: "bg-sky/10 text-sky",
    organisation: "bg-terracotta/10 text-terracotta",
    group: "bg-moss/10 text-moss",
    community: "bg-amber/10 text-amber",
  };

  return (
    <div className="stagger-children space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl text-bark">
              {connection.name}
            </h1>
            <Badge className={typeColors[connection.type] ?? ""}>
              {connection.type}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            In your network since{" "}
            {connection.createdAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Link
          href={`/${orgSlug}/moments/new?connectionId=${connectionId}`}
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white shadow-lift transition-all hover:bg-terracotta-dark hover:shadow-hover"
        >
          Add moment
        </Link>
      </div>

      {/* The story leads: relationships are narratives, not records */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-lift sm:p-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          The story so far
        </h2>
        {connection.threadSummary ? (
          <p className="mt-3 font-serif text-lg leading-relaxed text-bark">
            {connection.threadSummary}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">
            No story yet. As you record moments with{" "}
            {connection.name}, Mycelium will write and keep a living narrative
            of this relationship here.
          </p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr] lg:items-start">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-lift">
          <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Qualities
          </h2>
          <div className="mt-4">
            <QualitySpectrums
              qualities={qualityRows}
              connectionId={connectionId}
              organisationId={org.id}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-lift">
          <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Spaces
          </h2>
          <div className="mt-4">
            <SpacePicker
              connectionId={connectionId}
              organisationId={org.id}
              allSpaces={allSpaces}
              initialSelected={linkedSpaceIds}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl text-bark">Moments together</h2>
        <div className="mt-4">
          <MomentList moments={connectionMoments} orgSlug={orgSlug} />
        </div>
      </div>
    </div>
  );
}
