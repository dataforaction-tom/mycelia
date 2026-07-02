export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ConnectionForm } from "@/components/connections/connection-form";

export default async function NewConnectionPage({
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bark">Add a connection</h1>
        <p className="mt-1 text-sm text-muted">
          Who matters to your organisation? Tell us about them.
        </p>
      </div>

      <ConnectionForm organisationId={org.id} orgSlug={orgSlug} />
    </div>
  );
}
