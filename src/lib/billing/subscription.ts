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

/**
 * Human wording for when a trial ends, by calendar day — "today",
 * "tomorrow", or "in N days". A trial ending at 4pm on cron day is
 * "today", never "tomorrow": misstating a billing deadline is worse than
 * any copy awkwardness.
 */
export function trialEndDescriptor(
  trialEndsAt: Date,
  now: Date = new Date(),
): string {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const calendarDays = Math.round(
    (startOfDay(trialEndsAt) - startOfDay(now)) / DAY_MS,
  );
  if (calendarDays <= 0) return "today";
  if (calendarDays === 1) return "tomorrow";
  return `in ${calendarDays} days`;
}

export interface TrialReminderFlags {
  d7?: boolean;
  d1?: boolean;
}

/**
 * Which trial-ending reminder (if any) is due right now, given what has
 * already been sent. The 1-day warning takes precedence and is still sent
 * even if the 7-day one was somehow missed; each fires at most once.
 */
export function dueTrialReminder(
  org: OrgBillingFields,
  flags: TrialReminderFlags,
): "d7" | "d1" | null {
  if (subscriptionState(org) !== "trialing") return null;
  const daysLeft = trialDaysLeft(org.trialEndsAt);
  if (daysLeft <= 1 && !flags.d1) return "d1";
  if (daysLeft <= 7 && !flags.d7) return "d7";
  return null;
}
