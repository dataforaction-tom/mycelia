import { describe, expect, it } from "vitest";
import { canonicalPair, nextStrength, pairsFromConnectionIds } from "./strength";

describe("canonicalPair", () => {
  it("orders two ids consistently regardless of input order", () => {
    expect(canonicalPair("b-id", "a-id")).toEqual(["a-id", "b-id"]);
    expect(canonicalPair("a-id", "b-id")).toEqual(["a-id", "b-id"]);
  });
});

describe("nextStrength", () => {
  it("starts a new link at the default strength", () => {
    expect(nextStrength(undefined)).toBeCloseTo(0.5);
  });

  it("increments existing strength", () => {
    expect(nextStrength(0.5)).toBeCloseTo(0.6);
  });

  it("caps strength at 1.0", () => {
    expect(nextStrength(0.95)).toBeCloseTo(1.0);
    expect(nextStrength(1.0)).toBe(1.0);
  });
});

describe("pairsFromConnectionIds", () => {
  it("returns no pairs for fewer than 2 connections", () => {
    expect(pairsFromConnectionIds([])).toEqual([]);
    expect(pairsFromConnectionIds(["a"])).toEqual([]);
  });

  it("returns all unique pairs canonically ordered", () => {
    expect(pairsFromConnectionIds(["b", "a", "c"])).toEqual([
      ["a", "b"],
      ["a", "c"],
      ["b", "c"],
    ]);
  });

  it("deduplicates repeated connection ids", () => {
    expect(pairsFromConnectionIds(["a", "a", "b"])).toEqual([["a", "b"]]);
  });
});
