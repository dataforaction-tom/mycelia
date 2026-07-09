import { NextRequest } from "next/server";
import { z } from "zod/v3";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import type { OrgSettings } from "@/lib/db/schema/organisations";
import {
  successResponse,
  errorResponse,
  getOrgContext,
} from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { eq } from "drizzle-orm";

const updateSettingsSchema = z.object({
  newConnectionSuggestions: z.enum(["opt_in", "opt_out"]),
});

/**
 * Admin-gated update of org-level workflow preferences. Merges the supplied
 * key into `organisations.settings` (jsonb) without clobbering other keys.
 * Org-scoped via the `x-organisation-id` header.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { membership, organisationId } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "admin")) {
      return errorResponse("Insufficient role: requires admin", 403);
    }

    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const [org] = await db
      .select({ settings: organisations.settings })
      .from(organisations)
      .where(eq(organisations.id, organisationId))
      .limit(1);
    if (!org) return errorResponse("Organisation not found", 404);

    const settings = (org.settings ?? {}) as OrgSettings;

    const [updated] = await db
      .update(organisations)
      .set({
        settings: {
          ...settings,
          newConnectionSuggestions: parsed.data.newConnectionSuggestions,
        },
        updatedAt: new Date(),
      })
      .where(eq(organisations.id, organisationId))
      .returning({ settings: organisations.settings });

    return successResponse({ settings: updated.settings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Missing x-organisation-id"))
      return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}
