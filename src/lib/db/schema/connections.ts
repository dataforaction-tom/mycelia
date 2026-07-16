import {
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { connectionTypeEnum } from "./enums";
import { organisations } from "./organisations";
import { spaces } from "./spaces";

/**
 * A light set of standard contact details. Tending isn't a traditional CRM,
 * so this stays deliberately small and optional — enough to reach someone,
 * not a full address book. Stored as a single typed JSONB blob so it can be
 * extended without a migration.
 */
export interface ContactDetails {
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
}

export const connections = pgTable(
  "connections",
  {
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
    contactDetails: jsonb("contact_details").$type<ContactDetails>().default({}),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // Every connection query is org-scoped; without this each is a full scan.
  (table) => [index("connections_org_idx").on(table.organisationId)]
);

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
  (table) => [
    primaryKey({ columns: [table.connectionId, table.spaceId] }),
    // PK covers lookups by connectionId; filtering by spaceId (space detail,
    // space membership) needs its own index.
    index("connection_spaces_space_idx").on(table.spaceId),
  ]
);
