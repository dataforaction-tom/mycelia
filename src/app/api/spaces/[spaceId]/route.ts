import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { spaces } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { updateSpaceSchema } from "@/lib/validators/spaces";
import { and, eq } from "drizzle-orm";

type Params = { params: Promise<{ spaceId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { spaceId } = await params;

    if (!hasMinRole(membership.role, "viewer")) {
      return errorResponse("Forbidden", 403);
    }

    const [space] = await db
      .select()
      .from(spaces)
      .where(
        and(eq(spaces.id, spaceId), eq(spaces.organisationId, organisationId))
      )
      .limit(1);

    if (!space) return errorResponse("Space not found", 404);

    return successResponse(space);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { spaceId } = await params;

    if (!hasMinRole(membership.role, "contributor")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = updateSpaceSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const [updated] = await db
      .update(spaces)
      .set(parsed.data)
      .where(
        and(eq(spaces.id, spaceId), eq(spaces.organisationId, organisationId))
      )
      .returning();

    if (!updated) return errorResponse("Space not found", 404);

    return successResponse(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Forbidden"))
      return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { spaceId } = await params;

    if (!hasMinRole(membership.role, "admin")) {
      return errorResponse("Forbidden", 403);
    }

    const [deleted] = await db
      .delete(spaces)
      .where(
        and(eq(spaces.id, spaceId), eq(spaces.organisationId, organisationId))
      )
      .returning({ id: spaces.id });

    if (!deleted) return errorResponse("Space not found", 404);

    return successResponse({ deleted: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Forbidden"))
      return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}
