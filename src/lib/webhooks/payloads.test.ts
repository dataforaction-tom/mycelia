import { describe, expect, it } from "vitest";
import { truncate, momentCreatedPayload } from "./payloads";

describe("truncate", () => {
  it("returns short text unchanged", () => {
    expect(truncate("hello")).toBe("hello");
  });

  it("returns text unchanged when exactly at the max", () => {
    const text = "a".repeat(500);
    expect(truncate(text)).toBe(text);
  });

  it("truncates a 600-char string to 501 chars ending in an ellipsis", () => {
    const result = truncate("a".repeat(600));
    expect(result).toHaveLength(501);
    expect(result.endsWith("…")).toBe(true);
    expect(result.slice(0, 500)).toBe("a".repeat(500));
  });

  it("honours a custom max", () => {
    expect(truncate("abcdef", 3)).toBe("abc…");
  });
});

describe("momentCreatedPayload", () => {
  it("produces the expected data keys and values", () => {
    const { data } = momentCreatedPayload({
      momentId: "m1",
      content: "a".repeat(600),
      source: "manual",
      connectionNames: ["Ada", "Grace"],
      spaceName: "Founders",
    });

    expect(Object.keys(data).sort()).toEqual(
      ["connectionNames", "content", "source", "spaceName"].sort(),
    );
    expect(data.content).toHaveLength(501);
    expect(data.connectionNames).toEqual(["Ada", "Grace"]);
    expect(data.spaceName).toBe("Founders");
    expect(data.source).toBe("manual");
  });

  it("carries a null spaceName through", () => {
    const { data } = momentCreatedPayload({
      momentId: "m1",
      content: "short",
      source: "manual",
      connectionNames: [],
      spaceName: null,
    });
    expect(data.spaceName).toBeNull();
  });

  it("builds a moment subject with the tending ref format", () => {
    const { subject } = momentCreatedPayload({
      momentId: "abc-123",
      content: "short",
      source: "manual",
      connectionNames: [],
      spaceName: null,
    });

    expect(subject.kind).toBe("moment");
    expect(subject.ref).toBe("tending:moment:abc-123");
    expect(subject.url).toContain("/moments");
  });
});
