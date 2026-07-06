export interface DependencyNode {
  id: string;
}

export interface DependencyEdge {
  source: string;
  target: string;
  strength: number;
}

interface Neighbour {
  id: string;
  strength: number;
}

function buildAdjacency(
  nodes: DependencyNode[],
  edges: DependencyEdge[]
): Map<string, Neighbour[]> {
  const adjacency = new Map<string, Neighbour[]>();
  for (const node of nodes) adjacency.set(node.id, []);

  for (const { source, target, strength } of edges) {
    adjacency.get(source)?.push({ id: target, strength });
    adjacency.get(target)?.push({ id: source, strength });
  }

  for (const neighbours of adjacency.values()) {
    neighbours.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  return adjacency;
}

/**
 * Iterative DFS-based articulation-point (cut vertex) algorithm. A node is
 * an articulation point if removing it increases the number of connected
 * components — i.e. it's a single point of failure in the network.
 *
 * Deterministic: nodes/adjacency are visited in sorted id order, so the
 * result never depends on insertion order (same discipline as clusters.ts).
 */
export function findArticulationPoints(
  nodes: DependencyNode[],
  edges: DependencyEdge[]
): Set<string> {
  const adjacency = buildAdjacency(nodes, edges);
  const sortedIds = nodes.map((n) => n.id).sort();

  const disc = new Map<string, number>();
  const low = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const articulationPoints = new Set<string>();
  let timer = 0;

  for (const root of sortedIds) {
    if (disc.has(root)) continue;

    // Iterative DFS: each stack frame tracks the node, its parent, and an
    // index into its (sorted) neighbour list to resume from.
    const stack: { id: string; neighbourIndex: number }[] = [
      { id: root, neighbourIndex: 0 },
    ];
    parent.set(root, null);
    disc.set(root, timer);
    low.set(root, timer);
    timer++;
    let rootChildren = 0;

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const neighbours = adjacency.get(frame.id) ?? [];

      if (frame.neighbourIndex < neighbours.length) {
        const next = neighbours[frame.neighbourIndex].id;
        frame.neighbourIndex++;

        if (!disc.has(next)) {
          parent.set(next, frame.id);
          if (frame.id === root) rootChildren++;
          disc.set(next, timer);
          low.set(next, timer);
          timer++;
          stack.push({ id: next, neighbourIndex: 0 });
        } else if (next !== parent.get(frame.id)) {
          low.set(frame.id, Math.min(low.get(frame.id)!, disc.get(next)!));
        }
      } else {
        stack.pop();
        const p = parent.get(frame.id);
        if (p !== null && p !== undefined) {
          low.set(p, Math.min(low.get(p)!, low.get(frame.id)!));
          if (p !== root && low.get(frame.id)! >= disc.get(p)!) {
            articulationPoints.add(p);
          }
        }
      }
    }

    if (rootChildren >= 2) articulationPoints.add(root);
  }

  return articulationPoints;
}

export interface DependencyRisk {
  connectionId: string;
  strongNeighbourCount: number;
}

const STRONG_THRESHOLD = 0.7;

/**
 * Among articulation points, flag the ones where at least 2 strong
 * relationships funnel through — matching the spec's example ("three of
 * your strongest relationships are all connected to one person").
 */
export function findDependencyRisks(
  nodes: DependencyNode[],
  edges: DependencyEdge[],
  articulationPoints: Set<string>
): DependencyRisk[] {
  const adjacency = buildAdjacency(nodes, edges);
  const risks: DependencyRisk[] = [];

  for (const connectionId of Array.from(articulationPoints).sort()) {
    const neighbours = adjacency.get(connectionId) ?? [];
    const strongNeighbourCount = neighbours.filter(
      (n) => n.strength >= STRONG_THRESHOLD
    ).length;

    if (strongNeighbourCount >= 2) {
      risks.push({ connectionId, strongNeighbourCount });
    }
  }

  return risks;
}
