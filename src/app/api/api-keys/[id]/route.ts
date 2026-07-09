import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { and, eq, isNull } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { id } = await params;

    if (!hasMinRole(membership.role, "admin")) {
      return errorResponse("Forbidden", 403);
    }

    // Soft-revoke rather than delete: keeps the audit trail and immediately
    // invalidates the key, since `getApiContext` filters `revokedAt IS NULL`.
    // Org-scope the target so an admin of org A can't revoke org B's key, and
    // skip already-revoked rows so a double-revoke reads as 404.
    const [revoked] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.organisationId, organisationId),
          isNull(apiKeys.revokedAt)
        )
      )
      .returning({ id: apiKeys.id });

    if (!revoked) return errorResponse("API key not found", 404);

    return successResponse({ revoked: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Forbidden"))
      return errorResponse(msg, 403);
    if (msg.includes("Subscription required")) return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}
