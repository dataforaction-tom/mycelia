export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { OrgSettingsForm } from "@/components/organisations/org-settings-form";

export default async function SettingsPage({
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
        <h1 className="text-2xl font-bold text-bark">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Manage your organisation details
        </p>
      </div>

      <OrgSettingsForm org={org} />

      <div className="flex gap-4 border-t border-border pt-6 text-sm">
        <Link
          href={`/${orgSlug}/settings/spaces`}
          className="text-terracotta hover:text-terracotta-dark"
        >
          Spaces
        </Link>
        <Link
          href={`/${orgSlug}/settings/members`}
          className="text-terracotta hover:text-terracotta-dark"
        >
          Members
        </Link>
        <Link
          href={`/${orgSlug}/settings/billing`}
          className="text-terracotta hover:text-terracotta-dark"
        >
          Billing
        </Link>
      </div>
    </div>
  );
}
