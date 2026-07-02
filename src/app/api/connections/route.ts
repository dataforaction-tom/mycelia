import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import {
  createConnectionSchema,
  listConnectionsSchema,
} from "@/lib/validators/connections";
import { PLAN_LIMITS } from "@/lib/config/plans";
import { organisations } from "@/lib/db/schema";
import { and, eq, ilike, asc, desc, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { membership, organisationId } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "viewer")) {
      return errorResponse("Forbidden", 403);
    }

    const url = new URL(request.url);
    const parsed = listConnectionsSchema.safeParse(
      Object.fromEntries(url.searchParams)
    );

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const { search, type, sort, order, limit, offset } = parsed.data;

    const conditions = [eq(connections.organisationId, organisationId)];
    if (type) conditions.push(eq(connections.type, type));
    if (search) conditions.push(ilike(connections.name, `%${search}%`));

    const orderCol =
      sort === "name"
        ? connections.name
        : sort === "created_at"
          ? connections.createdAt
          : connections.updatedAt;

    const orderFn = order === "asc" ? asc : desc;

    const rows = await db
      .select()
      .from(connections)
      .where(and(...conditions))
      .orderBy(orderFn(orderCol))
      .limit(limit)
      .offset(offset);

    const [total] = await db
      .select({ value: count() })
      .from(connections)
      .where(and(...conditions));

    return successResponse({ items: rows, total: total.value });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Missing x-organisation-id"))
      return errorResponse(msg, 400);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
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
    const parsed = createConnectionSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    // Check plan limits
    const [org] = await db
      .select({ plan: organisations.plan })
      .from(organisations)
      .where(eq(organisations.id, organisationId))
      .limit(1);

    if (org) {
      const [connectionCount] = await db
        .select({ value: count() })
        .from(connections)
        .where(eq(connections.organisationId, organisationId));

      const limit = PLAN_LIMITS[org.plan].connections;
      if (connectionCount.value >= limit) {
        return errorResponse(
          `Your plan allows up to ${limit} connections. Upgrade to add more.`,
          403
        );
      }
    }

    const [connection] = await db
      .insert(connections)
      .values({
        organisationId,
        name: parsed.data.name,
        type: parsed.data.type,
        metadata: parsed.data.metadata ?? {},
      })
      .returning();

    return successResponse(connection, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Missing x-organisation-id"))
      return errorResponse(msg, 400);
    if (msg.includes("Not a member") || msg.includes("Forbidden"))
      return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}
