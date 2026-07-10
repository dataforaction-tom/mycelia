import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import {
  successResponse,
  errorResponse,
  getAuthenticatedUser,
} from "@/lib/utils/api";
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

    const [created] = await db
      .insert(feedback)
      .values({
        userId: user.id,
        organisationId: parsed.data.organisationId ?? null,
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
