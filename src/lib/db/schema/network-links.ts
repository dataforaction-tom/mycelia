import { pgTable, real, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { linkSourceEnum } from "./enums";
import { organisations } from "./organisations";
import { connections } from "./connections";

export const networkLinks = pgTable(
  "network_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    sourceConnectionId: uuid("source_connection_id")
      .notNull()
      .references(() => connections.id, { onDelete: "cascade" }),
    targetConnectionId: uuid("target_connection_id")
      .notNull()
      .references(() => connections.id, { onDelete: "cascade" }),
    strength: real("strength").notNull().default(0.5),
    source: linkSourceEnum("source").notNull().default("inferred"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("network_links_source_target_unique").on(
      table.sourceConnectionId,
      table.targetConnectionId
    ),
  ]
);
