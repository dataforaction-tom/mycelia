import { describe, expect, it } from "vitest";
import {
  findArticulationPoints,
  findDependencyRisks,
  type DependencyEdge,
  type DependencyNode,
} from "./dependencies";

function edge(source: string, target: string, strength = 0.5): DependencyEdge {
  return { source, target, strength };
}

describe("findArticulationPoints", () => {
  it("finds none in a single edge", () => {
    const nodes: DependencyNode[] = [{ id: "a" }, { id: "b" }];
    const edges = [edge("a", "b")];
    expect(findArticulationPoints(nodes, edges)).toEqual(new Set());
  });

  it("finds the middle node in a path graph", () => {
    const nodes: DependencyNode[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const edges = [edge("a", "b"), edge("b", "c")];
    expect(findArticulationPoints(nodes, edges)).toEqual(new Set(["b"]));
  });

  it("finds the hub in a star graph", () => {
    const nodes: DependencyNode[] = [
      { id: "h" },
      { id: "l1" },
      { id: "l2" },
      { id: "l3" },
      { id: "l4" },
    ];
    const edges = [
      edge("h", "l1"),
      edge("h", "l2"),
      edge("h", "l3"),
      edge("h", "l4"),
    ];
    expect(findArticulationPoints(nodes, edges)).toEqual(new Set(["h"]));
  });

  it("finds the shared node in a bowtie (two triangles joined at one node)", () => {
    const nodes: DependencyNode[] = [
      { id: "a" },
      { id: "b" },
      { id: "shared" },
      { id: "c" },
      { id: "d" },
    ];
    const edges = [
      edge("a", "b"),
      edge("a", "shared"),
      edge("b", "shared"),
      edge("shared", "c"),
      edge("shared", "d"),
      edge("c", "d"),
    ];
    expect(findArticulationPoints(nodes, edges)).toEqual(new Set(["shared"]));
  });

  it("finds none in two disjoint triangles", () => {
    const nodes: DependencyNode[] = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
      { id: "d" },
      { id: "e" },
      { id: "f" },
    ];
    const edges = [
      edge("a", "b"),
      edge("b", "c"),
      edge("a", "c"),
      edge("d", "e"),
      edge("e", "f"),
      edge("d", "f"),
    ];
    expect(findArticulationPoints(nodes, edges)).toEqual(new Set());
  });

  it("finds none in a complete graph (K4)", () => {
    const nodes: DependencyNode[] = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
      { id: "d" },
    ];
    const edges = [
      edge("a", "b"),
      edge("a", "c"),
      edge("a", "d"),
      edge("b", "c"),
      edge("b", "d"),
      edge("c", "d"),
    ];
    expect(findArticulationPoints(nodes, edges)).toEqual(new Set());
  });

  it("is independent of input node/edge ordering", () => {
    const nodes: DependencyNode[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const edges = [edge("a", "b"), edge("b", "c")];

    const forward = findArticulationPoints(nodes, edges);
    const shuffled = findArticulationPoints(
      [...nodes].reverse(),
      [...edges].reverse()
    );

    expect(forward).toEqual(shuffled);
  });
});

describe("findDependencyRisks", () => {
  it("flags an articulation point with 2+ strong neighbours", () => {
    const nodes: DependencyNode[] = [
      { id: "a" },
      { id: "b" },
      { id: "hub" },
      { id: "c" },
    ];
    const edges = [
      edge("a", "hub", 0.9),
      edge("b", "hub", 0.8),
      edge("hub", "c", 0.9),
    ];
    const articulationPoints = findArticulationPoints(nodes, edges);
    const risks = findDependencyRisks(nodes, edges, articulationPoints);

    expect(risks).toEqual([{ connectionId: "hub", strongNeighbourCount: 3 }]);
  });

  it("does not flag an articulation point with fewer than 2 strong neighbours", () => {
    const nodes: DependencyNode[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const edges = [edge("a", "b", 0.9), edge("b", "c", 0.2)];
    const articulationPoints = findArticulationPoints(nodes, edges);
    const risks = findDependencyRisks(nodes, edges, articulationPoints);

    expect(risks).toEqual([]);
  });
});
