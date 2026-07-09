import { describe, expect, it } from "vitest";
import { generateApiKey, hashApiKey } from "./keys";

describe("generateApiKey", () => {
  it("produces a key with the tnd_live_ prefix", () => {
    const generated = generateApiKey();
    expect(generated.key.startsWith("tnd_live_")).toBe(true);
  });

  it("returns a hashedKey that matches hashApiKey of the key", () => {
    const generated = generateApiKey();
    expect(hashApiKey(generated.key)).toBe(generated.hashedKey);
  });

  it("returns a prefix equal to the first 12 characters of the key", () => {
    const generated = generateApiKey();
    expect(generated.prefix).toBe(generated.key.slice(0, 12));
    expect(generated.prefix).toHaveLength(12);
  });

  it("produces different keys and hashes across calls", () => {
    const first = generateApiKey();
    const second = generateApiKey();
    expect(first.key).not.toBe(second.key);
    expect(first.hashedKey).not.toBe(second.hashedKey);
  });
});

describe("hashApiKey", () => {
  it("is deterministic for the same input", () => {
    expect(hashApiKey("tnd_live_example")).toBe(hashApiKey("tnd_live_example"));
  });

  it("returns 64 hex characters (sha256)", () => {
    const hash = hashApiKey("tnd_live_example");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
