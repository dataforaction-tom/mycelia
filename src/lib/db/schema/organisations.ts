import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { planTypeEnum } from "./enums";

export const organisations = pgTable("organisations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: planTypeEnum("plan").notNull().default("trial"),
  trialEndsAt: timestamp("trial_ends_at", {
    mode: "date",
    withTimezone: true,
  }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  settings: jsonb("settings").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});
