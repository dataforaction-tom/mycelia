import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Audit trail for platform-admin actions. Deliberately minimal, but present
 * from day one because the admin surface is destructive (suspend, delete,
 * change email) and run solo — this is the record of who did what to whom.
 *
 * actorUserId is set null (not cascade-deleted) so history survives even if
 * the acting admin's account is later removed. targetId is a bare uuid, not a
 * FK, because the target may be a user or an organisation.
 */
export const adminActions = pgTable("admin_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: uuid("target_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});
