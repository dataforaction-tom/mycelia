export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  organisations,
  connections,
  momentConnections,
  moments,
  qualities,
} from "@/lib/db/schema";
import { and, eq, desc, asc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MomentList } from "@/components/moments/moment-list";
import { QualitySpectrums } from "@/components/qualities/quality-spectrums";

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

  const typeColors: Record<string, string> = {
    person: "bg-sky/10 text-sky",
    organisation: "bg-terracotta/10 text-terracotta",
    group: "bg-moss/10 text-moss",
    community: "bg-amber/10 text-amber",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-bark">{connection.name}</h1>
            <Badge className={typeColors[connection.type] ?? ""}>
              {connection.type}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            Added{" "}
            {connection.createdAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Link
          href={`/${orgSlug}/moments/new?connectionId=${connectionId}`}
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark"
        >
          Add moment
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <h2 className="text-sm font-semibold text-muted">Story</h2>
        {connection.threadSummary ? (
          <p className="mt-2 font-serif text-bark leading-relaxed">
            {connection.threadSummary}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No story yet — as moments build up, a narrative summary of this
            relationship will appear here.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <h2 className="text-sm font-semibold text-muted">Qualities</h2>
        <div className="mt-4">
          <QualitySpectrums
            qualities={qualityRows}
            connectionId={connectionId}
            organisationId={org.id}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-bark">Moments</h2>
        <div className="mt-4">
          <MomentList moments={connectionMoments} orgSlug={orgSlug} />
        </div>
      </div>
    </div>
  );
}
