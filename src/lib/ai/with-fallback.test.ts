import { describe, expect, it } from "vitest";
import { withFallback } from "./with-fallback";

describe("withFallback", () => {
  it("returns the primary result without calling fallback", async () => {
    let fallbackCalled = false;
    const result = await withFallback(
      async () => "primary",
      async () => {
        fallbackCalled = true;
        return "fallback";
      }
    );

    expect(result).toBe("primary");
    expect(fallbackCalled).toBe(false);
  });

  it("falls back when the primary throws", async () => {
    const result = await withFallback(
      async () => {
        throw new Error("primary down");
      },
      async () => "fallback"
    );

    expect(result).toBe("fallback");
  });

  it("throws a combined error when both fail", async () => {
    await expect(
      withFallback(
        async () => {
          throw new Error("primary down");
        },
        async () => {
          throw new Error("fallback down");
        }
      )
    ).rejects.toThrow(/primary down.*fallback down/s);
  });
});
