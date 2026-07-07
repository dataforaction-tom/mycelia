import { describe, it, expect } from "vitest";
import {
  matchEntities,
  distinctEntities,
  type RosterEntry,
} from "./recognition";

const roster: RosterEntry[] = [
  { id: "c1", name: "Sarah Jenkins", kind: "connection" },
  { id: "c2", name: "Mo Ahmed", kind: "connection" },
  { id: "c3", name: "Park Road Community Centre", kind: "connection" },
  { id: "s1", name: "Winter Programme", kind: "space" },
];

describe("matchEntities", () => {
  it("matches full names case-insensitively", () => {
    const matches = matchEntities("Coffee with sarah jenkins today", roster);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      id: "c1",
      kind: "connection",
      name: "Sarah Jenkins",
      matchedText: "sarah jenkins",
    });
  });

  it("matches an unambiguous first name", () => {
    const matches = matchEntities("Quick call with Sarah about funding", roster);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ id: "c1", matchedText: "Sarah" });
  });

  it("ignores an ambiguous first name", () => {
    const ambiguous: RosterEntry[] = [
      ...roster,
      { id: "c4", name: "Sarah Smith", kind: "connection" },
    ];
    const matches = matchEntities("Quick call with Sarah about funding", ambiguous);
    expect(matches).toHaveLength(0);
  });

  it("prefers the full name over first-name shorthand on overlap", () => {
    // "Sarah Jenkins" must render as one chip, not a "Sarah" token chip
    // inside it; "Mo" alone is below the shorthand minimum length.
    const matches = matchEntities("Met Sarah Jenkins and Mo", roster);
    expect(matches).toHaveLength(1);
    expect(matches[0].matchedText).toBe("Sarah Jenkins");
  });

  it("respects word boundaries", () => {
    const withSam: RosterEntry[] = [
      { id: "c5", name: "Sam Field", kind: "connection" },
    ];
    expect(matchEntities("Talked to Samantha", withSam)).toHaveLength(0);
    expect(matchEntities("Talked to Sam.", withSam)).toHaveLength(1);
  });

  it("recognises spaces by full name only, not tokens", () => {
    const matches = matchEntities(
      "Session at the Winter Programme went well",
      roster,
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ id: "s1", kind: "space" });
    // A lone token from a space name must not match
    expect(matchEntities("Thinking about winter", roster)).toHaveLength(0);
  });

  it("returns multiple non-overlapping matches in order", () => {
    const matches = matchEntities(
      "Sarah Jenkins met Mo Ahmed at the Winter Programme",
      roster,
    );
    expect(matches.map((m) => m.id)).toEqual(["c1", "c2", "s1"]);
  });

  it("returns nothing for empty content or roster", () => {
    expect(matchEntities("", roster)).toHaveLength(0);
    expect(matchEntities("Sarah Jenkins", [])).toHaveLength(0);
  });
});

describe("distinctEntities", () => {
  it("dedupes repeated mentions of the same entity", () => {
    const matches = matchEntities(
      "Sarah called; later Sarah emailed the notes",
      roster,
    );
    expect(matches).toHaveLength(2);
    expect(distinctEntities(matches)).toHaveLength(1);
  });
});
