import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  organisations,
  organisationMemberships,
  users,
} from "@/lib/db/schema";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { isValidBearer } from "@/lib/auth/timing";
import {
  dueTrialReminder,
  type TrialReminderFlags,
} from "@/lib/billing/subscription";
import { sendTrialEndingEmail } from "@/lib/email/messages";
import { and, eq, gt, lt } from "drizzle-orm";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Daily cron: warn trial orgs 7 days and 1 day before their trial ends.
 * Dedup via settings.trialReminders flags so each warning fires once.
 * Invoked by the host's scheduler (see vercel.json); protected by
 * CRON_SECRET so it can't be triggered by strangers.
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
  const candidates = await db
    .select({
      id: organisations.id,
      name: organisations.name,
      slug: organisations.slug,
      plan: organisations.plan,
      trialEndsAt: organisations.trialEndsAt,
      settings: organisations.settings,
      ownerEmail: users.email,
    })
    .from(organisations)
    .innerJoin(
      organisationMemberships,
      and(
        eq(organisationMemberships.organisationId, organisations.id),
        eq(organisationMemberships.role, "owner"),
      ),
    )
    .innerJoin(users, eq(users.id, organisationMemberships.userId))
    .where(
      and(
        eq(organisations.plan, "trial"),
        gt(organisations.trialEndsAt, now),
        lt(organisations.trialEndsAt, new Date(now.getTime() + WEEK_MS)),
      ),
    );

  let sent = 0;
  for (const org of candidates) {
    const settings = (org.settings ?? {}) as {
      trialReminders?: TrialReminderFlags;
      [key: string]: unknown;
    };
    const flags = settings.trialReminders ?? {};
    const due = dueTrialReminder(org, flags);
    if (!due || !org.ownerEmail || !org.trialEndsAt) continue;

    try {
      await sendTrialEndingEmail(
        org.ownerEmail,
        org.name,
        org.slug,
        org.trialEndsAt,
      );
      await db
        .update(organisations)
        .set({
          settings: {
            ...settings,
            trialReminders: { ...flags, [due]: true },
          },
        })
        .where(eq(organisations.id, org.id));
      sent += 1;
    } catch {
      // Skip this org today; the next run retries since the flag isn't set.
    }
  }

  return successResponse({ checked: candidates.length, sent });
}
