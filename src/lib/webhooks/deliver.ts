import { eq, type InferSelectModel } from "drizzle-orm";
import { db } from "@/lib/db";
import { webhookDeliveries, webhookEndpoints } from "@/lib/db/schema/webhooks";
import { nextRetryAt } from "./backoff";
import { sign } from "./sign";
import { isSafeWebhookUrl, resolvedHostIsPublic } from "./verify-url";

type Delivery = InferSelectModel<typeof webhookDeliveries>;
type Endpoint = InferSelectModel<typeof webhookEndpoints>;

/** How long a subscriber has to respond before we treat the POST as failed. */
const DELIVERY_TIMEOUT_MS = 10_000;

/**
 * Attempt a single webhook delivery: sign and POST the stored payload to the
 * endpoint, then record the outcome on both the delivery and the endpoint.
 *
 * Never throws — every failure path (unsafe URL, non-2xx response, network
 * error, timeout) is captured as delivery state so a background scheduler can
 * safely fire-and-forget this. On failure it either schedules the next retry
 * or, once the backoff schedule is exhausted, marks the delivery dead.
 */
export async function deliverOne(
  delivery: Delivery,
  endpoint: Endpoint
): Promise<void> {
  // Re-check the destination at send time: a URL that was safe when stored may
  // have become unsafe, and we must never POST to an internal address. The
  // string guard rejects private IP literals; the DNS resolve additionally
  // rejects a public hostname that now resolves to an internal IP (SSRF via
  // DNS). Both run before we open any socket.
  //
  // The DNS resolve is a production hardening only: outside production,
  // isSafeWebhookUrl deliberately allows http-to-localhost for local webhook
  // testing, and resolving "localhost" to loopback would otherwise (correctly)
  // fail that check and kill the delivery. So we skip the resolve in dev to
  // keep that exception working, while still rejecting private IP literals.
  const isProduction = process.env.NODE_ENV === "production";
  const safeString = isSafeWebhookUrl(endpoint.url);
  const safeResolved =
    safeString &&
    (!isProduction ||
      (await resolvedHostIsPublic(new URL(endpoint.url).hostname)));
  if (!safeString || !safeResolved) {
    await db
      .update(webhookDeliveries)
      .set({
        status: "dead",
        lastStatusCode: null,
        nextRetryAt: null,
        attempts: delivery.attempts + 1,
        lastAttemptAt: new Date(),
      })
      .where(eq(webhookDeliveries.id, delivery.id));
    return;
  }

  const rawBody = JSON.stringify(delivery.payload);
  const signature = sign(rawBody, endpoint.secret);

  try {
    const res = await fetch(endpoint.url, {
      method: "POST",
      // Never follow redirects: the SSRF guard only validated endpoint.url, so
      // a public endpoint that 3xx-redirects to an internal address (metadata,
      // localhost) would otherwise bypass it — and 307/308 preserve the POST
      // body. We treat any redirect as a permanent failure below.
      redirect: "manual",
      headers: {
        "Content-Type": "application/json",
        "X-Tending-Signature": signature,
        "X-Tending-Event": delivery.event,
        "X-Tending-Delivery": delivery.id,
      },
      body: rawBody,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });

    const attempts = delivery.attempts + 1;
    const now = new Date();

    if (res.ok) {
      await db
        .update(webhookDeliveries)
        .set({
          status: "delivered",
          attempts,
          lastAttemptAt: now,
          lastStatusCode: res.status,
          nextRetryAt: null,
        })
        .where(eq(webhookDeliveries.id, delivery.id));
      await db
        .update(webhookEndpoints)
        .set({ lastDeliveryAt: now, lastStatus: "delivered" })
        .where(eq(webhookEndpoints.id, endpoint.id));
      return;
    }

    // A redirect (3xx, surfaced here because redirect: "manual") is never
    // followed and never retried — kill the delivery so we can't be walked to
    // an internal target on a later attempt.
    const isRedirect = res.status >= 300 && res.status < 400;
    const next = isRedirect ? null : nextRetryAt(attempts, now);
    await db
      .update(webhookDeliveries)
      .set({
        status: next ? "failed" : "dead",
        attempts,
        lastAttemptAt: now,
        lastStatusCode: res.status,
        nextRetryAt: next,
      })
      .where(eq(webhookDeliveries.id, delivery.id));
    await db
      .update(webhookEndpoints)
      .set({ lastDeliveryAt: now, lastStatus: String(res.status) })
      .where(eq(webhookEndpoints.id, endpoint.id));
  } catch {
    // Network error or timeout: no HTTP status to record.
    const attempts = delivery.attempts + 1;
    const now = new Date();
    const next = nextRetryAt(attempts, now);
    await db
      .update(webhookDeliveries)
      .set({
        status: next ? "failed" : "dead",
        attempts,
        lastAttemptAt: now,
        lastStatusCode: null,
        nextRetryAt: next,
      })
      .where(eq(webhookDeliveries.id, delivery.id));
  }
}
