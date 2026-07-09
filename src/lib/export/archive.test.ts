import { describe, it, expect } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { buildExportArchive } from "./archive";
import { sampleExport } from "./sample.fixture";

describe("buildExportArchive", () => {
  it("produces a zip containing README, data.json, data.yaml and the okf tree", () => {
    const zip = buildExportArchive(sampleExport());
    const files = unzipSync(zip);
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining(["README.md", "data.json", "data.yaml", "okf/index.md"]),
    );
    expect(JSON.parse(strFromU8(files["data.json"])).organisation.slug).toBe("acme");
  });
});
