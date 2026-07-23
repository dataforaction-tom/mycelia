import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { wasRecentlyVerifiedByEmail } from "@/lib/auth/recovery";
import { setPasswordSchema } from "@/lib/validators/auth";
import { successResponse, errorResponse } from "@/lib/utils/api";

/**
 * Set or change the signed-in user's password.
 *
 * Requires the current password when one is already set, UNLESS the
 * session was just established by a magic-link sign-in (see
 * wasRecentlyVerifiedByEmail) — that's the "forgot password" recovery path,
 * and the magic link itself is the proof of ownership a reset needs.
 * Requiring it otherwise protects an account whose session gets hijacked
 * from being permanently locked out by a silent password change. A
 * magic-link-only account with no password yet has nothing to prove
 * ownership against either way, so setting a first password never needs a
 * current-password check.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Not authenticated", 401);

    const body = await request.json();
    const parsed = setPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }
    const { currentPassword, newPassword } = parsed.data;

    const db = getDb();
    const [existing] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!existing) return errorResponse("Account not found", 404);

    if (existing.passwordHash && !wasRecentlyVerifiedByEmail(session)) {
      const valid = currentPassword
        ? await bcrypt.compare(currentPassword, existing.passwordHash)
        : false;
      if (!valid) return errorResponse("Current password is incorrect", 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash }).where(eq(users.id, existing.id));

    return successResponse({ updated: true });
  } catch {
    return errorResponse("Something went wrong updating your password.", 500);
  }
}
