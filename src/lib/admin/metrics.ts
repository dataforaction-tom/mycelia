import { count, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, organisations, connections, moments } from "@/lib/db/schema";
import { subscriptionState, trialDaysLeft } from "@/lib/billing/subscription";

/**
 * Platform-wide aggregates for the admin overview. These are the first
 * cross-org queries in the codebase — everything else is org-scoped. Kept as
 * a handful of COUNTs plus one small scan of org billing fields (computed in
 * JS via subscriptionState to avoid duplicating the derived-state logic in
 * SQL).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function scalarCount(
  query: PromiseLike<{ value: number }[]>,
): Promise<number> {
  const rows = await query;
  return Number(rows[0]?.value ?? 0);
}

export interface OverviewMetrics {
  totalUsers: number;
  newUsers7d: number;
  newUsers30d: number;
  totalOrgs: number;
  payingOrgs: number;
  trialingOrgs: number;
  expiredOrgs: number;
  trialsEndingSoon: number;
  totalConnections: number;
  totalMoments: number;
  momentsThisMonth: number;
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const monthStart = startOfMonth();

  const [
    totalUsers,
    newUsers7d,
    newUsers30d,
    totalConnections,
    totalMoments,
    momentsThisMonth,
    orgRows,
  ] = await Promise.all([
    scalarCount(db.select({ value: count() }).from(users)),
    scalarCount(
      db
        .select({ value: count() })
        .from(users)
        .where(gte(users.createdAt, daysAgo(7))),
    ),
    scalarCount(
      db
        .select({ value: count() })
        .from(users)
        .where(gte(users.createdAt, daysAgo(30))),
    ),
    scalarCount(db.select({ value: count() }).from(connections)),
    scalarCount(db.select({ value: count() }).from(moments)),
    scalarCount(
      db
        .select({ value: count() })
        .from(moments)
        .where(gte(moments.createdAt, monthStart)),
    ),
    db
      .select({
        plan: organisations.plan,
        trialEndsAt: organisations.trialEndsAt,
      })
      .from(organisations),
  ]);

  let payingOrgs = 0;
  let trialingOrgs = 0;
  let expiredOrgs = 0;
  let trialsEndingSoon = 0;

  for (const org of orgRows) {
    const state = subscriptionState(org);
    if (state === "active") {
      payingOrgs += 1;
    } else if (state === "trialing") {
      trialingOrgs += 1;
      if (trialDaysLeft(org.trialEndsAt) <= 7) trialsEndingSoon += 1;
    } else {
      expiredOrgs += 1;
    }
  }

  return {
    totalUsers,
    newUsers7d,
    newUsers30d,
    totalOrgs: orgRows.length,
    payingOrgs,
    trialingOrgs,
    expiredOrgs,
    trialsEndingSoon,
    totalConnections,
    totalMoments,
    momentsThisMonth,
  };
}

export interface SignupDay {
  date: string; // YYYY-MM-DD
  count: number;
}

/**
 * Daily sign-up counts for the last `days` days, gap-filled so the series is
 * continuous (zero-days included) — ready to render as a bar chart.
 */
export async function getSignupsByDay(days = 30): Promise<SignupDay[]> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${users.createdAt}), 'YYYY-MM-DD')`,
      value: count(),
    })
    .from(users)
    .where(gte(users.createdAt, since))
    .groupBy(sql`date_trunc('day', ${users.createdAt})`);

  const byDay = new Map(rows.map((row) => [row.day, Number(row.value)]));

  const series: SignupDay[] = [];
  for (let i = 0; i < days; i += 1) {
    const day = new Date(since);
    day.setDate(since.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    series.push({ date: key, count: byDay.get(key) ?? 0 });
  }
  return series;
}
