export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import {
  organisations,
  connections,
  moments,
  observations,
  users,
} from "@/lib/db/schema";
import { and, eq, count, desc, gte, lt, inArray } from "drizzle-orm";
import Link from "next/link";
import { MomentList } from "@/components/moments/moment-list";
import { ObservationCard } from "@/components/observations/observation-card";

const SEVERITY_RANK: Record<string, number> = {
  important: 0,
  noteworthy: 1,
  gentle: 2,
};

export default async function OrgDashboard({
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

  const [connectionCount] = await db
    .select({ value: count() })
    .from(connections)
    .where(eq(connections.organisationId, org.id));

  const [momentCount] = await db
    .select({ value: count() })
    .from(moments)
    .where(eq(moments.organisationId, org.id));

  // Week-over-week trend
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [thisWeek] = await db
    .select({ value: count() })
    .from(moments)
    .where(
      and(
        eq(moments.organisationId, org.id),
        gte(moments.createdAt, oneWeekAgo)
      )
    );

  const [lastWeek] = await db
    .select({ value: count() })
    .from(moments)
    .where(
      and(
        eq(moments.organisationId, org.id),
        gte(moments.createdAt, twoWeeksAgo),
        lt(moments.createdAt, oneWeekAgo)
      )
    );

  const trend =
    thisWeek.value > lastWeek.value
      ? "up"
      : thisWeek.value < lastWeek.value
        ? "down"
        : "steady";

  // Attention list: unresolved observations, most severe/recent first
  const unresolvedObservations = await db
    .select()
    .from(observations)
    .where(
      and(
        eq(observations.organisationId, org.id),
        inArray(observations.status, ["new", "seen"])
      )
    )
    .orderBy(desc(observations.createdAt));

  unresolvedObservations.sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  );
  const attentionList = unresolvedObservations.slice(0, 5);

  const attentionConnectionIds = [
    ...new Set(attentionList.flatMap((o) => o.connections)),
  ];
  const attentionConnections = attentionConnectionIds.length
    ? await db
        .select({ id: connections.id, name: connections.name, type: connections.type })
        .from(connections)
        .where(inArray(connections.id, attentionConnectionIds))
    : [];
  const attentionConnectionById = new Map(
    attentionConnections.map((c) => [c.id, c])
  );

  // Recent moments
  const recentMoments = await db
    .select({
      id: moments.id,
      content: moments.content,
      source: moments.source,
      createdAt: moments.createdAt,
      eventDate: moments.eventDate,
    })
    .from(moments)
    .where(eq(moments.organisationId, org.id))
    .orderBy(desc(moments.createdAt))
    .limit(5);

  // Team activity: moments per author, last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const teamActivity = await db
    .select({
      authorId: moments.authorId,
      name: users.name,
      email: users.email,
      momentCount: count(moments.id),
    })
    .from(moments)
    .innerJoin(users, eq(users.id, moments.authorId))
    .where(
      and(
        eq(moments.organisationId, org.id),
        gte(moments.createdAt, thirtyDaysAgo)
      )
    )
    .groupBy(moments.authorId, users.name, users.email)
    .orderBy(desc(count(moments.id)));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-bark">{org.name}</h1>
        <p className="mt-1 text-muted">
          Your relational ecosystem at a glance
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-sm text-muted">Connections</p>
          <p className="mt-1 text-3xl font-bold text-bark">
            {connectionCount.value}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-sm text-muted">Moments</p>
          <p className="mt-1 text-3xl font-bold text-bark">
            {momentCount.value}
          </p>
          <p className="mt-1 text-xs text-muted">
            {thisWeek.value} this week &middot;{" "}
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trend}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-sm text-muted">Plan</p>
          <p className="mt-1 text-3xl font-bold capitalize text-bark">
            {org.plan}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/${orgSlug}/connections/new`}
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark"
        >
          Add connection
        </Link>
        <Link
          href={`/${orgSlug}/moments/new`}
          className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-bark transition-colors hover:bg-cream-dark"
        >
          Record a moment
        </Link>
      </div>

      {/* Attention list */}
      {attentionList.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-bark">Attention</h2>
            <Link
              href={`/${orgSlug}/observations`}
              className="text-sm text-terracotta hover:text-terracotta-dark"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {attentionList.map((observation) => (
              <ObservationCard
                key={observation.id}
                id={observation.id}
                type={observation.type}
                content={observation.content}
                severity={observation.severity}
                status={observation.status}
                connections={observation.connections
                  .map((id) => attentionConnectionById.get(id))
                  .filter((c): c is NonNullable<typeof c> => Boolean(c))}
                organisationId={org.id}
                orgSlug={orgSlug}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent moments */}
      <div>
        <h2 className="text-lg font-semibold text-bark">Recent moments</h2>
        <div className="mt-4">
          <MomentList moments={recentMoments} orgSlug={orgSlug} />
        </div>
      </div>

      {/* Team activity */}
      {teamActivity.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-bark">
            Team activity (last 30 days)
          </h2>
          <div className="mt-4 space-y-2">
            {teamActivity.map((member) => (
              <div
                key={member.authorId}
                className="flex items-center justify-between rounded-lg border border-border bg-white p-3 text-sm"
              >
                <span className="text-bark">
                  {member.name ?? member.email}
                </span>
                <span className="text-muted">
                  {member.momentCount}{" "}
                  {member.momentCount === 1 ? "moment" : "moments"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
