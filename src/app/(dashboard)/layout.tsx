import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisations, organisationMemberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const memberOrgs = await db
    .select({
      id: organisations.id,
      name: organisations.name,
      slug: organisations.slug,
    })
    .from(organisationMemberships)
    .innerJoin(
      organisations,
      eq(organisationMemberships.organisationId, organisations.id)
    )
    .where(eq(organisationMemberships.userId, session.user.id));

  return (
    <DashboardShell
      organisations={memberOrgs}
      userName={session.user.name ?? undefined}
      userEmail={session.user.email ?? undefined}
      userImage={session.user.image ?? undefined}
    >
      {children}
    </DashboardShell>
  );
}
