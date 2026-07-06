export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import {
  organisations,
  moments,
  momentConnections,
  connections,
  spaces,
} from "@/lib/db/schema";
import { and, eq, desc, inArray, asc } from "drizzle-orm";
import Link from "next/link";
import { MomentList } from "@/components/moments/moment-list";
import { SpaceFilterSelect } from "@/components/spaces/space-filter-select";

export default async function MomentsPage({
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

  const conditions = [eq(moments.organisationId, org.id)];
  if (spaceId) conditions.push(eq(moments.spaceId, spaceId));

  const rows = await db
    .select({
      id: moments.id,
      content: moments.content,
      source: moments.source,
      createdAt: moments.createdAt,
      eventDate: moments.eventDate,
    })
    .from(moments)
    .where(and(...conditions))
    .orderBy(desc(moments.createdAt));

  const links = rows.length
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
            rows.map((m) => m.id)
          )
        )
    : [];

  const connectionsByMoment = new Map<
    string,
    { id: string; name: string; type: string }[]
  >();
  for (const link of links) {
    const list = connectionsByMoment.get(link.momentId) ?? [];
    list.push({ id: link.id, name: link.name, type: link.type });
    connectionsByMoment.set(link.momentId, list);
  }

  const momentsWithConnections = rows.map((m) => ({
    ...m,
    connections: connectionsByMoment.get(m.id) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bark">Moments</h1>
          <p className="mt-1 text-sm text-muted">
            {rows.length} {rows.length === 1 ? "moment" : "moments"} recorded
          </p>
        </div>
        <Link
          href={`/${orgSlug}/moments/new`}
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark"
        >
          Record a moment
        </Link>
      </div>

      {allSpaces.length > 0 && (
        <SpaceFilterSelect spaces={allSpaces} selected={spaceId} />
      )}

      <MomentList moments={momentsWithConnections} orgSlug={orgSlug} />
    </div>
  );
}
