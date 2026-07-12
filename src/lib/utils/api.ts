import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMembership } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { subscriptionState } from "@/lib/billing/subscription";
import { eq } from "drizzle-orm";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/**
 * Return a success JSON response.
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Return an error JSON response.
 */
export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Map errors thrown by admin route handlers to responses. Shared across the
 * /api/admin/* routes so the requireSuperAdmin() contract is handled once.
 */
export function adminErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal server error";
  if (message === "Not authenticated") return errorResponse(message, 401);
  if (message === "Forbidden") return errorResponse(message, 403);
  return errorResponse("Internal server error", 500);
}

/**
 * Get the authenticated user from the session.
 * Throws if not authenticated.
 */
export async function getAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  return session.user;
}

/**
 * Read the `x-organisation-id` header and validate the user's membership.
 * Returns `{ user, membership, organisationId }`.
 */
export async function getOrgContext(
  request: Request,
  options?: { skipPaymentGate?: boolean },
) {
  const user = await getAuthenticatedUser();

  const organisationId = request.headers.get("x-organisation-id");

  if (!organisationId) {
    throw new Error("Missing x-organisation-id header");
  }

  const membership = await getMembership(user.id, organisationId);

  if (!membership) {
    throw new Error("Not a member of this organisation");
  }

  // Payment gate: expired trials go read-only. Every content route (and
  // only content routes) flows through here, so this one check gates all
  // writes while leaving reads, settings and billing untouched.
  //
  // Security/management actions (revoking a leaked API key, disabling a
  // webhook) pass `skipPaymentGate` — an expired customer must still be able
  // to cut off integrations, so those must not be blocked behind billing.
  if (!options?.skipPaymentGate && MUTATING_METHODS.has(request.method)) {
    const [org] = await db
      .select({
        plan: organisations.plan,
        trialEndsAt: organisations.trialEndsAt,
      })
      .from(organisations)
      .where(eq(organisations.id, organisationId))
      .limit(1);

    if (org && subscriptionState(org) === "expired") {
      throw new Error("Subscription required — your free trial has ended");
    }
  }

  return { user, membership, organisationId };
}
