import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { qualities, connections } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { createQualitySchema } from "@/lib/validators/qualities";
import { and, asc, eq } from "drizzle-orm";

type Params = { params: Promise<{ connectionId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { connectionId } = await params;

    if (!hasMinRole(membership.role, "viewer")) {
      return errorResponse("Forbidden", 403);
    }

    const rows = await db
      .select({
        id: qualities.id,
        spectrum: qualities.spectrum,
        position: qualities.position,
        confidence: qualities.confidence,
        source: qualities.source,
        createdAt: qualities.createdAt,
      })
      .from(qualities)
      .innerJoin(connections, eq(qualities.connectionId, connections.id))
      .where(
        and(
          eq(qualities.connectionId, connectionId),
          eq(connections.organisationId, organisationId)
        )
      )
      .orderBy(asc(qualities.createdAt));

    return successResponse(rows);
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
    const { connectionId } = await params;

    if (!hasMinRole(membership.role, "contributor")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = createQualitySchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    // Explicit org-scope check: unlike GET's join, an insert has no
    // natural guard against writing against another org's connection.
    const [connection] = await db
      .select({ id: connections.id })
      .from(connections)
      .where(
        and(
          eq(connections.id, connectionId),
          eq(connections.organisationId, organisationId)
        )
      )
      .limit(1);

    if (!connection) {
      return errorResponse("Connection not found", 404);
    }

    const [quality] = await db
      .insert(qualities)
      .values({
        connectionId,
        spectrum: parsed.data.spectrum,
        position: parsed.data.position,
        source: "manual",
      })
      .returning();

    return successResponse(quality, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Forbidden"))
      return errorResponse(msg, 403);
    if (msg.includes("Subscription required"))
      return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}
