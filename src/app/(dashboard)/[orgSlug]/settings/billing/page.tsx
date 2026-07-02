"use client";

import { useParams, useSearchParams } from "next/navigation";
import { PlanSelector } from "@/components/billing/plan-selector";

export default function BillingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orgSlug = params.orgSlug as string;
  const success = searchParams.get("success");
  const cancelled = searchParams.get("cancelled");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bark">Billing</h1>
        <p className="mt-1 text-sm text-muted">
          Manage your subscription and billing
        </p>
      </div>

      {success && (
        <div className="rounded-lg border border-moss/30 bg-moss/10 p-4 text-sm text-moss-dark">
          Your subscription has been activated successfully.
        </div>
      )}

      {cancelled && (
        <div className="rounded-lg border border-amber/30 bg-amber/10 p-4 text-sm text-bark">
          Checkout was cancelled. No charges were made.
        </div>
      )}

      <PlanSelector orgSlug={orgSlug} />
    </div>
  );
}
