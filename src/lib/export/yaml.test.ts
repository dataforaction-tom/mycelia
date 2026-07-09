import { describe, it, expect } from "vitest";
import { parse } from "yaml";
import { renderYaml } from "./yaml";
import { renderJson } from "./json";
import { sampleExport } from "./sample.fixture";

describe("renderYaml", () => {
  it("parses back to the same object graph as JSON", () => {
    const fromYaml = parse(renderYaml(sampleExport()));
    const fromJson = JSON.parse(renderJson(sampleExport()));
    expect(fromYaml).toEqual(fromJson);
  });
});
