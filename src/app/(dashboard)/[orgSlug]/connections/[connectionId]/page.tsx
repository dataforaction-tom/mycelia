export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  organisations,
  connections,
  momentConnections,
  moments,
} from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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

      {connection.threadSummary && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="text-sm font-semibold text-muted">Story</h2>
          <p className="mt-2 font-serif text-bark leading-relaxed">
            {connection.threadSummary}
          </p>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-bark">Moments</h2>
        {connectionMoments.length === 0 ? (
          <p className="mt-4 text-muted">
            No moments recorded yet. Start by sharing what&apos;s happening in
            this relationship.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {connectionMoments.map((moment) => (
              <div
                key={moment.id}
                className="rounded-lg border border-border bg-white p-4"
              >
                <p className="text-sm text-bark">{moment.content}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <span>
                    {(moment.eventDate ?? moment.createdAt).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </span>
                  {moment.source !== "manual" && (
                    <span className="rounded bg-cream-dark px-1.5 py-0.5">
                      {moment.source}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
