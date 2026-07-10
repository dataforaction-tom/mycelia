import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {
  feedbackTypeEnum,
  feedbackStatusEnum,
  feedbackPriorityEnum,
} from "./enums";
import { organisations } from "./organisations";
import { users } from "./auth";

/**
 * User-submitted feedback — bug reports and feature requests raised from
 * inside the app, triaged in the admin panel. The submitter and org are
 * captured for context but set null (not cascade) so feedback survives the
 * account or org being removed; pageUrl records where it was raised.
 */
export const feedback = pgTable("feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisationId: uuid("organisation_id").references(() => organisations.id, {
    onDelete: "set null",
  }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  type: feedbackTypeEnum("type").notNull().default("other"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: feedbackStatusEnum("status").notNull().default("new"),
  priority: feedbackPriorityEnum("priority").notNull().default("medium"),
  adminNotes: text("admin_notes"),
  pageUrl: text("page_url"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});
