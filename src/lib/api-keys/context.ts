import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { errorResponse } from "@/lib/utils/api";
import { hashApiKey } from "./keys";
import { checkWindow } from "./rate-limit";

export type ApiScope = "read" | "read_write";

export interface ApiContext {
  organisationId: string;
  scope: ApiScope;
  keyId: string;
}

// Fixed-window rate limit applied per API key.
const RATE_LIMIT = 120;
const WINDOW_MS = 60_000;

/**
 * Authenticate an `/api/v1` request from its `Authorization: Bearer <token>`
 * header, enforce the required scope, apply a per-key rate limit, and return
 * the resolved organisation/scope/key context.
 *
 * Throws plain `Error`s with stable messages that `apiErrorResponse` maps to
 * HTTP status codes. Never leaks whether a specific key exists — any auth
 * failure is reported uniformly as "Invalid API key".
 */
export async function getApiContext(
  request: Request,
  requiredScope: ApiScope
): Promise<ApiContext> {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    throw new Error("Invalid API key");
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    throw new Error("Invalid API key");
  }

  const hash = hashApiKey(token);

  const [key] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.hashedKey, hash), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (!key) {
    throw new Error("Invalid API key");
  }

  if (requiredScope === "read_write" && key.scope === "read") {
    throw new Error("Insufficient scope");
  }

  const now = new Date();
  const { allowed, next } = checkWindow(
    { windowStartedAt: key.windowStartedAt, windowCount: key.windowCount },
    now,
    RATE_LIMIT,
    WINDOW_MS
  );

  if (!allowed) {
    throw new Error("Rate limit exceeded");
  }

  await db
    .update(apiKeys)
    .set({
      windowStartedAt: next.windowStartedAt,
      windowCount: next.windowCount,
      lastUsedAt: now,
    })
    .where(eq(apiKeys.id, key.id));

  return {
    organisationId: key.organisationId,
    scope: key.scope,
    keyId: key.id,
  };
}

/**
 * Map a thrown auth/rate-limit error to the appropriate HTTP response.
 * Unknown errors fall through to a generic 500 so internal details never
 * reach API consumers.
 */
export function apiErrorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : "";

  switch (message) {
    case "Invalid API key":
      return errorResponse(message, 401);
    case "Insufficient scope":
      return errorResponse(message, 403);
    case "Rate limit exceeded":
      return errorResponse(message, 429);
    default:
      return errorResponse("Internal server error", 500);
  }
}
