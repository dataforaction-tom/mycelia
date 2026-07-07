import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole, canPerform } from "@/lib/auth/permissions";
import {
  updateConnectionSchema,
  normaliseContactDetails,
} from "@/lib/validators/connections";
import { and, eq } from "drizzle-orm";

type Params = { params: Promise<{ connectionId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { connectionId } = await params;

    if (!hasMinRole(membership.role, "viewer")) {
      return errorResponse("Forbidden", 403);
    }

    const [connection] = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.id, connectionId),
          eq(connections.organisationId, organisationId)
        )
      )
      .limit(1);

    if (!connection) return errorResponse("Connection not found", 404);

    return successResponse(connection);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    if (msg.includes("Subscription required"))
      return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { connectionId } = await params;

    if (!hasMinRole(membership.role, "contributor")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = updateConnectionSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    // Contact details are normalised (blank fields stripped) so we store a
    // clean object rather than the form's empty strings.
    const { contactDetails, ...rest } = parsed.data;
    const [updated] = await db
      .update(connections)
      .set({
        ...rest,
        ...(contactDetails !== undefined
          ? { contactDetails: normaliseContactDetails(contactDetails) ?? {} }
          : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(connections.id, connectionId),
          eq(connections.organisationId, organisationId)
        )
      )
      .returning();

    if (!updated) return errorResponse("Connection not found", 404);

    return successResponse(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Insufficient role"))
      return errorResponse(msg, 403);
    if (msg.includes("Subscription required"))
      return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { connectionId } = await params;

    if (!canPerform(membership, "DELETE_CONNECTIONS", "admin")) {
      return errorResponse("Forbidden", 403);
    }

    const [deleted] = await db
      .delete(connections)
      .where(
        and(
          eq(connections.id, connectionId),
          eq(connections.organisationId, organisationId)
        )
      )
      .returning({ id: connections.id });

    if (!deleted) return errorResponse("Connection not found", 404);

    return successResponse({ deleted: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Insufficient role"))
      return errorResponse(msg, 403);
    if (msg.includes("Subscription required"))
      return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}
