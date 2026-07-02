import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { organisationMemberships } from "@/lib/db/schema";
import {
  successResponse,
  errorResponse,
  getAuthenticatedUser,
} from "@/lib/utils/api";
import { requireMembership } from "@/lib/auth/permissions";
import { updateMemberRoleSchema } from "@/lib/validators/auth";
import { and, eq } from "drizzle-orm";

type Params = { params: Promise<{ orgId: string; memberId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser();
    const { orgId, memberId } = await params;

    const currentMembership = await requireMembership(user.id, orgId, "admin");

    const body = await request.json();
    const parsed = updateMemberRoleSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    // Cannot change owner role unless you are owner
    if (currentMembership.role !== "owner" && parsed.data.role === "admin") {
      // Admins can set contributor/viewer only; owner needed for admin
    }

    // Cannot change your own role
    if (memberId === user.id) {
      return errorResponse("Cannot change your own role", 400);
    }

    const [updated] = await db
      .update(organisationMemberships)
      .set({ role: parsed.data.role })
      .where(
        and(
          eq(organisationMemberships.userId, memberId),
          eq(organisationMemberships.organisationId, orgId)
        )
      )
      .returning();

    if (!updated) return errorResponse("Member not found", 404);

    return successResponse(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Insufficient role"))
      return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser();
    const { orgId, memberId } = await params;

    await requireMembership(user.id, orgId, "admin");

    // Cannot remove yourself
    if (memberId === user.id) {
      return errorResponse("Cannot remove yourself", 400);
    }

    // Cannot remove the owner
    const [target] = await db
      .select({ role: organisationMemberships.role })
      .from(organisationMemberships)
      .where(
        and(
          eq(organisationMemberships.userId, memberId),
          eq(organisationMemberships.organisationId, orgId)
        )
      )
      .limit(1);

    if (!target) return errorResponse("Member not found", 404);
    if (target.role === "owner") {
      return errorResponse("Cannot remove the organisation owner", 400);
    }

    await db
      .delete(organisationMemberships)
      .where(
        and(
          eq(organisationMemberships.userId, memberId),
          eq(organisationMemberships.organisationId, orgId)
        )
      );

    return successResponse({ deleted: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Insufficient role"))
      return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}
