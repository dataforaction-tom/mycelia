export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getMembership, hasMinRole } from "@/lib/auth/permissions";
import { WebhookManager } from "@/components/developers/webhook-manager";
import { ApiKeyManager } from "@/components/developers/api-key-manager";

export default async function DevelopersPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const session = await auth();
  if (!session?.user?.id) notFound();

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, orgSlug))
    .limit(1);

  if (!org) notFound();

  const membership = await getMembership(session.user.id, org.id);
  if (!membership) notFound();

  const isAdmin = hasMinRole(membership.role, "admin");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bark">
          Developers <span className="text-muted">→</span> Webhooks
        </h1>
        <p className="mt-1 text-sm text-muted">
          Receive real-time events when things happen in your organisation.
        </p>
      </div>

      {isAdmin ? (
        <>
          <WebhookManager organisationId={org.id} />

          <section className="space-y-4 border-t border-border pt-6">
            <div>
              <h2 className="text-lg font-semibold text-bark">API keys</h2>
              <p className="mt-1 text-sm text-muted">
                Authenticate programmatic access to your organisation&apos;s
                data. Keys are shown once at creation.
              </p>
            </div>
            <ApiKeyManager organisationId={org.id} />
          </section>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
          <p className="text-sm text-muted">
            Admins only. Ask an organisation admin for access to webhooks.
          </p>
        </div>
      )}
    </div>
  );
}
