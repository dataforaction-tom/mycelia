import { relations } from "drizzle-orm";
import { users, accounts, organisationMemberships } from "./auth";
import { organisations } from "./organisations";
import { spaces } from "./spaces";
import { connections, connectionSpaces } from "./connections";
import { moments, momentConnections } from "./moments";
import { qualities } from "./qualities";

// Auth relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  memberships: many(organisationMemberships),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const organisationMembershipsRelations = relations(
  organisationMemberships,
  ({ one }) => ({
    user: one(users, {
      fields: [organisationMemberships.userId],
      references: [users.id],
    }),
    organisation: one(organisations, {
      fields: [organisationMemberships.organisationId],
      references: [organisations.id],
    }),
  })
);

// Organisation relations
export const organisationsRelations = relations(organisations, ({ many }) => ({
  memberships: many(organisationMemberships),
  spaces: many(spaces),
  connections: many(connections),
  moments: many(moments),
}));

// Space relations
export const spacesRelations = relations(spaces, ({ one }) => ({
  organisation: one(organisations, {
    fields: [spaces.organisationId],
    references: [organisations.id],
  }),
}));

// Connection relations
export const connectionsRelations = relations(connections, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [connections.organisationId],
    references: [organisations.id],
  }),
  connectionSpaces: many(connectionSpaces),
  momentConnections: many(momentConnections),
  qualities: many(qualities),
}));

export const connectionSpacesRelations = relations(
  connectionSpaces,
  ({ one }) => ({
    connection: one(connections, {
      fields: [connectionSpaces.connectionId],
      references: [connections.id],
    }),
    space: one(spaces, {
      fields: [connectionSpaces.spaceId],
      references: [spaces.id],
    }),
  })
);

// Moment relations
export const momentsRelations = relations(moments, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [moments.organisationId],
    references: [organisations.id],
  }),
  author: one(users, {
    fields: [moments.authorId],
    references: [users.id],
  }),
  space: one(spaces, {
    fields: [moments.spaceId],
    references: [spaces.id],
  }),
  momentConnections: many(momentConnections),
}));

export const momentConnectionsRelations = relations(
  momentConnections,
  ({ one }) => ({
    moment: one(moments, {
      fields: [momentConnections.momentId],
      references: [moments.id],
    }),
    connection: one(connections, {
      fields: [momentConnections.connectionId],
      references: [connections.id],
    }),
  })
);

// Quality relations
export const qualitiesRelations = relations(qualities, ({ one }) => ({
  connection: one(connections, {
    fields: [qualities.connectionId],
    references: [connections.id],
  }),
  moment: one(moments, {
    fields: [qualities.momentId],
    references: [moments.id],
  }),
}));
