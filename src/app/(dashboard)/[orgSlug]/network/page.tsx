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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bark">Network</h1>
        <p className="mt-1 text-sm text-muted">
          A force-directed view of your relational ecosystem.
        </p>
      </div>
      <NetworkViewToggle organisationId={org.id} orgSlug={orgSlug} />
    </div>
  );
}
