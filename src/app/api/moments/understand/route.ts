import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { understandMomentSchema } from "@/lib/validators/moments";
import { understandMoment } from "@/lib/ai/moment-understanding";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { membership, organisationId } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "contributor")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = understandMomentSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const existingConnections = await db
      .select({
        id: connections.id,
        name: connections.name,
        type: connections.type,
      })
      .from(connections)
      .where(eq(connections.organisationId, organisationId));

    const result = await understandMoment(parsed.data.content, existingConnections);

    return successResponse(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    if (msg.includes("Both providers failed")) {
      return errorResponse("AI understanding is unavailable right now", 502);
    }
    return errorResponse("Internal server error", 500);
  }
}
