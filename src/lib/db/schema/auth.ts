import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import { platformRoleEnum, orgRoleEnum, userStatusEnum } from "./enums";
import { organisations } from "./organisations";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date", withTimezone: true }),
  image: text("image"),
  platformRole: platformRoleEnum("platform_role").notNull().default("user"),
  // Account lifecycle. Suspended accounts cannot sign in and their existing
  // sessions are invalidated on the next request (see the auth jwt callback).
  status: userStatusEnum("status").notNull().default("active"),
  suspendedAt: timestamp("suspended_at", { mode: "date", withTimezone: true }),
  // Bumped to force sign-out: the JWT carries the version it was minted with,
  // and any mismatch invalidates the session. There is no sessions table to
  // revoke against, so this is how a token is retired early.
  tokenVersion: integer("token_version").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ]
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

export const organisationMemberships = pgTable(
  "organisation_memberships",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    role: orgRoleEnum("role").notNull().default("viewer"),
    permissions: integer("permissions").notNull().default(0),
    invitedBy: uuid("invited_by").references(() => users.id),
    acceptedAt: timestamp("accepted_at", { mode: "date", withTimezone: true }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.organisationId] }),
    // PK is (userId, organisationId); listing an org's members filters by
    // organisationId alone, which the PK's leading column can't serve.
    index("memberships_org_idx").on(table.organisationId),
  ]
);
