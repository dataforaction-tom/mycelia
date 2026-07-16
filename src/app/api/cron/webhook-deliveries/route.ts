import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  webhookDeliveries,
  webhookEndpoints,
} from "@/lib/db/schema/webhooks";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { deliverOne } from "@/lib/webhooks/deliver";
import { isValidBearer } from "@/lib/auth/timing";
import { and, eq, inArray, isNull, lte, or } from "drizzle-orm";

/** Cap how many deliveries a single run will attempt. */
const BATCH_SIZE = 50;

/**
 * Retry cron: pick up webhook deliveries that are pending or previously failed
 * and due (no next retry scheduled, or the scheduled time has passed), then
 * attempt each one. Protected by CRON_SECRET so strangers can't trigger it.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return errorResponse("Cron is not configured", 503);
  }
  if (!isValidBearer(request.headers.get("authorization"), secret)) {
    return errorResponse("Unauthorized", 401);
  }

  const now = new Date();
  const due = await db
    .select()
    .from(webhookDeliveries)
    .where(
      and(
        inArray(webhookDeliveries.status, ["pending", "failed"]),
        or(
          isNull(webhookDeliveries.nextRetryAt),
          lte(webhookDeliveries.nextRetryAt, now),
        ),
      ),
    )
    .limit(BATCH_SIZE);

  let skipped = 0;
  const attemptedIds: string[] = [];

  for (const delivery of due) {
    const [endpoint] = await db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.id, delivery.endpointId))
      .limit(1);

    if (!endpoint || !endpoint.active) {
      skipped += 1;
      continue;
    }

    await deliverOne(delivery, endpoint);
    attemptedIds.push(delivery.id);
  }

  // Tally outcomes by re-reading the rows deliverOne just updated.
  let delivered = 0;
  let failed = 0;
  let dead = 0;
  if (attemptedIds.length) {
    const results = await db
      .select({ status: webhookDeliveries.status })
      .from(webhookDeliveries)
      .where(inArray(webhookDeliveries.id, attemptedIds));

    for (const row of results) {
      if (row.status === "delivered") delivered += 1;
      else if (row.status === "dead") dead += 1;
      else failed += 1;
    }
  }

  return successResponse({
    checked: due.length,
    delivered,
    failed,
    dead,
    skipped,
  });
}
