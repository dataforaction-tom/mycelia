import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { apiKeyScopeEnum } from "./enums";
import { organisations } from "./organisations";

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  hashedKey: text("hashed_key").notNull().unique(),
  prefix: text("prefix").notNull(),
  scope: apiKeyScopeEnum("scope").notNull().default("read"),
  lastUsedAt: timestamp("last_used_at", { mode: "date", withTimezone: true }),
  createdByEmail: text("created_by_email").notNull(),
  revokedAt: timestamp("revoked_at", { mode: "date", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  windowStartedAt: timestamp("window_started_at", {
    mode: "date",
    withTimezone: true,
  }),
  windowCount: integer("window_count").notNull().default(0),
});
