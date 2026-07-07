/**
 * Subscription state, derived — no stored status flag to drift. An org is
 * "active" once any paid plan is set (by the Stripe webhooks), "trialing"
 * while its free trial runs, and "expired" after. Expired orgs are
 * read-only: content writes are blocked at getOrgContext, while settings
 * and billing stay reachable so subscribing is always possible.
 */

export type SubscriptionState = "active" | "trialing" | "expired";

interface OrgBillingFields {
  plan: string;
  trialEndsAt: Date | null;
}

export function subscriptionState(org: OrgBillingFields): SubscriptionState {
  if (org.plan !== "trial") return "active";
  if (org.trialEndsAt && org.trialEndsAt.getTime() > Date.now()) {
    return "trialing";
  }
  return "expired";
}

/** Whole days until the trial ends (0 when it ends today or has ended). */
export function trialDaysLeft(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  const ms = trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
