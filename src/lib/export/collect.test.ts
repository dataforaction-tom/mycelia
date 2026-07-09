import { describe, it, expect } from "vitest";
import { EXPORTED_ENTITY_KEYS } from "./collect";
import { sampleExport } from "./sample.fixture";

describe("collect coverage", () => {
  // The fixture is typed as OrgExport, so adding a field to OrgExport forces a
  // fixture update (tsc), which then trips this test unless EXPORTED_ENTITY_KEYS
  // is updated too — real drift protection, not a tautology.
  it("EXPORTED_ENTITY_KEYS matches the data entities in OrgExport", () => {
    const metaFields = ["exportedAt", "organisation"];
    const graphKeys = Object.keys(sampleExport())
      .filter((key) => !metaFields.includes(key))
      .sort();
    expect(graphKeys).toEqual([...EXPORTED_ENTITY_KEYS].sort());
  });
});
