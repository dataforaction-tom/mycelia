import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  observationTypeEnum,
  observationSeverityEnum,
  observationStatusEnum,
} from "./enums";
import { organisations } from "./organisations";

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
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});
