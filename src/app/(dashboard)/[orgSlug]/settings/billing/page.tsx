export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PlanSelector } from "@/components/billing/plan-selector";

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ success?: string; cancelled?: string }>;
}) {
  const { orgSlug } = await params;
  const { success, cancelled } = await searchParams;

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, orgSlug))
    .limit(1);

  if (!org) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-bark text-2xl">Billing</h1>
        <p className="text-muted mt-1 text-sm">
          One flat plan — £5 a month, everything included
        </p>
      </div>

      {success && (
        <div
          role="status"
          aria-live="polite"
          className="border-moss/30 bg-moss/10 text-moss-dark rounded-lg border p-4 text-sm"
        >
          Your subscription has been activated successfully.
        </div>
      )}

      {cancelled && (
        <div className="border-amber/30 bg-amber/10 text-bark rounded-lg border p-4 text-sm">
          Checkout was cancelled. No charges were made.
        </div>
      )}

      <PlanSelector
        organisationId={org.id}
        plan={org.plan}
        trialEndsAt={org.trialEndsAt ? org.trialEndsAt.toISOString() : null}
      />
    </div>
  );
}
