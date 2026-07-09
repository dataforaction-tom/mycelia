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
import { suspendUserSchema } from "@/lib/validators/admin";
import { recordAdminAction } from "@/lib/admin/audit";

type Params = { params: Promise<{ userId: string }> };

/** Suspend (block sign-in + retire sessions) or reactivate a user. */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const admin = await requireSuperAdmin();
    const { userId } = await params;

    if (userId === admin.id) {
      return errorResponse("You cannot suspend your own account", 400);
    }

    const parsed = suspendUserSchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse("Invalid request", 422);
    const { suspend } = parsed.data;

    const [updated] = await db
      .update(users)
      .set(
        suspend
          ? {
              status: "suspended",
              suspendedAt: new Date(),
              // Retire live sessions immediately, not just block future logins.
              tokenVersion: sql`${users.tokenVersion} + 1`,
              updatedAt: new Date(),
            }
          : { status: "active", suspendedAt: null, updatedAt: new Date() },
      )
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (!updated) return errorResponse("User not found", 404);

    await recordAdminAction({
      actorUserId: admin.id,
      action: suspend ? "user.suspend" : "user.reactivate",
      targetType: "user",
      targetId: userId,
    });

    return successResponse({ status: suspend ? "suspended" : "active" });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
