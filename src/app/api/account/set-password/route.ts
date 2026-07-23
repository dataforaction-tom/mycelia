import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { setPasswordSchema } from "@/lib/validators/auth";
import {
  successResponse,
  errorResponse,
  getAuthenticatedUser,
} from "@/lib/utils/api";

/**
 * Set or change the signed-in user's password. Requires the current
 * password when one is already set (protects an account whose session gets
 * hijacked from being permanently locked out by a silent password change);
 * a magic-link-only account has nothing to prove ownership against, so
 * setting a first password needs no current-password check.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
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
      .where(eq(users.id, authUser.id))
      .limit(1);

    if (!existing) return errorResponse("Account not found", 404);

    if (existing.passwordHash) {
      const valid = currentPassword
        ? await bcrypt.compare(currentPassword, existing.passwordHash)
        : false;
      if (!valid) return errorResponse("Current password is incorrect", 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash }).where(eq(users.id, existing.id));

    return successResponse({ updated: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return errorResponse("Not authenticated", 401);
    }
    return errorResponse("Something went wrong updating your password.", 500);
  }
}
