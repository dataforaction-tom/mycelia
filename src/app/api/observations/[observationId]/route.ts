import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { observations } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { updateObservationSchema } from "@/lib/validators/observations";
import { and, eq } from "drizzle-orm";

type Params = { params: Promise<{ observationId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { observationId } = await params;

    if (!hasMinRole(membership.role, "contributor")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = updateObservationSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const [updated] = await db
      .update(observations)
      .set(parsed.data)
      .where(
        and(
          eq(observations.id, observationId),
          eq(observations.organisationId, organisationId)
        )
      )
      .returning();

    if (!updated) return errorResponse("Observation not found", 404);

    return successResponse(updated);
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
