import { NextRequest } from "next/server";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { generateObservations } from "@/lib/observations/generate";

export async function POST(request: NextRequest) {
  try {
    const { membership, organisationId } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "contributor")) {
      return errorResponse("Forbidden", 403);
    }

    const result = await generateObservations(organisationId);

    return successResponse(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    if (msg.includes("Subscription required"))
      return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}
