import { describe, expect, it } from "vitest";
import { detectClusters, type ClusterEdge, type ClusterNode } from "./clusters";

function entries(result: Map<string, string>) {
  return Array.from(result.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
}

describe("detectClusters", () => {
  it("gives isolated nodes their own cluster", () => {
    const nodes: ClusterNode[] = [{ id: "x" }, { id: "y" }, { id: "z" }];
    const result = detectClusters(nodes, []);

    expect(entries(result)).toEqual([
      ["x", "x"],
      ["y", "y"],
      ["z", "z"],
    ]);
  });

  it("groups a fully-connected triangle into one cluster", () => {
    const nodes: ClusterNode[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const edges: ClusterEdge[] = [
      { source: "a", target: "b", strength: 1 },
      { source: "a", target: "c", strength: 1 },
      { source: "b", target: "c", strength: 1 },
    ];
    const result = detectClusters(nodes, edges);

    expect(entries(result)).toEqual([
      ["a", "a"],
      ["b", "a"],
      ["c", "a"],
    ]);
  });

  it("keeps two disjoint components as separate clusters", () => {
    const nodes: ClusterNode[] = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
      { id: "d" },
    ];
    const edges: ClusterEdge[] = [
      { source: "a", target: "b", strength: 1 },
      { source: "c", target: "d", strength: 1 },
    ];
    const result = detectClusters(nodes, edges);

    expect(entries(result)).toEqual([
      ["a", "a"],
      ["b", "a"],
      ["c", "c"],
      ["d", "c"],
    ]);
  });

  it("separates a dumbbell graph across its weak bridge", () => {
    // Two dense triangles (strength 0.9) joined by one weak bridge edge
    // (strength 0.1). Each bridge endpoint has two strong same-triangle
    // neighbours outweighing the single weak cross-triangle neighbour, so
    // the weighted majority vote keeps the two triangles separate.
    const nodes: ClusterNode[] = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
      { id: "d" },
      { id: "e" },
      { id: "f" },
    ];
    const edges: ClusterEdge[] = [
      { source: "a", target: "b", strength: 0.9 },
      { source: "a", target: "c", strength: 0.9 },
      { source: "b", target: "c", strength: 0.9 },
      { source: "d", target: "e", strength: 0.9 },
      { source: "d", target: "f", strength: 0.9 },
      { source: "e", target: "f", strength: 0.9 },
      { source: "c", target: "d", strength: 0.1 },
    ];
    const result = detectClusters(nodes, edges);

    expect(entries(result)).toEqual([
      ["a", "a"],
      ["b", "a"],
      ["c", "a"],
      ["d", "d"],
      ["e", "d"],
      ["f", "d"],
    ]);
  });

  it("is deterministic across repeated runs", () => {
    const nodes: ClusterNode[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const edges: ClusterEdge[] = [
      { source: "a", target: "b", strength: 0.5 },
      { source: "b", target: "c", strength: 0.5 },
    ];

    const first = detectClusters([...nodes], [...edges]);
    const second = detectClusters([...nodes], [...edges]);

    expect(entries(first)).toEqual(entries(second));
  });

  it("is independent of input node/edge ordering", () => {
    const nodes: ClusterNode[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const edges: ClusterEdge[] = [
      { source: "a", target: "b", strength: 0.5 },
      { source: "b", target: "c", strength: 0.5 },
    ];

    const forward = detectClusters(nodes, edges);
    const shuffled = detectClusters(
      [...nodes].reverse(),
      [...edges].reverse()
    );

    expect(entries(forward)).toEqual(entries(shuffled));
  });
});
