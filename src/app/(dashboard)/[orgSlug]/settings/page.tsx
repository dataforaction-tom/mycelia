export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMembership, hasMinRole } from "@/lib/auth/permissions";
import { OrgSettingsForm } from "@/components/organisations/org-settings-form";
import { ClearDemoData } from "@/components/organisations/clear-demo-data";
import { ExportButton } from "@/components/export/export-button";

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

  // The viewer's role gates the whole-org export (admin+); the API enforces
  // the same, this just hides the affordance for members below admin.
  const session = await auth();
  const membership = session?.user?.id
    ? await getMembership(session.user.id, org.id)
    : null;
  const canExportOrg = membership
    ? hasMinRole(membership.role, "admin")
    : false;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bark">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Manage your organisation details
        </p>
      </div>

      <OrgSettingsForm org={org} />

      {Boolean((org.settings as { demo?: unknown } | null)?.demo) && (
        <ClearDemoData organisationId={org.id} />
      )}

      {canExportOrg && (
        <div className="space-y-3 border-t border-border pt-6">
          <div>
            <h2 className="text-sm font-semibold text-bark">Export</h2>
            <p className="mt-1 text-sm text-muted">
              Download all your organisation&apos;s data (JSON, YAML, and a
              Markdown/OKF bundle).
            </p>
          </div>
          <ExportButton
            url="/api/export"
            organisationId={org.id}
            fallbackFilename="tending-export.zip"
            label="Export everything"
          />
        </div>
      )}

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
        <Link
          href={`/${orgSlug}/settings/developers`}
          className="text-terracotta hover:text-terracotta-dark"
        >
          Developers
        </Link>
      </div>
    </div>
  );
}
