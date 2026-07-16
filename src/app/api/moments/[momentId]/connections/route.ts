import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { momentConnections, connections } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { linkConnectionsSchema } from "@/lib/validators/moments";
import { ownedConnectionIds, isMomentInOrg } from "@/lib/db/scope";
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
    if (msg.includes("Subscription required"))
      return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { momentId } = await params;

    if (!hasMinRole(membership.role, "contributor")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = linkConnectionsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    // Cross-tenant write guard: the moment and every connection must belong
    // to the caller's org before we link them (an insert has no natural
    // org scope). Prevents linking another org's records via raw UUIDs.
    if (!(await isMomentInOrg(momentId, organisationId))) {
      return errorResponse("Moment not found", 404);
    }
    const owned = await ownedConnectionIds(
      parsed.data.connectionIds,
      organisationId
    );
    if (owned.length !== parsed.data.connectionIds.length) {
      return errorResponse("One or more connections not found", 404);
    }

    const values = owned.map((connectionId) => ({
      momentId,
      connectionId,
    }));

    await db.insert(momentConnections).values(values).onConflictDoNothing();

    return successResponse({ linked: owned.length }, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    if (msg.includes("Subscription required"))
      return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { momentId } = await params;

    if (!hasMinRole(membership.role, "contributor")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = linkConnectionsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    // Confirm the moment belongs to the caller's org before mutating its
    // links, so a foreign moment UUID can't be used to probe/unlink.
    if (!(await isMomentInOrg(momentId, organisationId))) {
      return errorResponse("Moment not found", 404);
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
    if (msg.includes("Subscription required"))
      return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}
