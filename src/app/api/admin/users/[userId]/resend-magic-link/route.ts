import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { signIn } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/platform";
import {
  successResponse,
  errorResponse,
  adminErrorResponse,
} from "@/lib/utils/api";
import { recordAdminAction } from "@/lib/admin/audit";

type Params = { params: Promise<{ userId: string }> };

/** Send the user a fresh one-time sign-in link — the magic-link equivalent of
 *  "reset password". */
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const admin = await requireSuperAdmin();
    const { userId } = await params;

    const [target] = await db
      .select({ email: users.email, status: users.status })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!target) return errorResponse("User not found", 404);
    if (target.status === "suspended") {
      return errorResponse("User is suspended — reactivate before sending a link", 400);
    }

    await signIn("resend", { email: target.email, redirect: false });

    await recordAdminAction({
      actorUserId: admin.id,
      action: "user.resend_magic_link",
      targetType: "user",
      targetId: userId,
    });

    return successResponse({ sent: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
