import { db } from "@/lib/db";
import { moments, organisations } from "@/lib/db/schema";
import { subscriptionState } from "@/lib/billing/subscription";
import { PLAN_LIMITS } from "@/lib/config/plans";
import { and, count, eq, gte } from "drizzle-orm";

/**
 * The subscription + monthly-quota gate that BOTH moment-creation entry points
 * must apply before inserting: the session route (`/api/moments`) and the
 * API-key route (`/api/v1/moments`). Returns an error to surface, or `null`
 * when the org may create another moment.
 *
 * Session requests are also subscription-gated by `getOrgContext`, but the API
 * route authenticates via an API key (no payment gate), so without this check
 * a read-write key could bypass billing limits entirely.
 */
export async function checkMomentQuota(
  organisationId: string,
): Promise<{ message: string; status: number } | null> {
  const [org] = await db
    .select({
      plan: organisations.plan,
      trialEndsAt: organisations.trialEndsAt,
    })
    .from(organisations)
    .where(eq(organisations.id, organisationId))
    .limit(1);

  if (!org) return null;

  if (subscriptionState(org) === "expired") {
    return {
      message: "Subscription required — your free trial has ended",
      status: 402,
    };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [monthly] = await db
    .select({ value: count() })
    .from(moments)
    .where(
      and(
        eq(moments.organisationId, organisationId),
        gte(moments.createdAt, monthStart),
      ),
    );

  const limit = PLAN_LIMITS[org.plan].momentsPerMonth;
  if (monthly.value >= limit) {
    return {
      message: `Your plan allows up to ${limit} moments per month. Upgrade to add more.`,
      status: 403,
    };
  }

  return null;
}
