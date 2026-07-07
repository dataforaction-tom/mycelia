export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import {
  organisations,
  connections,
  moments,
  momentConnections,
  observations,
  users,
} from "@/lib/db/schema";
import { and, eq, count, desc, gte, lt, inArray } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { MomentCard } from "@/components/moments/moment-card";
import { ComposerTriggerBar } from "@/components/moments/composer-trigger-bar";
import { AddConnectionButton } from "@/components/connections/add-connection-button";
import { GuidedTour } from "@/components/onboarding/guided-tour";
import { WhisperCard } from "@/components/observations/whisper-card";
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
  const session = await auth();

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

  const [newThreadsThisWeek] = await db
    .select({ value: count() })
    .from(connections)
    .where(
      and(
        eq(connections.organisationId, org.id),
        gte(connections.createdAt, oneWeekAgo)
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
    .limit(6);

  const recentMomentLinks = recentMoments.length
    ? await db
        .select({
          momentId: momentConnections.momentId,
          id: connections.id,
          name: connections.name,
          type: connections.type,
        })
        .from(momentConnections)
        .innerJoin(connections, eq(momentConnections.connectionId, connections.id))
        .where(
          inArray(
            momentConnections.momentId,
            recentMoments.map((m) => m.id)
          )
        )
    : [];
  const recentMomentConnectionsByMoment = new Map<
    string,
    { id: string; name: string; type: string }[]
  >();
  for (const link of recentMomentLinks) {
    const list = recentMomentConnectionsByMoment.get(link.momentId) ?? [];
    list.push({ id: link.id, name: link.name, type: link.type });
    recentMomentConnectionsByMoment.set(link.momentId, list);
  }

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
    ? "The ecosystem is resting."
    : trend === "up"
      ? "The ecosystem is humming."
      : trend === "down"
        ? "A quieter week in the network."
        : "A steady rhythm underground.";

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const firstName = session?.user?.name?.split(" ")[0];
  const greeting = `Good ${timeOfDay}${firstName ? `, ${firstName}` : ""}`;
  const pulseDetail = resting
    ? `${greeting} — no new moments this week. What conversations are waiting?`
    : `${greeting} — ${thisWeek.value} new ${thisWeek.value === 1 ? "moment" : "moments"} took root this week.`;

  const orgSettings = (org.settings ?? {}) as { tourPending?: boolean };

  return (
    <div className="stagger-children space-y-10">
      {orgSettings.tourPending && <GuidedTour organisationId={org.id} />}
      {/* Title row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl text-bark">
              {pulseHeadline}
            </h1>
            <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium capitalize text-muted">
              {org.plan}
            </span>
          </div>
          <p className="mt-2 text-muted">{pulseDetail}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span data-tour="composer">
            <ComposerTriggerBar variant="pill" />
          </span>
          <AddConnectionButton variant="quiet" />
        </div>
      </div>

      {connectionCount.value > 0 && (
        <div className="grid gap-4 sm:grid-cols-3" data-tour="stats">
          <Link
            href={`/${orgSlug}/connections`}
            className="rounded-[18px] border border-border bg-white/75 p-5 shadow-[0_6px_24px_rgba(111,154,79,0.1)] backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-hover"
          >
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
              Living threads
            </p>
            <p className="mt-1 font-display text-3xl text-bark">
              {connectionCount.value}
            </p>
            {newThreadsThisWeek.value > 0 && (
              <p className="mt-1 text-xs text-green-dark">
                {newThreadsThisWeek.value} new this week
              </p>
            )}
          </Link>
          <Link
            href={`/${orgSlug}/moments`}
            className="rounded-[18px] border border-border bg-white/75 p-5 shadow-[0_6px_24px_rgba(138,154,86,0.1)] backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-hover"
          >
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
              Moments gathered
            </p>
            <p className="mt-1 font-display text-3xl text-bark">
              {momentCount.value}
            </p>
            <p className="mt-1 text-xs text-green-dark">
              {thisWeek.value} this week ↑
            </p>
          </Link>
          <Link
            href={`/${orgSlug}/observations`}
            className="rounded-[18px] border border-amber/30 bg-gradient-to-br from-amber/15 to-white/80 p-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-hover"
          >
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-amber-dark">
              Needs tending
            </p>
            <p className="mt-1 font-display text-3xl text-bark">
              {attentionList.length}
            </p>
            <p className="mt-1 text-xs text-amber-dark">threads going quiet</p>
          </Link>
        </div>
      )}

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
              messages — and Tending will grow the living network between
              them.
            </p>
            <div className="mt-6">
              <AddConnectionButton label="Add your first connection" />
            </div>
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
        /* Network preview + whispers, side by side — the living network on
           the left, what it's noticed on the right. */
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div data-tour="network" className="min-h-0">
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
          </div>

          <section className="flex min-h-0 flex-col gap-3" data-tour="whispers">
            <h2 className="text-sm font-semibold text-bark">
              Whispers from the network
            </h2>
            {attentionList.length > 0 ? (
              attentionList
                .slice(0, 3)
                .map((observation) => (
                  <WhisperCard
                    key={observation.id}
                    type={observation.type}
                    content={observation.content}
                    connections={observation.connections
                      .map((id) => attentionConnectionById.get(id))
                      .filter((c): c is NonNullable<typeof c> => Boolean(c))}
                    orgSlug={orgSlug}
                  />
                ))
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-surface/60 p-6 text-center">
                <p className="text-sm text-muted">
                  Nothing to report yet — keep recording moments and patterns
                  will surface here.
                </p>
              </div>
            )}
            {attentionList.length > 0 && (
              <Link
                href={`/${orgSlug}/observations`}
                className="text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark"
              >
                View all observations →
              </Link>
            )}
          </section>
        </div>
      )}

      {/* Fresh moments: a quick 3-up grid, distinct from the river's
          threaded view — the day's texture at a glance. */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl text-bark">Fresh moments</h2>
          <Link
            href={`/${orgSlug}/moments`}
            className="text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark"
          >
            View the river
          </Link>
        </div>
        {recentMoments.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentMoments.map((moment) => (
              <MomentCard
                key={moment.id}
                moment={moment}
                connections={recentMomentConnectionsByMoment.get(moment.id)}
                orgSlug={orgSlug}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-surface/60 p-8 text-center">
            <p className="font-display text-lg text-bark">
              Nothing in the river yet
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
              Record the first moment and the story starts.
            </p>
          </div>
        )}
      </section>

      {teamActivity.length > 0 && (
        <section>
          <h2 className="font-display text-xl text-bark">Team activity</h2>
          <p className="mt-1 text-sm text-muted">Last 30 days</p>
          <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-white/80 shadow-lift">
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
  );
}
