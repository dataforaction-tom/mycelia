import {
  pgTable,
  text,
  timestamp,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { orgRoleEnum } from "./enums";
import { organisations } from "./organisations";
import { users } from "./auth";

/**
 * A pending invitation to join an organisation, sent to an email address
 * before that person has a Tending account. When they first sign in with
 * this email (proving they control the inbox via the magic link), any
 * matching invitations are accepted automatically — see the auth
 * `createUser` event. Kept separate from `organisation_memberships`, which
 * only ever holds real, accepted members.
 */
export const organisationInvitations = pgTable(
  "organisation_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: orgRoleEnum("role").notNull().default("viewer"),
    invitedBy: uuid("invited_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    acceptedAt: timestamp("accepted_at", { mode: "date", withTimezone: true }),
  },
  (table) => [
    // One live invitation per email per organisation — re-inviting upserts.
    unique("org_invitation_email_unique").on(table.organisationId, table.email),
  ]
);
