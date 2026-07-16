import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { webhookDeliveryStatusEnum } from "./enums";
import { organisations } from "./organisations";

export const webhookEndpoints = pgTable(
  "webhook_endpoints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    secret: text("secret").notNull(),
    events: text("events")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    active: boolean("active").notNull().default(true),
    lastDeliveryAt: timestamp("last_delivery_at", {
      mode: "date",
      withTimezone: true,
    }),
    lastStatus: text("last_status"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // The developers settings page lists an org's endpoints.
  (table) => [index("webhook_endpoints_org_idx").on(table.organisationId)]
);

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull(),
  endpointId: uuid("endpoint_id")
    .notNull()
    .references(() => webhookEndpoints.id, { onDelete: "cascade" }),
  event: text("event").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  status: webhookDeliveryStatusEnum("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  lastAttemptAt: timestamp("last_attempt_at", {
    mode: "date",
    withTimezone: true,
  }),
  lastStatusCode: integer("last_status_code"),
  nextRetryAt: timestamp("next_retry_at", {
    mode: "date",
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
},
  (table) => [
    // The delivery cron sweeps due retries: WHERE status IN (...) AND
    // nextRetryAt <= now. Without this it scans the whole deliveries table.
    index("webhook_deliveries_status_retry_idx").on(
      table.status,
      table.nextRetryAt
    ),
    // Endpoint-scoped delivery lookups / cascade.
    index("webhook_deliveries_endpoint_idx").on(table.endpointId),
  ]
);
