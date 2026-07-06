export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SpaceForm } from "@/components/spaces/space-form";

export default async function NewSpacePage({
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
        <h1 className="text-2xl font-bold text-bark">New space</h1>
        <p className="mt-1 text-sm text-muted">
          What project, idea, or theme should this group together?
        </p>
      </div>

      <SpaceForm organisationId={org.id} orgSlug={orgSlug} />
    </div>
  );
}
