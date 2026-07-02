import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import {
  successResponse,
  errorResponse,
  getAuthenticatedUser,
} from "@/lib/utils/api";
import { requireMembership } from "@/lib/auth/permissions";
import { updateOrganisationSchema } from "@/lib/validators/organisations";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { orgId } = await params;

    await requireMembership(user.id, orgId, "viewer");

    const [org] = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, orgId))
      .limit(1);

    if (!org) return errorResponse("Organisation not found", 404);

    return successResponse(org);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { orgId } = await params;

    await requireMembership(user.id, orgId, "admin");

    const body = await request.json();
    const parsed = updateOrganisationSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const [updated] = await db
      .update(organisations)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(organisations.id, orgId))
      .returning();

    if (!updated) return errorResponse("Organisation not found", 404);

    return successResponse(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Insufficient role"))
      return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}
