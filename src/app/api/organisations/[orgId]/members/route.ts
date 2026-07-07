import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  organisationMemberships,
  organisationInvitations,
  users,
} from "@/lib/db/schema";
import {
  successResponse,
  errorResponse,
  getAuthenticatedUser,
} from "@/lib/utils/api";
import { requireMembership, requirePermission } from "@/lib/auth/permissions";
import { inviteMemberSchema } from "@/lib/validators/auth";
import {
  sendMemberAddedEmail,
  sendMemberInviteEmail,
} from "@/lib/email/messages";
import { PLAN_LIMITS } from "@/lib/config/plans";
import { organisations } from "@/lib/db/schema";
import { and, eq, count, isNull, gt } from "drizzle-orm";

// Pending invitations stay valid for 30 days.
const INVITATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { orgId } = await params;

    await requireMembership(user.id, orgId, "viewer");

    const members = await db
      .select({
        userId: organisationMemberships.userId,
        role: organisationMemberships.role,
        acceptedAt: organisationMemberships.acceptedAt,
        createdAt: organisationMemberships.createdAt,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
      })
      .from(organisationMemberships)
      .innerJoin(users, eq(organisationMemberships.userId, users.id))
      .where(eq(organisationMemberships.organisationId, orgId));

    return successResponse(members);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { orgId } = await params;

    await requirePermission(user.id, orgId, "MANAGE_MEMBERS", "admin");

    const body = await request.json();
    const parsed = inviteMemberSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const { role } = parsed.data as {
      role: "admin" | "contributor" | "viewer";
    };
    // Emails are matched case-insensitively, so store and compare lowercased.
    const email = parsed.data.email.trim().toLowerCase();

    // Check plan limits
    const [org] = await db
      .select({
        plan: organisations.plan,
        name: organisations.name,
        slug: organisations.slug,
      })
      .from(organisations)
      .where(eq(organisations.id, orgId))
      .limit(1);

    if (!org) return errorResponse("Organisation not found", 404);

    // Seats are consumed by real members and by outstanding invitations
    // alike, so both count towards the plan limit.
    const [memberCount] = await db
      .select({ value: count() })
      .from(organisationMemberships)
      .where(eq(organisationMemberships.organisationId, orgId));

    const [pendingCount] = await db
      .select({ value: count() })
      .from(organisationInvitations)
      .where(
        and(
          eq(organisationInvitations.organisationId, orgId),
          isNull(organisationInvitations.acceptedAt),
          gt(organisationInvitations.expiresAt, new Date())
        )
      );

    const limit = PLAN_LIMITS[org.plan].users;
    if (memberCount.value + pendingCount.value >= limit) {
      return errorResponse(
        `Your plan allows up to ${limit} members. Upgrade to add more.`,
        403
      );
    }

    const inviterName = user.name ?? user.email ?? "A colleague";

    // Find the invited user — if they already have a Tending account we add
    // them straight away; otherwise we hold a pending invitation.
    const [invitedUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (invitedUser) {
      const [existing] = await db
        .select({ userId: organisationMemberships.userId })
        .from(organisationMemberships)
        .where(
          and(
            eq(organisationMemberships.userId, invitedUser.id),
            eq(organisationMemberships.organisationId, orgId)
          )
        )
        .limit(1);

      if (existing) {
        return errorResponse("User is already a member", 409);
      }

      const [membership] = await db
        .insert(organisationMemberships)
        .values({
          userId: invitedUser.id,
          organisationId: orgId,
          role,
          invitedBy: user.id,
          acceptedAt: new Date(),
        })
        .returning();

      // Best-effort notification to the person who was added.
      try {
        await sendMemberAddedEmail(email, org.name, org.slug, inviterName);
      } catch {
        // Membership exists either way.
      }

      return successResponse({ ...membership, pending: false }, 201);
    }

    // No account yet — hold a pending invitation keyed by email. Re-inviting
    // the same address refreshes the role and expiry rather than erroring.
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
    const [invitation] = await db
      .insert(organisationInvitations)
      .values({
        organisationId: orgId,
        email,
        role,
        invitedBy: user.id,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [
          organisationInvitations.organisationId,
          organisationInvitations.email,
        ],
        set: {
          role,
          invitedBy: user.id,
          expiresAt,
          acceptedAt: null,
          createdAt: new Date(),
        },
      })
      .returning();

    // Best-effort invite email — the invitation stands either way.
    try {
      await sendMemberInviteEmail(email, org.name, inviterName);
    } catch {
      // Invitation exists; they can still sign in to accept it.
    }

    return successResponse(
      {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        pending: true,
      },
      201
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Insufficient role"))
      return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}
