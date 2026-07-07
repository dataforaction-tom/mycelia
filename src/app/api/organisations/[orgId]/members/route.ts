import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { organisationMemberships, users } from "@/lib/db/schema";
import {
  successResponse,
  errorResponse,
  getAuthenticatedUser,
} from "@/lib/utils/api";
import { requireMembership, requirePermission } from "@/lib/auth/permissions";
import { inviteMemberSchema } from "@/lib/validators/auth";
import { sendMemberAddedEmail } from "@/lib/email/messages";
import { PLAN_LIMITS } from "@/lib/config/plans";
import { organisations } from "@/lib/db/schema";
import { and, eq, count } from "drizzle-orm";

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

    const { email, role } = parsed.data as { email: string; role: "admin" | "contributor" | "viewer" };

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

    const [memberCount] = await db
      .select({ value: count() })
      .from(organisationMemberships)
      .where(eq(organisationMemberships.organisationId, orgId));

    const limit = PLAN_LIMITS[org.plan].users;
    if (memberCount.value >= limit) {
      return errorResponse(
        `Your plan allows up to ${limit} members. Upgrade to add more.`,
        403
      );
    }

    // Find or note the invited user
    const [invitedUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!invitedUser) {
      return errorResponse(
        "User not found. They must sign up first.",
        404
      );
    }

    // Check if already a member
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
      await sendMemberAddedEmail(
        email,
        org.name,
        org.slug,
        user.name ?? user.email ?? "A colleague",
      );
    } catch {
      // Membership exists either way.
    }

    return successResponse(membership, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Insufficient role"))
      return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}
