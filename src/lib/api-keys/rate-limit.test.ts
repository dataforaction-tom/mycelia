import { describe, expect, it } from "vitest";
import { checkWindow } from "./rate-limit";

const WINDOW_MS = 60_000;
const LIMIT = 3;

describe("checkWindow", () => {
  it("starts a fresh window for null state", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const result = checkWindow(
      { windowStartedAt: null, windowCount: 0 },
      now,
      LIMIT,
      WINDOW_MS,
    );
    expect(result.allowed).toBe(true);
    expect(result.next).toEqual({ windowStartedAt: now, windowCount: 1 });
  });

  it("increments within the window while under the limit", () => {
    const windowStartedAt = new Date("2026-01-01T00:00:00.000Z");
    const now = new Date("2026-01-01T00:00:30.000Z");
    const result = checkWindow(
      { windowStartedAt, windowCount: 1 },
      now,
      LIMIT,
      WINDOW_MS,
    );
    expect(result.allowed).toBe(true);
    expect(result.next).toEqual({ windowStartedAt, windowCount: 2 });
  });

  it("allows the call that reaches exactly the limit", () => {
    const windowStartedAt = new Date("2026-01-01T00:00:00.000Z");
    const now = new Date("2026-01-01T00:00:30.000Z");
    const result = checkWindow(
      { windowStartedAt, windowCount: LIMIT - 1 },
      now,
      LIMIT,
      WINDOW_MS,
    );
    expect(result.allowed).toBe(true);
    expect(result.next.windowCount).toBe(LIMIT);
  });

  it("rejects the call that would exceed the limit", () => {
    const windowStartedAt = new Date("2026-01-01T00:00:00.000Z");
    const now = new Date("2026-01-01T00:00:30.000Z");
    const result = checkWindow(
      { windowStartedAt, windowCount: LIMIT },
      now,
      LIMIT,
      WINDOW_MS,
    );
    expect(result.allowed).toBe(false);
    expect(result.next.windowCount).toBe(LIMIT + 1);
  });

  it("resets to a fresh window once the window has expired", () => {
    const windowStartedAt = new Date("2026-01-01T00:00:00.000Z");
    // now is more than WINDOW_MS after the window started.
    const now = new Date("2026-01-01T00:01:00.001Z");
    const result = checkWindow(
      { windowStartedAt, windowCount: LIMIT },
      now,
      LIMIT,
      WINDOW_MS,
    );
    expect(result.allowed).toBe(true);
    expect(result.next).toEqual({ windowStartedAt: now, windowCount: 1 });
  });
});
