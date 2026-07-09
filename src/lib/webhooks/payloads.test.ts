import { describe, expect, it } from "vitest";
import {
  truncate,
  momentCreatedPayload,
  connectionCreatedPayload,
  observationGeneratedPayload,
  qualityShiftedPayload,
} from "./payloads";

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

describe("connectionCreatedPayload", () => {
  it("produces the expected data keys and values", () => {
    const { data } = connectionCreatedPayload({
      connectionId: "c1",
      name: "Ada Lovelace",
      type: "person",
    });

    expect(Object.keys(data).sort()).toEqual(["name", "type"].sort());
    expect(data.name).toBe("Ada Lovelace");
    expect(data.type).toBe("person");
  });

  it("builds a connection subject with the tending ref format", () => {
    const { subject } = connectionCreatedPayload({
      connectionId: "abc-123",
      name: "Ada",
      type: "person",
    });

    expect(subject.kind).toBe("connection");
    expect(subject.ref).toBe("tending:connection:abc-123");
    expect(subject.url).toContain("/connections/abc-123");
  });
});

describe("observationGeneratedPayload", () => {
  it("produces the expected data keys and truncates content", () => {
    const { data } = observationGeneratedPayload({
      observationId: "o1",
      content: "a".repeat(600),
      observationType: "dormant",
    });

    expect(Object.keys(data).sort()).toEqual(
      ["content", "observationType"].sort(),
    );
    expect(data.content).toHaveLength(501);
    expect(data.observationType).toBe("dormant");
  });

  it("builds an observation subject with the tending ref format", () => {
    const { subject } = observationGeneratedPayload({
      observationId: "abc-123",
      content: "short",
      observationType: "dormant",
    });

    expect(subject.kind).toBe("observation");
    expect(subject.ref).toBe("tending:observation:abc-123");
    expect(subject.url).toContain("/observations");
  });
});

describe("qualityShiftedPayload", () => {
  it("produces the expected data keys and values", () => {
    const { data } = qualityShiftedPayload({
      connectionId: "c1",
      connectionName: "Ada",
      spectrum: "trust",
      from: 0.2,
      to: 0.7,
    });

    expect(Object.keys(data).sort()).toEqual(
      ["connectionName", "from", "spectrum", "to"].sort(),
    );
    expect(data.connectionName).toBe("Ada");
    expect(data.spectrum).toBe("trust");
    expect(data.from).toBe(0.2);
    expect(data.to).toBe(0.7);
  });

  it("builds a quality subject with the tending connection ref format", () => {
    const { subject } = qualityShiftedPayload({
      connectionId: "abc-123",
      connectionName: "Ada",
      spectrum: "trust",
      from: 0.2,
      to: 0.7,
    });

    expect(subject.kind).toBe("quality");
    expect(subject.ref).toBe("tending:connection:abc-123");
    expect(subject.url).toContain("/connections/abc-123");
  });
});
