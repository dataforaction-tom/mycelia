import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { webhookEndpoints } from "@/lib/db/schema";
import { successResponse, errorResponse, getOrgContext } from "@/lib/utils/api";
import { hasMinRole } from "@/lib/auth/permissions";
import { generateSecret } from "@/lib/webhooks/sign";
import { isSafeWebhookUrl } from "@/lib/webhooks/verify-url";
import type { WebhookEventName } from "@/lib/webhooks/envelope";
import { z } from "zod/v3";
import { eq, desc } from "drizzle-orm";

/**
 * The five emittable event names, kept in lockstep with `WebhookEventName`
 * via `satisfies` so an added/removed union member is a compile error here.
 */
const WEBHOOK_EVENT_NAMES = [
  "moment.created",
  "connection.created",
  "observation.generated",
  "quality.shifted",
  "follow_up.due",
] as const satisfies readonly WebhookEventName[];

const createEndpointSchema = z.object({
  url: z.string().min(1, "A destination URL is required"),
  events: z
    .array(z.enum(WEBHOOK_EVENT_NAMES))
    .min(1, "Subscribe to at least one event"),
});

/**
 * Columns returned to clients. The `secret` is deliberately excluded — it is
 * only ever surfaced once, by POST-create (and rotation).
 */
const publicColumns = {
  id: webhookEndpoints.id,
  url: webhookEndpoints.url,
  events: webhookEndpoints.events,
  active: webhookEndpoints.active,
  lastDeliveryAt: webhookEndpoints.lastDeliveryAt,
  lastStatus: webhookEndpoints.lastStatus,
  createdAt: webhookEndpoints.createdAt,
};

export async function GET(request: NextRequest) {
  try {
    const { membership, organisationId } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "admin")) {
      return errorResponse("Forbidden", 403);
    }

    const items = await db
      .select(publicColumns)
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.organisationId, organisationId))
      .orderBy(desc(webhookEndpoints.createdAt));

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
    const { membership, organisationId } = await getOrgContext(request);

    if (!hasMinRole(membership.role, "admin")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = createEndpointSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    // Server-side SSRF guard — never trust the client's own validation.
    if (!isSafeWebhookUrl(parsed.data.url)) {
      return errorResponse(
        "That URL isn't allowed. Use a public https endpoint.",
        422
      );
    }

    const secret = generateSecret();

    const [endpoint] = await db
      .insert(webhookEndpoints)
      .values({
        organisationId,
        url: parsed.data.url,
        events: parsed.data.events,
        secret,
        active: true,
      })
      .returning(publicColumns);

    // The secret is returned THIS ONCE, never again by GET/PATCH.
    return successResponse({ endpoint, secret }, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Forbidden"))
      return errorResponse(msg, 403);
    if (msg.includes("Subscription required")) return errorResponse(msg, 402);
    return errorResponse("Internal server error", 500);
  }
}
