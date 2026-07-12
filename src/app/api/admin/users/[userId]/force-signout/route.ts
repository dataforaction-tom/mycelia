import { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireSuperAdmin } from "@/lib/auth/platform";
import {
  successResponse,
  errorResponse,
  adminErrorResponse,
} from "@/lib/utils/api";
import { recordAdminAction } from "@/lib/admin/audit";

type Params = { params: Promise<{ userId: string }> };

/** Retire the user's active sessions by bumping tokenVersion. Takes effect on
 *  their next request (see the auth jwt callback). */
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const admin = await requireSuperAdmin();
    const { userId } = await params;

    const [updated] = await db
      .update(users)
      .set({
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (!updated) return errorResponse("User not found", 404);

    await recordAdminAction({
      actorUserId: admin.id,
      action: "user.force_signout",
      targetType: "user",
      targetId: userId,
    });

    return successResponse({ signedOut: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
