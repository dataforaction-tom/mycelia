import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { webhookEndpoints } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { generateSecret } from "@/lib/webhooks/sign";
import type { WebhookEventName } from "@/lib/webhooks/envelope";
import { z } from "zod/v3";
import { and, eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

/**
 * Kept in lockstep with `WebhookEventName` via `satisfies`.
 * follow_up.due is emitted only once the reminder cron lands (separate branch); omit until then.
 */
const SUBSCRIBABLE_EVENTS = [
  "moment.created",
  "connection.created",
  "observation.generated",
  "quality.shifted",
] as const satisfies readonly WebhookEventName[];

const updateEndpointSchema = z
  .object({
    active: z.boolean().optional(),
    events: z
      .array(z.enum(SUBSCRIBABLE_EVENTS))
      .min(1, "Subscribe to at least one event")
      .optional(),
    rotateSecret: z.literal(true).optional(),
  })
  .refine(
    (value) =>
      value.active !== undefined ||
      value.events !== undefined ||
      value.rotateSecret !== undefined,
    { message: "Nothing to update" }
  );

/** Columns returned to clients — never includes `secret`. */
const publicColumns = {
  id: webhookEndpoints.id,
  url: webhookEndpoints.url,
  events: webhookEndpoints.events,
  active: webhookEndpoints.active,
  lastDeliveryAt: webhookEndpoints.lastDeliveryAt,
  lastStatus: webhookEndpoints.lastStatus,
  createdAt: webhookEndpoints.createdAt,
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { id } = await params;

    if (!hasMinRole(membership.role, "admin")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = updateEndpointSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    // Org-scope the target: an admin of org A must not touch org B's endpoint.
    const [existing] = await db
      .select({ id: webhookEndpoints.id })
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, id),
          eq(webhookEndpoints.organisationId, organisationId)
        )
      )
      .limit(1);

    if (!existing) return errorResponse("Endpoint not found", 404);

    const { active, events, rotateSecret } = parsed.data;

    // Rotation mints a fresh secret and returns it once, like create.
    const newSecret = rotateSecret ? generateSecret() : undefined;

    const updateValues: Partial<typeof webhookEndpoints.$inferInsert> = {};
    if (active !== undefined) updateValues.active = active;
    if (events !== undefined) updateValues.events = events;
    if (newSecret !== undefined) updateValues.secret = newSecret;

    const [endpoint] = await db
      .update(webhookEndpoints)
      .set(updateValues)
      .where(
        and(
          eq(webhookEndpoints.id, id),
          eq(webhookEndpoints.organisationId, organisationId)
        )
      )
      .returning(publicColumns);

    if (!endpoint) return errorResponse("Endpoint not found", 404);

    if (newSecret) {
      // Secret surfaced this once only.
      return successResponse({ endpoint, secret: newSecret });
    }

    return successResponse({ endpoint });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Forbidden"))
      return errorResponse(msg, 403);
    if (msg.includes("Subscription required")) return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { membership, organisationId } = await getOrgContext(request);
    const { id } = await params;

    if (!hasMinRole(membership.role, "admin")) {
      return errorResponse("Forbidden", 403);
    }

    const [deleted] = await db
      .delete(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, id),
          eq(webhookEndpoints.organisationId, organisationId)
        )
      )
      .returning({ id: webhookEndpoints.id });

    if (!deleted) return errorResponse("Endpoint not found", 404);

    // Deliveries cascade via the FK onDelete: "cascade".
    return successResponse({ deleted: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Forbidden"))
      return errorResponse(msg, 403);
    if (msg.includes("Subscription required")) return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}
