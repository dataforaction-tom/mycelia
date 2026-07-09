import { after } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { webhookEndpoints, webhookDeliveries } from "@/lib/db/schema/webhooks";
import { buildEnvelope, type WebhookEventName, type EnvelopeActor, type EnvelopeSubject } from "./envelope";
import { deliverOne } from "./deliver";

/**
 * Emit an outbound webhook event for an organisation. Builds a Watershed-shaped
 * envelope, records a pending delivery per subscribed endpoint, then schedules
 * best-effort delivery after the response is flushed.
 *
 * This sits on the request hot path, so it NEVER throws into the caller: any
 * failure is swallowed and logged. A dropped webhook must not break the user
 * action that triggered it.
 */
export async function emitEvent(
  organisationId: string,
  event: WebhookEventName,
  input: { actor: EnvelopeActor; subject: EnvelopeSubject; data: Record<string, unknown> },
): Promise<void> {
  try {
    const envelope = buildEnvelope({
      event,
      organisationId,
      tenantId: organisationId,
      actor: input.actor,
      subject: input.subject,
      data: input.data,
    });

    const endpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.organisationId, organisationId),
          eq(webhookEndpoints.active, true),
        ),
      );

    const subscribed = endpoints.filter((endpoint) =>
      endpoint.events.includes(event),
    );
    if (subscribed.length === 0) return;

    const deliveries = await db
      .insert(webhookDeliveries)
      .values(
        subscribed.map((endpoint) => ({
          eventId: envelope.id,
          endpointId: endpoint.id,
          event,
          payload: envelope,
          status: "pending" as const,
        })),
      )
      .returning();

    // Fire after the response is sent so the caller isn't blocked on network I/O.
    after(async () => {
      for (const delivery of deliveries) {
        const endpoint = subscribed.find(
          (candidate) => candidate.id === delivery.endpointId,
        );
        if (!endpoint) continue;
        await deliverOne(delivery, endpoint);
      }
    });
  } catch (error) {
    console.error("Failed to emit webhook event", { event, organisationId, error });
  }
}
