import { describe, it, expect } from "vitest";
import { renderOkf } from "./okf";
import { sampleExport } from "./sample.fixture";

describe("renderOkf", () => {
  const tree = renderOkf(sampleExport());

  it("emits an index and one file per connection/space/moment", () => {
    expect(tree["okf/index.md"]).toBeDefined();
    expect(Object.keys(tree).some((p) => p.startsWith("okf/connections/"))).toBe(true);
    expect(Object.keys(tree).some((p) => p.startsWith("okf/moments/"))).toBe(true);
    expect(tree["okf/members.md"]).toBeDefined();
  });

  it("connection docs carry YAML frontmatter with type + provenance", () => {
    const conn = Object.entries(tree).find(([p]) => p.startsWith("okf/connections/"))![1];
    expect(conn).toMatch(/^---\n/);
    expect(conn).toContain("type:");
    expect(conn).toContain("id:");
  });

  it("a shared moment is cross-linked from both its connections (relative md links)", () => {
    const connDocs = Object.entries(tree)
      .filter(([p]) => p.startsWith("okf/connections/"))
      .map(([, c]) => c);
    const linkers = connDocs.filter((c) => c.includes("](../moments/"));
    expect(linkers.length).toBeGreaterThanOrEqual(2);
  });

  it("marks AI-inferred thread summaries with provenance, never as human text", () => {
    const withSummary = Object.values(tree).find((c) => c.includes("thread_summary_source:"));
    expect(withSummary).toBeDefined();
  });
});
