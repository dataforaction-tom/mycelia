import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMembership } from "@/lib/auth/permissions";

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
export async function getOrgContext(request: Request) {
  const user = await getAuthenticatedUser();

  const organisationId = request.headers.get("x-organisation-id");

  if (!organisationId) {
    throw new Error("Missing x-organisation-id header");
  }

  const membership = await getMembership(user.id, organisationId);

  if (!membership) {
    throw new Error("Not a member of this organisation");
  }

  return { user, membership, organisationId };
}
