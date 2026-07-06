export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NetworkViewToggle } from "@/components/network/network-view-toggle";

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

  return (
    <div className="stagger-children space-y-6">
      <div>
        <h1 className="font-display text-4xl text-bark">The network</h1>
        <p className="mt-2 text-muted">
          Beneath the day-to-day, your relationships form a living web. This
          is what it looks like right now.
        </p>
      </div>
      <NetworkViewToggle organisationId={org.id} orgSlug={orgSlug} />
    </div>
  );
}
