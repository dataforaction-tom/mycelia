import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { moments, momentConnections, organisations } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { createMomentSchema, listMomentsSchema } from "@/lib/validators/moments";
import { strengthenLinksForMoment } from "@/lib/network/infer-links";
import { PLAN_LIMITS } from "@/lib/config/plans";
import { and, eq, asc, desc, count, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { membership, organisationId } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "viewer")) {
      return errorResponse("Forbidden", 403);
    }

    const url = new URL(request.url);
    const parsed = listMomentsSchema.safeParse(
      Object.fromEntries(url.searchParams)
    );

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const { connectionId, spaceId, sort, order, limit, offset } = parsed.data;

    const conditions = [eq(moments.organisationId, organisationId)];
    if (spaceId) conditions.push(eq(moments.spaceId, spaceId));

    const orderCol =
      sort === "event_date" ? moments.eventDate : moments.createdAt;
    const orderFn = order === "asc" ? asc : desc;

    let rows;

    if (connectionId) {
      rows = await db
        .select({
          id: moments.id,
          organisationId: moments.organisationId,
          authorId: moments.authorId,
          content: moments.content,
          source: moments.source,
          eventDate: moments.eventDate,
          attachments: moments.attachments,
          aiExtraction: moments.aiExtraction,
          spaceId: moments.spaceId,
          createdAt: moments.createdAt,
        })
        .from(moments)
        .innerJoin(
          momentConnections,
          eq(moments.id, momentConnections.momentId)
        )
        .where(
          and(
            eq(moments.organisationId, organisationId),
            eq(momentConnections.connectionId, connectionId)
          )
        )
        .orderBy(orderFn(orderCol))
        .limit(limit)
        .offset(offset);
    } else {
      rows = await db
        .select()
        .from(moments)
        .where(and(...conditions))
        .orderBy(orderFn(orderCol))
        .limit(limit)
        .offset(offset);
    }

    return successResponse({ items: rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, membership, organisationId } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "contributor")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = createMomentSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    // Check plan limits (moments per month)
    const [org] = await db
      .select({ plan: organisations.plan })
      .from(organisations)
      .where(eq(organisations.id, organisationId))
      .limit(1);

    if (org) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [monthlyCount] = await db
        .select({ value: count() })
        .from(moments)
        .where(
          and(
            eq(moments.organisationId, organisationId),
            gte(moments.createdAt, monthStart)
          )
        );

      const limit = PLAN_LIMITS[org.plan].momentsPerMonth;
      if (monthlyCount.value >= limit) {
        return errorResponse(
          `Your plan allows up to ${limit} moments per month. Upgrade to add more.`,
          403
        );
      }
    }

    const [moment] = await db
      .insert(moments)
      .values({
        organisationId,
        authorId: user.id,
        content: parsed.data.content,
        source: parsed.data.source,
        eventDate: parsed.data.eventDate,
        spaceId: parsed.data.spaceId,
      })
      .returning();

    // Link connections if provided
    if (parsed.data.connectionIds?.length) {
      await db.insert(momentConnections).values(
        parsed.data.connectionIds.map((connectionId) => ({
          momentId: moment.id,
          connectionId,
        }))
      );

      if (parsed.data.connectionIds.length >= 2) {
        await strengthenLinksForMoment(
          organisationId,
          parsed.data.connectionIds
        );
      }
    }

    return successResponse(moment, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}
