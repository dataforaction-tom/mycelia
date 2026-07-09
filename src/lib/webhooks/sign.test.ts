import { describe, expect, it } from "vitest";
import { generateSecret, sign, verify } from "./sign";

const body = JSON.stringify({ hello: "world", n: 42 });
const secret = "test-secret-abc123";

describe("sign", () => {
  it("produces a 64-char lowercase hex digest", () => {
    const signature = sign(body, secret);
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same body and secret", () => {
    expect(sign(body, secret)).toBe(sign(body, secret));
  });
});

describe("verify", () => {
  it("accepts a signature it produced", () => {
    expect(verify(body, secret, sign(body, secret))).toBe(true);
  });

  it("rejects a wrong secret", () => {
    expect(verify(body, "wrong-secret", sign(body, secret))).toBe(false);
  });

  it("rejects a tampered body", () => {
    const signature = sign(body, secret);
    expect(verify(body + "!", secret, signature)).toBe(false);
  });

  it("rejects a malformed/short signature without throwing", () => {
    expect(() => verify(body, secret, "abc")).not.toThrow();
    expect(verify(body, secret, "abc")).toBe(false);
  });

  it("rejects a non-hex signature of the right length", () => {
    expect(verify(body, secret, "z".repeat(64))).toBe(false);
  });

  it("rejects an empty signature", () => {
    expect(verify(body, secret, "")).toBe(false);
  });
});

describe("generateSecret", () => {
  it("returns 64 hex chars", () => {
    expect(generateSecret()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns a different value each call", () => {
    expect(generateSecret()).not.toBe(generateSecret());
  });
});
