import type { OrgExport } from "./types";

/**
 * Filter a full org export down to a single connection's subgraph.
 *
 * The scope follows the connection outward through shared moments: any other
 * connection that appears on a moment the target is linked to is pulled in too
 * (co-linked connections), so the exported narrative stays intact rather than
 * dangling half a shared moment.
 *
 * Pure — no DB access. Given the same input it always returns the same graph.
 */
export function scopeToConnection(
  data: OrgExport,
  connectionId: string,
): OrgExport {
  // Moments the target connection is directly linked to.
  const momentIds = new Set(
    data.momentConnections
      .filter((link) => link.connectionId === connectionId)
      .map((link) => link.momentId),
  );

  const moments = data.moments.filter((moment) => momentIds.has(moment.id));

  // All links on those moments — this reaches co-linked connections.
  const momentConnections = data.momentConnections.filter((link) =>
    momentIds.has(link.momentId),
  );

  // The target plus every connection co-linked via a shared moment.
  const connectionIds = new Set<string>([connectionId]);
  for (const link of momentConnections) {
    connectionIds.add(link.connectionId);
  }
  const connections = data.connections.filter((connection) =>
    connectionIds.has(connection.id),
  );

  // Space links belong to the target connection only.
  const connectionSpaces = data.connectionSpaces.filter(
    (link) => link.connectionId === connectionId,
  );

  // Spaces referenced either by those links or by any retained moment.
  const spaceIds = new Set<string>();
  for (const link of connectionSpaces) {
    spaceIds.add(link.spaceId);
  }
  for (const moment of moments) {
    if (moment.spaceId) spaceIds.add(moment.spaceId);
  }
  const spaces = data.spaces.filter((space) => spaceIds.has(space.id));

  const qualities = data.qualities.filter(
    (quality) => quality.connectionId === connectionId,
  );

  const networkLinks = data.networkLinks.filter(
    (link) =>
      link.sourceConnectionId === connectionId ||
      link.targetConnectionId === connectionId,
  );

  const observations = data.observations.filter((observation) =>
    observation.connections.includes(connectionId),
  );

  return {
    exportedAt: data.exportedAt,
    organisation: data.organisation,
    members: data.members,
    connections,
    moments,
    momentConnections,
    spaces,
    connectionSpaces,
    qualities,
    observations,
    networkLinks,
  };
}
