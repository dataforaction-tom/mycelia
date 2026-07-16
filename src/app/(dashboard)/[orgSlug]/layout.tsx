import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { organisations, organisationMemberships } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { subscriptionState, trialDaysLeft } from "@/lib/billing/subscription";

const TRIAL_WARNING_DAYS = 7;

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const session = await auth();
  if (!session?.user) notFound();

  const { orgSlug } = await params;

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, orgSlug))
    .limit(1);

  if (!org) notFound();

  // Verify membership
  const [membership] = await db
    .select()
    .from(organisationMemberships)
    .where(
      and(
        eq(organisationMemberships.userId, session.user.id),
        eq(organisationMemberships.organisationId, org.id)
      )
    )
    .limit(1);

  if (!membership) notFound();

  // The billing conscience: a quiet countdown in the trial's last week, a
  // firm-but-warm wall once it expires. Expired orgs are read-only, never
  // locked out — settings and billing stay reachable.
  const state = subscriptionState(org);
  const daysLeft = trialDaysLeft(org.trialEndsAt);

  return (
    <>
      {state === "expired" && (
        <div className="underground relative mb-8 overflow-hidden rounded-2xl p-6">
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-soil-ink text-xl">
                Your free trial has ended
              </p>
              <p className="text-soil-ink-soft mt-1 max-w-xl text-sm">
                Tending is read-only for now — everything you planted is safe.
                Subscribe for £5 a month to keep tending.
              </p>
            </div>
            <Link
              href={`/${orgSlug}/settings/billing`}
              className="from-green-dark to-moss-dark shadow-lift shrink-0 rounded-full bg-gradient-to-r px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-105"
            >
              Subscribe — £5/month
            </Link>
          </div>
        </div>
      )}

      {state === "trialing" && daysLeft <= TRIAL_WARNING_DAYS && (
        <div className="border-amber/30 bg-amber/10 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
          <p className="text-bark text-sm">
            Your free trial ends in {daysLeft} {daysLeft === 1 ? "day" : "days"}{" "}
            — £5 a month after, everything included.
          </p>
          <Link
            href={`/${orgSlug}/settings/billing`}
            className="text-amber-dark decoration-amber/50 hover:text-bark text-sm font-medium underline underline-offset-2 transition-colors"
          >
            Subscribe
          </Link>
        </div>
      )}

      {children}
    </>
  );
}
