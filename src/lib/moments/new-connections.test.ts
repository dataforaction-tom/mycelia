import { describe, it, expect } from "vitest";
import { newConnectionSuggestions } from "./new-connections";

const roster = [{ id: "c1", name: "Amara Okafor" }];

describe("newConnectionSuggestions", () => {
  it("keeps only genuinely new, named entities", () => {
    const out = newConnectionSuggestions(
      [
        { name: "Bramble Trust", connectionId: null, type: "organisation" },
        { name: "Amara Okafor", connectionId: "c1", type: "person" },
      ],
      roster,
    );
    expect(out).toEqual([{ name: "Bramble Trust", type: "organisation" }]);
  });

  it("drops a new mention that fuzzy-matches an existing connection", () => {
    const out = newConnectionSuggestions(
      [{ name: "Amara", connectionId: null, type: "person" }],
      roster,
    );
    expect(out).toEqual([]);
  });

  it("de-dupes repeated names within one moment (normalised)", () => {
    const out = newConnectionSuggestions(
      [
        { name: "Bramble Trust", connectionId: null, type: "organisation" },
        { name: "  bramble   trust ", connectionId: null, type: null },
      ],
      [],
    );
    expect(out).toHaveLength(1);
  });

  it("defaults a null type to person", () => {
    const out = newConnectionSuggestions(
      [{ name: "Sam", connectionId: null, type: null }],
      [],
    );
    expect(out).toEqual([{ name: "Sam", type: "person" }]);
  });
});
