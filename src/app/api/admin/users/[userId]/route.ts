import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, moments, organisationMemberships } from "@/lib/db/schema";
import { requireSuperAdmin } from "@/lib/auth/platform";
import {
  successResponse,
  errorResponse,
  adminErrorResponse,
} from "@/lib/utils/api";
import { deleteUserSchema } from "@/lib/validators/admin";
import { recordAdminAction } from "@/lib/admin/audit";

type Params = { params: Promise<{ userId: string }> };

/**
 * Hard-delete a user. Requires the caller to echo the exact email as a
 * confirmation. Memberships and accounts cascade; the two user references that
 * are NOT cascade-deleted (moments.author_id, memberships.invited_by) are
 * nulled first so the delete isn't blocked. Prefer suspend for anything short
 * of an erasure request.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const admin = await requireSuperAdmin();
    const { userId } = await params;

    if (userId === admin.id) {
      return errorResponse("You cannot delete your own account", 400);
    }

    const parsed = deleteUserSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!parsed.success) {
      return errorResponse("Confirmation email required", 422);
    }

    const [target] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!target) return errorResponse("User not found", 404);
    if (
      parsed.data.confirmEmail.toLowerCase().trim() !==
      target.email.toLowerCase()
    ) {
      return errorResponse("Confirmation email does not match", 400);
    }

    // Release the non-cascading references before deleting.
    await db
      .update(moments)
      .set({ authorId: null })
      .where(eq(moments.authorId, userId));
    await db
      .update(organisationMemberships)
      .set({ invitedBy: null })
      .where(eq(organisationMemberships.invitedBy, userId));

    await db.delete(users).where(eq(users.id, userId));

    await recordAdminAction({
      actorUserId: admin.id,
      action: "user.delete",
      targetType: "user",
      targetId: userId,
      metadata: { email: target.email },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
