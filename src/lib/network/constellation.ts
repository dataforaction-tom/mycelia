import { canonicalPair } from "./strength";

export interface ConstellationNodeInput {
  id: string;
  clusterId: string;
}

export interface ConstellationEdgeInput {
  source: string;
  target: string;
  strength: number;
}

export interface ConstellationCluster {
  id: string;
  memberIds: string[];
  memberCount: number;
  activity: number;
}

export interface ConstellationLink {
  source: string;
  target: string;
  strength: number;
}

/**
 * Aggregates connection-level nodes/edges (already fetched from
 * /api/network) into cluster-level summaries: one node per cluster sized
 * by member count and "activity" (summed intra-cluster edge strength),
 * plus deduplicated inter-cluster links for edges that cross clusters.
 */
export function buildConstellation(
  nodes: ConstellationNodeInput[],
  edges: ConstellationEdgeInput[]
): { clusters: ConstellationCluster[]; links: ConstellationLink[] } {
  const clusterIdByNode = new Map(nodes.map((n) => [n.id, n.clusterId]));
  const membersByCluster = new Map<string, string[]>();

  for (const node of nodes) {
    const members = membersByCluster.get(node.clusterId);
    if (members) members.push(node.id);
    else membersByCluster.set(node.clusterId, [node.id]);
  }

  const activityByCluster = new Map<string, number>();
  const linkStrengthByPair = new Map<string, number>();

  for (const edge of edges) {
    const sourceCluster = clusterIdByNode.get(edge.source);
    const targetCluster = clusterIdByNode.get(edge.target);
    if (!sourceCluster || !targetCluster) continue;

    if (sourceCluster === targetCluster) {
      activityByCluster.set(
        sourceCluster,
        (activityByCluster.get(sourceCluster) ?? 0) + edge.strength
      );
    } else {
      const [a, b] = canonicalPair(sourceCluster, targetCluster);
      const key = `${a}::${b}`;
      linkStrengthByPair.set(
        key,
        (linkStrengthByPair.get(key) ?? 0) + edge.strength
      );
    }
  }

  const clusters: ConstellationCluster[] = Array.from(
    membersByCluster.entries()
  ).map(([id, memberIds]) => ({
    id,
    memberIds,
    memberCount: memberIds.length,
    activity: activityByCluster.get(id) ?? 0,
  }));

  const links: ConstellationLink[] = Array.from(
    linkStrengthByPair.entries()
  ).map(([key, strength]) => {
    const [source, target] = key.split("::");
    return { source, target, strength };
  });

  return { clusters, links };
}
