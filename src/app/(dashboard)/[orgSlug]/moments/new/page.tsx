export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { organisations, connections, spaces } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { MomentForm } from "@/components/moments/moment-form";

export default async function NewMomentPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ connectionId?: string }>;
}) {
  const { orgSlug } = await params;
  const { connectionId } = await searchParams;

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, orgSlug))
    .limit(1);

  if (!org) return null;

  const allConnections = await db
    .select({ id: connections.id, name: connections.name, type: connections.type })
    .from(connections)
    .where(eq(connections.organisationId, org.id));

  const allSpaces = await db
    .select({ id: spaces.id, name: spaces.name })
    .from(spaces)
    .where(eq(spaces.organisationId, org.id))
    .orderBy(asc(spaces.name));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bark">Record a moment</h1>
        <p className="mt-1 text-sm text-muted">
          What happened? Tell us in your own words.
        </p>
      </div>

      <MomentForm
        organisationId={org.id}
        orgSlug={orgSlug}
        connections={allConnections}
        spaces={allSpaces}
        preselectedConnectionId={connectionId}
      />
    </div>
  );
}
