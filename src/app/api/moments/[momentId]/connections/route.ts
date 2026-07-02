import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { momentConnections, connections } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { linkConnectionsSchema } from "@/lib/validators/moments";
import { and, eq } from "drizzle-orm";

type Params = { params: Promise<{ momentId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { momentId } = await params;

    if (!hasMinRole(membership.role, "viewer")) {
      return errorResponse("Forbidden", 403);
    }

    const linked = await db
      .select({
        id: connections.id,
        name: connections.name,
        type: connections.type,
      })
      .from(momentConnections)
      .innerJoin(connections, eq(momentConnections.connectionId, connections.id))
      .where(
        and(
          eq(momentConnections.momentId, momentId),
          eq(connections.organisationId, organisationId)
        )
      );

    return successResponse(linked);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { membership } = await getOrgContext(request);
    const { momentId } = await params;

    if (!hasMinRole(membership.role, "contributor")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = linkConnectionsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const values = parsed.data.connectionIds.map((connectionId) => ({
      momentId,
      connectionId,
    }));

    await db
      .insert(momentConnections)
      .values(values)
      .onConflictDoNothing();

    return successResponse({ linked: parsed.data.connectionIds.length }, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { membership } = await getOrgContext(request);
    const { momentId } = await params;

    if (!hasMinRole(membership.role, "contributor")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = linkConnectionsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    for (const connectionId of parsed.data.connectionIds) {
      await db
        .delete(momentConnections)
        .where(
          and(
            eq(momentConnections.momentId, momentId),
            eq(momentConnections.connectionId, connectionId)
          )
        );
    }

    return successResponse({ unlinked: parsed.data.connectionIds.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}
