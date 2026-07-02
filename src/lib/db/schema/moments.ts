import { jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { momentSourceEnum } from "./enums";
import { organisations } from "./organisations";
import { users } from "./auth";
import { spaces } from "./spaces";
import { connections } from "./connections";

export const moments = pgTable("moments", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => users.id),
  content: text("content").notNull(),
  source: momentSourceEnum("source").notNull().default("manual"),
  eventDate: timestamp("event_date", { mode: "date", withTimezone: true }),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  aiExtraction: jsonb("ai_extraction")
    .$type<Record<string, unknown>>()
    .default({}),
  spaceId: uuid("space_id").references(() => spaces.id),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const momentConnections = pgTable(
  "moment_connections",
  {
    momentId: uuid("moment_id")
      .notNull()
      .references(() => moments.id, { onDelete: "cascade" }),
    connectionId: uuid("connection_id")
      .notNull()
      .references(() => connections.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.momentId, table.connectionId] })]
);
