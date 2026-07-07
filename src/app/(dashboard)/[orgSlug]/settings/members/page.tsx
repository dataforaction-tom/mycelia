export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  organisations,
  organisationMemberships,
  organisationInvitations,
  users,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { and, eq, isNull, gt } from "drizzle-orm";
import { canPerform } from "@/lib/auth/permissions";
import { PLAN_LIMITS } from "@/lib/config/plans";
import { MembersManager } from "@/components/organisations/members-manager";

export default async function MembersPage({
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

  const [viewer] = await db
    .select({
      role: organisationMemberships.role,
      permissions: organisationMemberships.permissions,
    })
    .from(organisationMemberships)
    .where(
      and(
        eq(organisationMemberships.userId, session.user.id),
        eq(organisationMemberships.organisationId, org.id)
      )
    )
    .limit(1);

  if (!viewer) notFound();

  const members = await db
    .select({
      userId: organisationMemberships.userId,
      role: organisationMemberships.role,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,
      createdAt: organisationMemberships.createdAt,
    })
    .from(organisationMemberships)
    .innerJoin(users, eq(organisationMemberships.userId, users.id))
    .where(eq(organisationMemberships.organisationId, org.id))
    .orderBy(organisationMemberships.createdAt);

  const invitations = await db
    .select({
      id: organisationInvitations.id,
      email: organisationInvitations.email,
      role: organisationInvitations.role,
      createdAt: organisationInvitations.createdAt,
    })
    .from(organisationInvitations)
    .where(
      and(
        eq(organisationInvitations.organisationId, org.id),
        isNull(organisationInvitations.acceptedAt),
        gt(organisationInvitations.expiresAt, new Date())
      )
    )
    .orderBy(organisationInvitations.createdAt);

  const canManage = canPerform(viewer, "MANAGE_MEMBERS", "admin");
  const memberLimit = PLAN_LIMITS[org.plan].users;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bark">Members</h1>
        <p className="mt-1 text-sm text-muted">
          Manage who has access to your organisation
        </p>
      </div>

      <MembersManager
        organisationId={org.id}
        currentUserId={session.user.id}
        canManage={canManage}
        memberLimit={memberLimit}
        initialMembers={members.map((member) => ({
          ...member,
          createdAt: member.createdAt.toISOString(),
        }))}
        initialInvitations={invitations.map((invite) => ({
          ...invite,
          createdAt: invite.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
