const MAX_PASSES = 20;

export interface ClusterNode {
  id: string;
}

export interface ClusterEdge {
  source: string;
  target: string;
  strength: number;
}

interface Neighbour {
  id: string;
  weight: number;
}

function buildAdjacency(
  nodes: ClusterNode[],
  edges: ClusterEdge[]
): Map<string, Neighbour[]> {
  const adjacency = new Map<string, Neighbour[]>();
  for (const node of nodes) adjacency.set(node.id, []);

  for (const { source, target, strength } of edges) {
    adjacency.get(source)?.push({ id: target, weight: strength });
    adjacency.get(target)?.push({ id: source, weight: strength });
  }

  for (const neighbours of adjacency.values()) {
    neighbours.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  return adjacency;
}

/**
 * Pick the label with the highest total neighbour weight. Ties resolve to
 * the lexicographically smallest label, so the result never depends on
 * iteration or insertion order.
 */
function dominantLabel(
  neighbours: Neighbour[],
  labels: Map<string, string>
): string {
  const weightByLabel = new Map<string, number>();
  for (const { id, weight } of neighbours) {
    const label = labels.get(id)!;
    weightByLabel.set(label, (weightByLabel.get(label) ?? 0) + weight);
  }

  let bestLabel = "";
  let bestWeight = -Infinity;
  for (const [label, weight] of weightByLabel) {
    if (weight > bestWeight || (weight === bestWeight && label < bestLabel)) {
      bestLabel = label;
      bestWeight = weight;
    }
  }
  return bestLabel;
}

/**
 * Group nodes by their converged label and re-key each group by its
 * smallest member id, so the returned cluster id is always a real
 * connection id rather than an arbitrary winning label.
 */
function normalizeClusterIds(
  labels: Map<string, string>
): Map<string, string> {
  const groups = new Map<string, string[]>();
  for (const [nodeId, label] of labels) {
    const group = groups.get(label);
    if (group) group.push(nodeId);
    else groups.set(label, [nodeId]);
  }

  const result = new Map<string, string>();
  for (const members of groups.values()) {
    const clusterId = members.reduce((min, id) => (id < min ? id : min));
    for (const nodeId of members) result.set(nodeId, clusterId);
  }
  return result;
}

/**
 * Deterministic label propagation: assigns each node a clusterId based on
 * densely connected neighbourhoods weighted by link strength. Isolated
 * nodes become singleton clusters.
 */
export function detectClusters(
  nodes: ClusterNode[],
  edges: ClusterEdge[]
): Map<string, string> {
  const labels = new Map<string, string>();
  for (const node of nodes) labels.set(node.id, node.id);

  const adjacency = buildAdjacency(nodes, edges);
  const sortedIds = nodes.map((n) => n.id).sort();

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let changed = false;

    for (const id of sortedIds) {
      const neighbours = adjacency.get(id) ?? [];
      if (neighbours.length === 0) continue;

      const bestLabel = dominantLabel(neighbours, labels);
      if (bestLabel !== labels.get(id)) {
        labels.set(id, bestLabel);
        changed = true;
      }
    }

    if (!changed) break;
  }

  return normalizeClusterIds(labels);
}
