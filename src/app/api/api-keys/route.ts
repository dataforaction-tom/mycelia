import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { generateApiKey } from "@/lib/api-keys/keys";
import { z } from "zod/v3";
import { and, desc, eq, isNull } from "drizzle-orm";

const createKeySchema = z.object({
  name: z.string().min(1, "A name is required").max(100, "Name is too long"),
  scope: z.enum(["read", "read_write"]),
});

/**
 * Columns returned to clients. The `hashedKey` is NEVER selected, and the
 * full key is only ever surfaced once, by POST-create.
 */
const publicColumns = {
  id: apiKeys.id,
  name: apiKeys.name,
  prefix: apiKeys.prefix,
  scope: apiKeys.scope,
  lastUsedAt: apiKeys.lastUsedAt,
  createdByEmail: apiKeys.createdByEmail,
  createdAt: apiKeys.createdAt,
};

export async function GET(request: NextRequest) {
  try {
    const { membership, organisationId } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "admin")) {
      return errorResponse("Forbidden", 403);
    }

    // Only non-revoked keys — revoked rows are kept for audit but hidden here.
    const items = await db
      .select(publicColumns)
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.organisationId, organisationId),
          isNull(apiKeys.revokedAt)
        )
      )
      .orderBy(desc(apiKeys.createdAt));

    return successResponse({ items });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    if (msg.includes("Subscription required")) return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, membership, organisationId } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "admin")) {
      return errorResponse("Forbidden", 403);
    }

    if (!user.email) {
      return errorResponse("Your account is missing an email address", 400);
    }

    const body = await request.json();
    const parsed = createKeySchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    // Only the hash is stored; the plaintext key exists here just long enough
    // to hand back to the caller once.
    const { key, prefix, hashedKey } = generateApiKey();

    const [created] = await db
      .insert(apiKeys)
      .values({
        organisationId,
        name: parsed.data.name,
        hashedKey,
        prefix,
        scope: parsed.data.scope,
        createdByEmail: user.email,
      })
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        prefix: apiKeys.prefix,
        scope: apiKeys.scope,
        createdAt: apiKeys.createdAt,
      });

    // The full key `secret` is returned THIS ONCE only, never again by GET.
    return successResponse({ key: created, secret: key }, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Forbidden"))
      return errorResponse(msg, 403);
    if (msg.includes("Subscription required")) return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}
