import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { connectionSpaces, spaces } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { linkSpacesSchema } from "@/lib/validators/spaces";
import { and, eq } from "drizzle-orm";

type Params = { params: Promise<{ connectionId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { connectionId } = await params;

    if (!hasMinRole(membership.role, "viewer")) {
      return errorResponse("Forbidden", 403);
    }

    const linked = await db
      .select({
        id: spaces.id,
        name: spaces.name,
      })
      .from(connectionSpaces)
      .innerJoin(spaces, eq(connectionSpaces.spaceId, spaces.id))
      .where(
        and(
          eq(connectionSpaces.connectionId, connectionId),
          eq(spaces.organisationId, organisationId)
        )
      );

    return successResponse(linked);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { membership } = await getOrgContext(request);
    const { connectionId } = await params;

    if (!hasMinRole(membership.role, "contributor")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = linkSpacesSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const values = parsed.data.spaceIds.map((spaceId) => ({
      connectionId,
      spaceId,
    }));

    await db.insert(connectionSpaces).values(values).onConflictDoNothing();

    return successResponse({ linked: parsed.data.spaceIds.length }, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { membership } = await getOrgContext(request);
    const { connectionId } = await params;

    if (!hasMinRole(membership.role, "contributor")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = linkSpacesSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    for (const spaceId of parsed.data.spaceIds) {
      await db
        .delete(connectionSpaces)
        .where(
          and(
            eq(connectionSpaces.connectionId, connectionId),
            eq(connectionSpaces.spaceId, spaceId)
          )
        );
    }

    return successResponse({ unlinked: parsed.data.spaceIds.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member")) return errorResponse(msg, 403);
    return errorResponse("Internal server error", 500);
  }
}
