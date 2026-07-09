import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { planTypeEnum } from "./enums";

/**
 * Shape of the `settings` jsonb blob. Keys are all optional — absent keys
 * fall back to their documented defaults at the read site. Kept loose with an
 * index signature so existing ad-hoc reads keep working; add known keys here
 * as they gain a typed home.
 */
export type OrgSettings = {
  /** Demo seed record, used to surgically clear demo data. */
  demo?: unknown;
  /** Whether the guided tour is still pending completion. */
  tourPending?: boolean;
  /**
   * Whether the moment composer pre-selects "add new connection" chips.
   * `"opt_in"` (default when absent) = chips start unselected (ask first);
   * `"opt_out"` = chips start selected (pre-select to add).
   */
  newConnectionSuggestions?: "opt_in" | "opt_out";
  [key: string]: unknown;
};

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
  settings: jsonb("settings").$type<OrgSettings>().default({}),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});
