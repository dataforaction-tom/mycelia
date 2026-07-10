import { db } from "@/lib/db";
import { adminActions } from "@/lib/db/schema";

/**
 * Append a row to the platform-admin audit trail. Best-effort by convention —
 * callers await it, but a logging failure should never mask the fact that the
 * action itself succeeded, so wrap accordingly at the call site if needed.
 */
export async function recordAdminAction(input: {
  actorUserId: string;
  action: string;
  targetType: "user" | "organisation" | "feedback";
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(adminActions).values({
    actorUserId: input.actorUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    metadata: input.metadata ?? {},
  });
}
