import { db } from "@/lib/db";
import { moments } from "@/lib/db/schema";
import { successResponse } from "@/lib/utils/api";
import { getApiContext, apiErrorResponse } from "@/lib/api-keys/context";
import { desc, eq } from "drizzle-orm";

/**
 * Parse `?limit`/`?offset` with defaults 50/0. `limit` is clamped to 1..100
 * and `offset` to >= 0; non-numeric values fall back to the defaults.
 */
function parsePagination(request: Request): { limit: number; offset: number } {
  const params = new URL(request.url).searchParams;

  const rawLimit = Number(params.get("limit"));
  const limit = Number.isFinite(rawLimit)
    ? Math.min(100, Math.max(1, Math.trunc(rawLimit)))
    : 50;

  const rawOffset = Number(params.get("offset"));
  const offset = Number.isFinite(rawOffset)
    ? Math.max(0, Math.trunc(rawOffset))
    : 0;

  return { limit, offset };
}

export async function GET(request: Request) {
  try {
    const { organisationId } = await getApiContext(request, "read");
    const { limit, offset } = parsePagination(request);

    const rows = await db
      .select()
      .from(moments)
      .where(eq(moments.organisationId, organisationId))
      .orderBy(desc(moments.createdAt))
      .limit(limit)
      .offset(offset);

    return successResponse({ data: rows });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
