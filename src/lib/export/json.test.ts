import { describe, it, expect } from "vitest";
import { renderJson } from "./json";
import { sampleExport } from "./sample.fixture";

describe("renderJson", () => {
  it("round-trips: parse(render(x)) has the same top-level shape", () => {
    const parsed = JSON.parse(renderJson(sampleExport()));
    expect(parsed.organisation.slug).toBe("acme");
    expect(parsed.connections).toHaveLength(sampleExport().connections.length);
  });
  it("pretty-prints with 2-space indent", () => {
    expect(renderJson(sampleExport())).toContain('\n  "exportedAt"');
  });
});
