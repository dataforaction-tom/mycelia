import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { requireSuperAdmin } from "@/lib/auth/platform";
import {
  successResponse,
  errorResponse,
  adminErrorResponse,
} from "@/lib/utils/api";
import { updateFeedbackSchema } from "@/lib/validators/feedback";
import { recordAdminAction } from "@/lib/admin/audit";

type Params = { params: Promise<{ id: string }> };

/** Triage a feedback item — change status/priority or edit internal notes. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const admin = await requireSuperAdmin();
    const { id } = await params;

    const parsed = updateFeedbackSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const [updated] = await db
      .update(feedback)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(feedback.id, id))
      .returning({
        id: feedback.id,
        status: feedback.status,
        priority: feedback.priority,
      });

    if (!updated) return errorResponse("Feedback not found", 404);

    await recordAdminAction({
      actorUserId: admin.id,
      action: "feedback.update",
      targetType: "feedback",
      targetId: id,
      metadata: parsed.data,
    });

    return successResponse(updated);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
