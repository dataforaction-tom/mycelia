import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  networkLinks,
  connections,
  momentConnections,
  moments,
} from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { getNetworkSchema } from "@/lib/validators/network";
import { detectClusters } from "@/lib/network/clusters";
import { and, eq, gte, max } from "drizzle-orm";

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

    // These three reads are independent — run them concurrently rather than
    // as three serial Neon round-trips (this endpoint is hit on every
    // dashboard and network-page load).
    const [nodes, edges, lastMoments] = await Promise.all([
      db
        .select({
          id: connections.id,
          name: connections.name,
          type: connections.type,
        })
        .from(connections)
        .where(eq(connections.organisationId, organisationId)),
      db
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
        ),
      // Last recorded moment per connection — lets the views show life and
      // dormancy (fresh nodes flare, quiet ones fade)
      db
        .select({
          connectionId: momentConnections.connectionId,
          lastMomentAt: max(moments.createdAt),
        })
        .from(momentConnections)
        .innerJoin(moments, eq(momentConnections.momentId, moments.id))
        .where(eq(moments.organisationId, organisationId))
        .groupBy(momentConnections.connectionId),
    ]);

    const lastMomentByNode = new Map(
      lastMoments.map((row) => [row.connectionId, row.lastMomentAt])
    );

    const clusterMap = detectClusters(nodes, edges);
    const nodesWithClusters = nodes.map((node) => ({
      ...node,
      clusterId: clusterMap.get(node.id) ?? node.id,
      lastMomentAt: lastMomentByNode.get(node.id) ?? null,
    }));

    return successResponse({ nodes: nodesWithClusters, edges });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    if (msg.includes("Subscription required"))
      return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}
