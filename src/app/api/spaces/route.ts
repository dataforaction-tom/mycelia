import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { spaces, organisations } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { createSpaceSchema, listSpacesSchema } from "@/lib/validators/spaces";
import { PLAN_LIMITS } from "@/lib/config/plans";
import { and, eq, ilike, desc, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { membership, organisationId } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "viewer")) {
      return errorResponse("Forbidden", 403);
    }

    const url = new URL(request.url);
    const parsed = listSpacesSchema.safeParse(
      Object.fromEntries(url.searchParams)
    );

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const { search, limit, offset } = parsed.data;

    const conditions = [eq(spaces.organisationId, organisationId)];
    if (search) conditions.push(ilike(spaces.name, `%${search}%`));

    const rows = await db
      .select()
      .from(spaces)
      .where(and(...conditions))
      .orderBy(desc(spaces.createdAt))
      .limit(limit)
      .offset(offset);

    return successResponse({ items: rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    if (msg.includes("Subscription required"))
      return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { membership, organisationId } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "contributor")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = createSpaceSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const [org] = await db
      .select({ plan: organisations.plan })
      .from(organisations)
      .where(eq(organisations.id, organisationId))
      .limit(1);

    if (org) {
      const [spaceCount] = await db
        .select({ value: count() })
        .from(spaces)
        .where(eq(spaces.organisationId, organisationId));

      const limit = PLAN_LIMITS[org.plan].spaces;
      if (spaceCount.value >= limit) {
        return errorResponse(
          `Your plan allows up to ${limit} spaces. Upgrade to add more.`,
          403
        );
      }
    }

    const [space] = await db
      .insert(spaces)
      .values({
        organisationId,
        name: parsed.data.name,
        description: parsed.data.description,
      })
      .returning();

    return successResponse(space, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Forbidden"))
      return errorResponse(msg, 403);
    if (msg.includes("Subscription required"))
      return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}
