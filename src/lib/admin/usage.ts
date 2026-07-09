import { count, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  organisations,
  organisationMemberships,
  connections,
  moments,
  spaces,
} from "@/lib/db/schema";
import { PLAN_LIMITS, type PlanType } from "@/lib/config/plans";
import {
  subscriptionState,
  type SubscriptionState,
} from "@/lib/billing/subscription";

/**
 * Per-org usage against plan limits. Batched into one grouped query per
 * metric (no N+1) and merged in memory — safe while the org count is modest;
 * revisit with pagination if it grows.
 */

export interface OrgUsageRow {
  id: string;
  name: string;
  slug: string;
  plan: PlanType;
  state: SubscriptionState;
  members: number;
  connections: number;
  momentsThisMonth: number;
  spaces: number;
  limits: (typeof PLAN_LIMITS)[PlanType];
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function countByOrg(
  rows: { orgId: string; value: number }[],
): Map<string, number> {
  return new Map(rows.map((row) => [row.orgId, Number(row.value)]));
}

export async function getOrgUsage(): Promise<OrgUsageRow[]> {
  const monthStart = startOfMonth();

  const [orgs, memberRows, connectionRows, momentRows, spaceRows] =
    await Promise.all([
      db
        .select({
          id: organisations.id,
          name: organisations.name,
          slug: organisations.slug,
          plan: organisations.plan,
          trialEndsAt: organisations.trialEndsAt,
        })
        .from(organisations),
      db
        .select({
          orgId: organisationMemberships.organisationId,
          value: count(),
        })
        .from(organisationMemberships)
        .groupBy(organisationMemberships.organisationId),
      db
        .select({ orgId: connections.organisationId, value: count() })
        .from(connections)
        .groupBy(connections.organisationId),
      db
        .select({ orgId: moments.organisationId, value: count() })
        .from(moments)
        .where(gte(moments.createdAt, monthStart))
        .groupBy(moments.organisationId),
      db
        .select({ orgId: spaces.organisationId, value: count() })
        .from(spaces)
        .groupBy(spaces.organisationId),
    ]);

  const members = countByOrg(memberRows);
  const conns = countByOrg(connectionRows);
  const monthlyMoments = countByOrg(momentRows);
  const spaceCounts = countByOrg(spaceRows);

  return orgs
    .map((org) => {
      const plan = org.plan as PlanType;
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan,
        state: subscriptionState(org),
        members: members.get(org.id) ?? 0,
        connections: conns.get(org.id) ?? 0,
        momentsThisMonth: monthlyMoments.get(org.id) ?? 0,
        spaces: spaceCounts.get(org.id) ?? 0,
        limits: PLAN_LIMITS[plan],
      };
    })
    .sort((a, b) => b.connections - a.connections);
}
