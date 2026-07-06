export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { organisations, spaces } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { SpaceList } from "@/components/spaces/space-list";

export default async function SpacesSettingsPage({
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
    .select()
    .from(spaces)
    .where(eq(spaces.organisationId, org.id))
    .orderBy(desc(spaces.createdAt));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bark">Spaces</h1>
          <p className="mt-1 text-sm text-muted">
            Group connections and moments around a project, idea, or theme
          </p>
        </div>
        <Link
          href={`/${orgSlug}/settings/spaces/new`}
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark"
        >
          New space
        </Link>
      </div>

      <SpaceList spaces={rows} organisationId={org.id} orgSlug={orgSlug} />
    </div>
  );
}
