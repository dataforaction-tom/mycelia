import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import {
  successResponse,
  errorResponse,
  getAuthenticatedUser,
} from "@/lib/utils/api";
import { getMembership } from "@/lib/auth/permissions";
import { submitFeedbackSchema } from "@/lib/validators/feedback";

/**
 * Submit feedback. Open to any authenticated user (not gated on org role or
 * subscription state — reporting a bug must always be possible). The submitter
 * and org are recorded for triage context.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const parsed = submitFeedbackSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    // Only attribute feedback to an org the submitter actually belongs to —
    // otherwise a crafted request could tag it to any org and poison triage.
    // Membership alone is enough; expired/read-only orgs may still report.
    let organisationId: string | null = null;
    if (parsed.data.organisationId) {
      const membership = await getMembership(user.id, parsed.data.organisationId);
      organisationId = membership ? parsed.data.organisationId : null;
    }

    const [created] = await db
      .insert(feedback)
      .values({
        userId: user.id,
        organisationId,
        type: parsed.data.type,
        title: parsed.data.title,
        body: parsed.data.body,
        pageUrl: parsed.data.pageUrl ?? null,
      })
      .returning({ id: feedback.id });

    return successResponse({ id: created.id }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Not authenticated") return errorResponse(message, 401);
    return errorResponse("Internal server error", 500);
  }
}
