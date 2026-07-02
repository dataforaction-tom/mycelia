import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { networkLinks, connections } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { getNetworkSchema } from "@/lib/validators/network";
import { and, eq, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { membership, organisationId } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "viewer")) {
      return errorResponse("Forbidden", 403);
    }

    const url = new URL(request.url);
    const parsed = getNetworkSchema.safeParse(
      Object.fromEntries(url.searchParams)
    );

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const { minStrength } = parsed.data;

    const nodes = await db
      .select({
        id: connections.id,
        name: connections.name,
        type: connections.type,
      })
      .from(connections)
      .where(eq(connections.organisationId, organisationId));

    const edges = await db
      .select({
        id: networkLinks.id,
        source: networkLinks.sourceConnectionId,
        target: networkLinks.targetConnectionId,
        strength: networkLinks.strength,
        linkSource: networkLinks.source,
      })
      .from(networkLinks)
      .where(
        and(
          eq(networkLinks.organisationId, organisationId),
          gte(networkLinks.strength, minStrength)
        )
      );

    return successResponse({ nodes, edges });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}
