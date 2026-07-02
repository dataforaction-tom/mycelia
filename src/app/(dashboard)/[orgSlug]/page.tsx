export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { organisations, connections, moments } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";
import Link from "next/link";

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

  const recentMoments = await db
    .select()
    .from(moments)
    .where(eq(moments.organisationId, org.id))
    .orderBy(desc(moments.createdAt))
    .limit(5);

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

      {/* Recent moments */}
      <div>
        <h2 className="text-lg font-semibold text-bark">Recent moments</h2>
        {recentMoments.length === 0 ? (
          <p className="mt-4 text-muted">
            No moments yet. Start by recording what&apos;s happening in your
            relationships.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {recentMoments.map((moment) => (
              <div
                key={moment.id}
                className="rounded-lg border border-border bg-white p-4"
              >
                <p className="text-sm text-bark">{moment.content}</p>
                <p className="mt-2 text-xs text-muted">
                  {moment.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
