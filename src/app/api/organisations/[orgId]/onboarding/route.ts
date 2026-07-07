import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  organisations,
  connections,
  moments,
  spaces,
  observations,
} from "@/lib/db/schema";
import {
  successResponse,
  errorResponse,
  getAuthenticatedUser,
} from "@/lib/utils/api";
import { requireMembership } from "@/lib/auth/permissions";
import { onboardingActionSchema } from "@/lib/validators/organisations";
import type { DemoSeedResult } from "@/lib/demo/seed-demo-data";
import { and, eq, inArray, arrayOverlaps } from "drizzle-orm";

interface OrgSettings {
  demo?: DemoSeedResult;
  tourPending?: boolean;
  [key: string]: unknown;
}

/**
 * Onboarding actions: finish the guided tour, or clear the demo data. The
 * clear is surgical — it deletes exactly the rows recorded at seed time
 * (FK cascades take the join rows, links and qualities with them), so
 * anything the user created during the tour survives.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    const { orgId } = await params;

    await requireMembership(user.id, orgId, "admin");

    const body = await request.json();
    const parsed = onboardingActionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const [org] = await db
      .select({ settings: organisations.settings })
      .from(organisations)
      .where(eq(organisations.id, orgId))
      .limit(1);
    if (!org) return errorResponse("Organisation not found", 404);

    const settings = (org.settings ?? {}) as OrgSettings;

    if (parsed.data.action === "complete-tour") {
      await db
        .update(organisations)
        .set({ settings: { ...settings, tourPending: false } })
        .where(eq(organisations.id, orgId));
      return successResponse({ done: true });
    }

    // clear-demo
    const demo = settings.demo;
    if (!demo) {
      return successResponse({ done: true, cleared: false });
    }

    if (demo.momentIds.length > 0) {
      await db
        .delete(moments)
        .where(
          and(
            eq(moments.organisationId, orgId),
            inArray(moments.id, demo.momentIds),
          ),
        );
    }
    if (demo.connectionIds.length > 0) {
      // Observations reference connections as a uuid[] column, no FK —
      // remove any that mention a demo connection before the connections go.
      await db
        .delete(observations)
        .where(
          and(
            eq(observations.organisationId, orgId),
            arrayOverlaps(observations.connections, demo.connectionIds),
          ),
        );
      await db
        .delete(connections)
        .where(
          and(
            eq(connections.organisationId, orgId),
            inArray(connections.id, demo.connectionIds),
          ),
        );
    }
    if (demo.spaceIds.length > 0) {
      await db
        .delete(spaces)
        .where(
          and(
            eq(spaces.organisationId, orgId),
            inArray(spaces.id, demo.spaceIds),
          ),
        );
    }

    const { demo: _cleared, ...rest } = settings;
    await db
      .update(organisations)
      .set({ settings: { ...rest, tourPending: false } })
      .where(eq(organisations.id, orgId));

    return successResponse({ done: true, cleared: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("requires"))
      return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}
