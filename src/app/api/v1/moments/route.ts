import { NextRequest } from "next/server";
import { z } from "zod/v3";
import { db } from "@/lib/db";
import { moments } from "@/lib/db/schema";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { getApiContext, apiErrorResponse } from "@/lib/api-keys/context";
import { applyMomentSideEffects } from "@/lib/moments/side-effects";
import { desc, eq } from "drizzle-orm";

/**
 * Body schema for API-key moment creation. Unlike the session schema, `source`
 * is fixed to "api" by the route (not client-supplied) and there is no default
 * source field.
 */
const createMomentApiSchema = z.object({
  content: z.string().min(1, "Content is required").max(10000),
  connectionIds: z.array(z.string().uuid()).optional(),
  spaceId: z.string().uuid().optional(),
  eventDate: z.coerce.date().optional(),
});

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

export async function POST(request: NextRequest) {
  try {
    // Enforces read_write scope: read-only keys throw "Insufficient scope",
    // which apiErrorResponse maps to 403.
    const { organisationId } = await getApiContext(request, "read_write");

    const body = await request.json();
    const parsed = createMomentApiSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const [moment] = await db
      .insert(moments)
      .values({
        organisationId,
        authorId: null,
        content: parsed.data.content,
        source: "api",
        eventDate: parsed.data.eventDate,
        spaceId: parsed.data.spaceId,
      })
      .returning();

    // Shared with the session route: links connections, strengthens
    // deterministic network links (may fail the request), and best-effort
    // quality inference, thread synthesis, and moment.created emission. The
    // actor marks this as an API-key-originated write.
    await applyMomentSideEffects({
      organisationId,
      moment,
      connectionIds: parsed.data.connectionIds ?? [],
      actor: { kind: "system", ref: "tending:apikey" },
    });

    return successResponse(moment, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
