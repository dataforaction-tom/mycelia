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
import { EcosystemCanvas } from "@/components/network/ecosystem-canvas";

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

  // The pulse: one human sentence about how the ecosystem is moving
  const resting = thisWeek.value === 0;
  const pulseHeadline = resting
    ? "The network is resting"
    : trend === "up"
      ? "The network is growing"
      : trend === "down"
        ? "A quieter week"
        : "A steady rhythm";
  const pulseDetail = resting
    ? "No moments recorded this week. What conversations are waiting?"
    : `${thisWeek.value} ${thisWeek.value === 1 ? "moment" : "moments"} this week · ${lastWeek.value} the week before`;

  return (
    <div className="stagger-children space-y-10">
      {/* Title row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl text-bark">{org.name}</h1>
            <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium capitalize text-muted">
              {org.plan}
            </span>
          </div>
          <p className="mt-2 text-muted">
            What do your relationships need from you today?
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${orgSlug}/moments/new`}
            className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white shadow-lift transition-all hover:bg-terracotta-dark hover:shadow-hover"
          >
            Record a moment
          </Link>
          <Link
            href={`/${orgSlug}/connections/new`}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-bark transition-colors hover:bg-cream-dark"
          >
            Add connection
          </Link>
        </div>
      </div>

      {connectionCount.value === 0 ? (
        /* First-run invitation: an empty ecosystem is a beginning, not a blank */
        <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-8 shadow-lift sm:p-12">
          <div className="relative z-10 max-w-lg">
            <h2 className="font-display text-3xl text-bark">
              Every ecosystem starts with a single thread
            </h2>
            <p className="mt-3 text-muted">
              Add the people, organisations, and communities you&apos;re in
              relationship with. Then record moments — conversations, meetings,
              messages — and Mycelium will grow the living network between
              them.
            </p>
            <Link
              href={`/${orgSlug}/connections/new`}
              className="mt-6 inline-flex rounded-lg bg-terracotta px-5 py-2.5 text-sm font-medium text-white shadow-lift transition-all hover:bg-terracotta-dark hover:shadow-hover"
            >
              Add your first connection
            </Link>
          </div>
          <svg
            className="pointer-events-none absolute -right-8 bottom-0 h-56 w-72 text-moss/15"
            viewBox="0 0 280 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M140 200 C140 140, 60 150, 40 60" />
            <path d="M140 200 C140 130, 220 140, 240 40" />
            <path d="M140 200 C140 120, 140 100, 130 30" />
            <path d="M40 60 C36 42, 30 30, 34 14" />
            <path d="M240 40 C250 30, 254 22, 250 10" />
            <circle cx="34" cy="12" r="4" fill="currentColor" stroke="none" />
            <circle cx="250" cy="8" r="4" fill="currentColor" stroke="none" />
            <circle cx="129" cy="26" r="4" fill="currentColor" stroke="none" />
          </svg>
        </section>
      ) : (
        /* The ecosystem itself: the living network, breathing behind the
           day's pulse. Every node is a door. */
        <EcosystemCanvas
          organisationId={org.id}
          orgSlug={orgSlug}
          headline={pulseHeadline}
          detail={pulseDetail}
          stats={{
            connections: connectionCount.value,
            moments: momentCount.value,
            thisWeek: thisWeek.value,
          }}
        />
      )}

      {/* Attention list */}
      {attentionList.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl text-bark">Attention</h2>
            <Link
              href={`/${orgSlug}/observations`}
              className="text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark"
            >
              View all observations
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted">
            Things the network has noticed, gently.
          </p>
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
        </section>
      )}

      {/* Recent moments + team activity */}
      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl text-bark">Recent moments</h2>
            <Link
              href={`/${orgSlug}/moments`}
              className="text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark"
            >
              View the river
            </Link>
          </div>
          <div className="mt-4">
            <MomentList moments={recentMoments} orgSlug={orgSlug} />
          </div>
        </section>

        {teamActivity.length > 0 && (
          <section>
            <h2 className="font-display text-xl text-bark">Team activity</h2>
            <p className="mt-1 text-sm text-muted">Last 30 days</p>
            <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface shadow-lift">
              {teamActivity.map((member) => (
                <div
                  key={member.authorId}
                  className="flex items-center justify-between gap-3 p-3.5 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-moss/15 text-xs font-semibold text-moss-dark">
                      {(member.name ?? member.email ?? "?")
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                    <span className="truncate text-bark">
                      {member.name ?? member.email}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {member.momentCount}{" "}
                    {member.momentCount === 1 ? "moment" : "moments"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
