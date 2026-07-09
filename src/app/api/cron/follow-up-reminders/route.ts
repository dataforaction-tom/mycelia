import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { observations } from "@/lib/db/schema";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { and, eq, lte } from "drizzle-orm";

/**
 * Daily cron: surface follow-up reminders that have come due.
 *
 * A follow-up lives as a "scheduled" observation (hidden from every surface)
 * until its dueAt. This sweep flips due ones to "new", at which point they
 * appear in the dashboard whispers and Field notes like any other observation.
 * The flip is self-idempotent — a "new" row is never re-selected — so no extra
 * dedup flag is needed. Delivery is in-app only; the "scheduled → new" hook is
 * where an email step would slot in later.
 *
 * Invoked by the host's scheduler (see vercel.json); protected by CRON_SECRET
 * so it can't be triggered by strangers.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return errorResponse("Cron is not configured", 503);
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return errorResponse("Unauthorized", 401);
  }

  const now = new Date();
  const surfaced = await db
    .update(observations)
    .set({ status: "new" })
    .where(
      and(
        eq(observations.type, "follow_up"),
        eq(observations.status, "scheduled"),
        lte(observations.dueAt, now),
      ),
    )
    .returning({ id: observations.id });

  return successResponse({ surfaced: surfaced.length });
}
