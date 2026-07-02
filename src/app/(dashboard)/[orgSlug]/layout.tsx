import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { organisations, organisationMemberships } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

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

  return <>{children}</>;
}
