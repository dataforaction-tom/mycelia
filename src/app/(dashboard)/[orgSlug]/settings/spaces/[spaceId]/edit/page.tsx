export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { organisations, spaces } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { SpaceForm } from "@/components/spaces/space-form";

export default async function EditSpacePage({
  params,
}: {
  params: Promise<{ orgSlug: string; spaceId: string }>;
}) {
  const { orgSlug, spaceId } = await params;

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, orgSlug))
    .limit(1);

  if (!org) notFound();

  const [space] = await db
    .select()
    .from(spaces)
    .where(and(eq(spaces.id, spaceId), eq(spaces.organisationId, org.id)))
    .limit(1);

  if (!space) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bark">Edit space</h1>
      </div>

      <SpaceForm organisationId={org.id} orgSlug={orgSlug} space={space} />
    </div>
  );
}
