import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { observations } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { listObservationsSchema } from "@/lib/validators/observations";
import { and, eq, desc, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { membership, organisationId } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "viewer")) {
      return errorResponse("Forbidden", 403);
    }

    const url = new URL(request.url);
    const parsed = listObservationsSchema.safeParse(
      Object.fromEntries(url.searchParams)
    );

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const { status, limit, offset } = parsed.data;

    const conditions = [eq(observations.organisationId, organisationId)];
    if (status) conditions.push(eq(observations.status, status));

    const rows = await db
      .select()
      .from(observations)
      .where(and(...conditions))
      .orderBy(desc(observations.createdAt))
      .limit(limit)
      .offset(offset);

    // "seen" isn't a user decision, it's a read receipt — showing an
    // observation to someone counts as seeing it, so this GET has the
    // side effect of flushing "new" rows to "seen" rather than requiring
    // a separate PATCH call per card on mount.
    const newIds = rows
      .filter((r) => r.status === "new")
      .map((r) => r.id);

    if (newIds.length) {
      await db
        .update(observations)
        .set({ status: "seen" })
        .where(
          and(
            eq(observations.organisationId, organisationId),
            inArray(observations.id, newIds)
          )
        );

      for (const row of rows) {
        if (newIds.includes(row.id)) row.status = "seen";
      }
    }

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
