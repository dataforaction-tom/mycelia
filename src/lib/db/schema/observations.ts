import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  observationTypeEnum,
  observationSeverityEnum,
  observationStatusEnum,
} from "./enums";
import { organisations } from "./organisations";
import { moments } from "./moments";

export const observations = pgTable("observations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "cascade" }),
  type: observationTypeEnum("type").notNull(),
  content: text("content").notNull(),
  connections: uuid("connections")
    .array()
    .notNull()
    .default(sql`'{}'::uuid[]`),
  severity: observationSeverityEnum("severity").notNull().default("gentle"),
  status: observationStatusEnum("status").notNull().default("new"),
  userResponse: text("user_response"),
  // Follow-up reminders only: when the nudge should surface. Null for the
  // network-health observation types, which appear as soon as they're created.
  dueAt: timestamp("due_at", { mode: "date", withTimezone: true }),
  // The moment a follow-up reminder was extracted from, if any. Kept nullable
  // (onDelete: "set null") so deleting a moment doesn't erase the reminder.
  sourceMomentId: uuid("source_moment_id").references(() => moments.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});
