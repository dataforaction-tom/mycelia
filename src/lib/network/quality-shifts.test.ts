import { describe, expect, it } from "vitest";
import { detectQualityShifts, type QualityRow } from "./quality-shifts";

function row(
  connectionId: string,
  spectrum: string,
  position: number,
  createdAt: string
): QualityRow {
  return { connectionId, spectrum, position, createdAt: new Date(createdAt) };
}

describe("detectQualityShifts", () => {
  it("flags a large positive delta", () => {
    const rows = [
      row("a", "depth", -0.5, "2026-01-01"),
      row("a", "depth", 0.5, "2026-02-01"),
    ];
    expect(detectQualityShifts(rows)).toEqual([
      { connectionId: "a", spectrum: "depth", from: -0.5, to: 0.5, delta: 1 },
    ]);
  });

  it("does not flag a delta below the threshold", () => {
    const rows = [
      row("a", "depth", 0.1, "2026-01-01"),
      row("a", "depth", 0.3, "2026-02-01"),
    ];
    expect(detectQualityShifts(rows)).toEqual([]);
  });

  it("does not flag a single data point", () => {
    const rows = [row("a", "depth", 0.9, "2026-01-01")];
    expect(detectQualityShifts(rows)).toEqual([]);
  });

  it("only flags the spectrum that actually shifted", () => {
    const rows = [
      row("a", "depth", 0.0, "2026-01-01"),
      row("a", "depth", 0.9, "2026-02-01"),
      row("a", "activity", 0.2, "2026-01-01"),
      row("a", "activity", 0.25, "2026-02-01"),
    ];
    const shifts = detectQualityShifts(rows);
    expect(shifts).toHaveLength(1);
    expect(shifts[0].spectrum).toBe("depth");
  });
});
