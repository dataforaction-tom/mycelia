import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { organisationInvitations } from "@/lib/db/schema";
import {
  successResponse,
  errorResponse,
  getAuthenticatedUser,
} from "@/lib/utils/api";
import { requirePermission } from "@/lib/auth/permissions";
import { and, eq } from "drizzle-orm";

type Params = { params: Promise<{ orgId: string; invitationId: string }> };

/** Revoke a pending invitation before it's accepted. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser();
    const { orgId, invitationId } = await params;

    await requirePermission(user.id, orgId, "MANAGE_MEMBERS", "admin");

    const [deleted] = await db
      .delete(organisationInvitations)
      .where(
        and(
          eq(organisationInvitations.id, invitationId),
          eq(organisationInvitations.organisationId, orgId)
        )
      )
      .returning({ id: organisationInvitations.id });

    if (!deleted) return errorResponse("Invitation not found", 404);

    return successResponse({ deleted: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Insufficient role"))
      return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}
