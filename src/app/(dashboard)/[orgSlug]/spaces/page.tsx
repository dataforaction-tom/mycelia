export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import {
  organisations,
  spaces,
  connectionSpaces,
  moments,
} from "@/lib/db/schema";
import { eq, desc, inArray, count, sql, and } from "drizzle-orm";
import Link from "next/link";
import { SpaceIcon } from "@/lib/config/space-icons";
import { lastGatheringLabel } from "@/lib/spaces/last-gathering";

export default async function SpacesPage({
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

  const rows = await db
    .select()
    .from(spaces)
    .where(eq(spaces.organisationId, org.id))
    .orderBy(desc(spaces.createdAt));

  const spaceIds = rows.map((s) => s.id);

  const threadCounts = spaceIds.length
    ? await db
        .select({ spaceId: connectionSpaces.spaceId, value: count() })
        .from(connectionSpaces)
        .where(inArray(connectionSpaces.spaceId, spaceIds))
        .groupBy(connectionSpaces.spaceId)
    : [];
  const threadsBySpace = new Map(threadCounts.map((r) => [r.spaceId, r.value]));

  const lastMoments = spaceIds.length
    ? await db
        .select({
          spaceId: moments.spaceId,
          last: sql<Date>`max(coalesce(${moments.eventDate}, ${moments.createdAt}))`.mapWith(
            (v) => new Date(v),
          ),
        })
        .from(moments)
        .where(
          and(
            eq(moments.organisationId, org.id),
            inArray(moments.spaceId, spaceIds),
          ),
        )
        .groupBy(moments.spaceId)
    : [];
  const lastBySpace = new Map(lastMoments.map((r) => [r.spaceId, r.last]));

  return (
    <div className="stagger-children space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-bark">
            Where threads cross
          </h1>
          <p className="mt-2 text-muted">
            The places and gatherings where your relationships actually happen
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${orgSlug}/settings/spaces`}
            className="text-sm text-muted transition-colors hover:text-bark"
          >
            Manage
          </Link>
          <Link
            href={`/${orgSlug}/settings/spaces/new`}
            className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white shadow-lift transition-all hover:bg-terracotta-dark hover:shadow-hover"
          >
            New space
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center">
          <p className="font-display text-lg text-bark">
            No spaces yet
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
            Spaces are where threads cross — the allotment, the assembly, the
            church hall. Name the places your relationships actually happen
            and tending will gather the threads that pass through them.
          </p>
          <Link
            href={`/${orgSlug}/settings/spaces/new`}
            className="mt-5 inline-flex rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white shadow-lift transition-all hover:bg-terracotta-dark"
          >
            Create your first space
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((space) => {
            const threads = threadsBySpace.get(space.id) ?? 0;
            return (
              <Link
                key={space.id}
                href={`/${orgSlug}/spaces/${space.id}`}
                className="block rounded-[20px] border border-border bg-white/80 p-5 shadow-[0_6px_24px_rgba(111,154,79,0.08)] transition-all hover:-translate-y-0.5 hover:border-terracotta/30 hover:shadow-hover"
              >
                <SpaceIcon seed={space.id} />
                <p className="mt-3 font-semibold text-bark-dark">
                  {space.name}
                </p>
                {space.description && (
                  <p className="mt-1 text-[13px] leading-relaxed text-bark-light">
                    {space.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-green/10 px-2.5 py-0.5 text-[11px] text-green-dark">
                    {threads} {threads === 1 ? "thread" : "threads"}
                  </span>
                  <span className="text-[11px] text-muted-light">
                    {lastGatheringLabel(lastBySpace.get(space.id) ?? null)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
