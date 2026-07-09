import { describe, expect, it } from "vitest";
import { nextRetryAt } from "./backoff";

const T = new Date("2026-01-01T00:00:00.000Z");
const MINUTE = 60_000;

describe("nextRetryAt", () => {
  it("schedules the 1st retry 1 minute out", () => {
    expect(nextRetryAt(1, T)).toEqual(new Date(T.getTime() + 1 * MINUTE));
  });

  it("schedules the 2nd retry 10 minutes out", () => {
    expect(nextRetryAt(2, T)).toEqual(new Date(T.getTime() + 10 * MINUTE));
  });

  it("schedules the 5th (final) retry 1440 minutes out", () => {
    expect(nextRetryAt(5, T)).toEqual(new Date(T.getTime() + 1440 * MINUTE));
  });

  it("returns null once the schedule is exhausted", () => {
    expect(nextRetryAt(6, T)).toBeNull();
  });

  it("returns null for zero attempts made", () => {
    expect(nextRetryAt(0, T)).toBeNull();
  });
});
