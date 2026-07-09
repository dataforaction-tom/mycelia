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
import { changeEmailSchema } from "@/lib/validators/admin";
import { sendEmailChangedEmail } from "@/lib/email/messages";
import { recordAdminAction } from "@/lib/admin/audit";

type Params = { params: Promise<{ userId: string }> };

/**
 * Change a user's email — the identity anchor for magic-link sign-in. Bumps
 * tokenVersion so any live session is retired (the identity changed), clears
 * emailVerified, and notifies both addresses.
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const admin = await requireSuperAdmin();
    const { userId } = await params;

    const parsed = changeEmailSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }
    const newEmail = parsed.data.email.toLowerCase().trim();

    const [target] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!target) return errorResponse("User not found", 404);
    if (target.email.toLowerCase() === newEmail) {
      return errorResponse("That is already the user's email", 400);
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, newEmail))
      .limit(1);
    if (existing) {
      return errorResponse("That email is already in use by another account", 409);
    }

    const oldEmail = target.email;
    await db
      .update(users)
      .set({
        email: newEmail,
        emailVerified: null,
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Best-effort notification — the change has already committed.
    await sendEmailChangedEmail(oldEmail, newEmail).catch(() => {});

    await recordAdminAction({
      actorUserId: admin.id,
      action: "user.change_email",
      targetType: "user",
      targetId: userId,
      metadata: { from: oldEmail, to: newEmail },
    });

    return successResponse({ email: newEmail });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
