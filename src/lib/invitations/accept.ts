import { getDb } from "@/lib/db";
import {
  organisationInvitations,
  organisationMemberships,
} from "@/lib/db/schema";
import { and, eq, isNull, gt } from "drizzle-orm";

/**
 * Turn any pending invitations for this email into real memberships. Called
 * the first time a person signs in (their magic link proves they control the
 * inbox the invite was sent to), so being "invited before signing up" just
 * works. Idempotent: already-accepted or expired invites are skipped, and a
 * membership that somehow already exists is left untouched.
 */
export async function acceptPendingInvitations(
  userId: string,
  email: string | null | undefined
): Promise<number> {
  if (!email) return 0;
  const db = getDb();
  const normalisedEmail = email.trim().toLowerCase();

  const pending = await db
    .select({
      id: organisationInvitations.id,
      organisationId: organisationInvitations.organisationId,
      role: organisationInvitations.role,
      invitedBy: organisationInvitations.invitedBy,
    })
    .from(organisationInvitations)
    .where(
      and(
        eq(organisationInvitations.email, normalisedEmail),
        isNull(organisationInvitations.acceptedAt),
        gt(organisationInvitations.expiresAt, new Date())
      )
    );

  let accepted = 0;
  for (const invite of pending) {
    await db
      .insert(organisationMemberships)
      .values({
        userId,
        organisationId: invite.organisationId,
        role: invite.role,
        invitedBy: invite.invitedBy,
        acceptedAt: new Date(),
      })
      .onConflictDoNothing();

    await db
      .update(organisationInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(organisationInvitations.id, invite.id));

    accepted += 1;
  }

  return accepted;
}
