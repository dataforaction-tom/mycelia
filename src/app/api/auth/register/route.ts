import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { signIn } from "@/lib/auth";
import { registerSchema } from "@/lib/validators/auth";
import { successResponse, errorResponse } from "@/lib/utils/api";

/**
 * Password-based account creation. Deliberately does not accept any pending
 * organisation invitations for this email (unlike the magic-link createUser
 * path) — nobody has proven they own this inbox yet, so auto-joining an org
 * here would let an attacker claim an invite meant for someone else. That
 * verification, and invite acceptance, happens the first time this account
 * signs in via magic link (see the `signIn` callback in lib/auth).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }
    const { name, email, password } = parsed.data;

    const db = getDb();
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return errorResponse(
        "An account already exists for this email — sign in instead.",
        409,
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.insert(users).values({ email, name, passwordHash });

    await signIn("password", { email, password, redirect: false });

    return successResponse({ registered: true });
  } catch {
    return errorResponse("Something went wrong creating your account.", 500);
  }
}
