export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { organisations, connections } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { NetworkViewToggle } from "@/components/network/network-view-toggle";
import { Spores } from "@/components/network/spores";

export default async function NetworkPage({
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

  const [threadCount] = await db
    .select({ value: count() })
    .from(connections)
    .where(eq(connections.organisationId, org.id));

  return (
    // The whole screen is under the soil: title, filters and graph share
    // one dark world, per the prototype.
    <div className="underground relative min-h-[calc(100vh-7rem)] overflow-hidden rounded-3xl p-6 sm:p-8">
      <Spores count={5} seed={17} />
      <div className="relative">
        <h1 className="font-display text-4xl text-soil-ink">Under the soil</h1>
        <p className="mt-2 text-sm text-soil-ink-soft">
          {threadCount.value}{" "}
          {threadCount.value === 1 ? "living thread" : "living threads"} ·
          brighter means warmer, closer means stronger
        </p>
      </div>
      <div className="relative mt-6">
        <NetworkViewToggle organisationId={org.id} orgSlug={orgSlug} />
      </div>
    </div>
  );
}
