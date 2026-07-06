export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import {
  organisations,
  moments,
  momentConnections,
  connections,
} from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { MomentList } from "@/components/moments/moment-list";

export default async function MomentsPage({
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
    .select({
      id: moments.id,
      content: moments.content,
      source: moments.source,
      createdAt: moments.createdAt,
      eventDate: moments.eventDate,
    })
    .from(moments)
    .where(eq(moments.organisationId, org.id))
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

      <MomentList moments={momentsWithConnections} orgSlug={orgSlug} />
    </div>
  );
}
