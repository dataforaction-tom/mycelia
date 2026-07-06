import { describe, expect, it } from "vitest";
import { buildConstellation } from "./constellation";

describe("buildConstellation", () => {
  it("groups a single cluster with no inter-cluster links", () => {
    const nodes = [
      { id: "a", clusterId: "a" },
      { id: "b", clusterId: "a" },
      { id: "c", clusterId: "a" },
    ];
    const edges = [
      { source: "a", target: "b", strength: 0.5 },
      { source: "b", target: "c", strength: 0.5 },
    ];

    const { clusters, links } = buildConstellation(nodes, edges);

    expect(clusters).toEqual([
      { id: "a", memberIds: ["a", "b", "c"], memberCount: 3, activity: 1 },
    ]);
    expect(links).toEqual([]);
  });

  it("aggregates a crossing edge into one inter-cluster link regardless of direction", () => {
    const nodes = [
      { id: "a", clusterId: "cluster1" },
      { id: "b", clusterId: "cluster2" },
    ];
    const edges = [{ source: "b", target: "a", strength: 0.6 }];

    const { links } = buildConstellation(nodes, edges);

    expect(links).toEqual([
      { source: "cluster1", target: "cluster2", strength: 0.6 },
    ]);
  });

  it("sums activity only from intra-cluster edges", () => {
    const nodes = [
      { id: "a", clusterId: "cluster1" },
      { id: "b", clusterId: "cluster1" },
      { id: "c", clusterId: "cluster2" },
    ];
    const edges = [
      { source: "a", target: "b", strength: 0.4 },
      { source: "b", target: "c", strength: 0.9 },
    ];

    const { clusters } = buildConstellation(nodes, edges);
    const cluster1 = clusters.find((c) => c.id === "cluster1")!;
    const cluster2 = clusters.find((c) => c.id === "cluster2")!;

    expect(cluster1.activity).toBe(0.4);
    expect(cluster2.activity).toBe(0);
  });

  it("aggregates multiple edges between the same two clusters into one link", () => {
    const nodes = [
      { id: "a", clusterId: "cluster1" },
      { id: "b", clusterId: "cluster1" },
      { id: "c", clusterId: "cluster2" },
      { id: "d", clusterId: "cluster2" },
    ];
    const edges = [
      { source: "a", target: "c", strength: 0.3 },
      { source: "b", target: "d", strength: 0.2 },
    ];

    const { links } = buildConstellation(nodes, edges);

    expect(links).toHaveLength(1);
    expect(links[0].strength).toBeCloseTo(0.5);
  });
});
