import { jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { connectionTypeEnum } from "./enums";
import { organisations } from "./organisations";
import { spaces } from "./spaces";

export const connections = pgTable("connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: connectionTypeEnum("type").notNull().default("person"),
  threadSummary: text("thread_summary"),
  threadUpdatedAt: timestamp("thread_updated_at", {
    mode: "date",
    withTimezone: true,
  }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const connectionSpaces = pgTable(
  "connection_spaces",
  {
    connectionId: uuid("connection_id")
      .notNull()
      .references(() => connections.id, { onDelete: "cascade" }),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.connectionId, table.spaceId] })]
);
