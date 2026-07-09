import { describe, it, expect } from "vitest";
import { parsePagination } from "./pagination";

function req(query: string): Request {
  return new Request(`http://localhost/api/v1/moments${query}`);
}

describe("parsePagination", () => {
  it("uses the default limit 50 / offset 0 when params are omitted", () => {
    // Regression: `Number(null)` is 0, which previously clamped the default
    // limit down to 1 for every unparameterised list request.
    expect(parsePagination(req(""))).toEqual({ limit: 50, offset: 0 });
  });

  it("clamps limit to 1..100", () => {
    expect(parsePagination(req("?limit=500")).limit).toBe(100);
    expect(parsePagination(req("?limit=0")).limit).toBe(1);
  });

  it("respects a valid limit and offset", () => {
    expect(parsePagination(req("?limit=25&offset=10"))).toEqual({
      limit: 25,
      offset: 10,
    });
  });

  it("falls back to defaults for non-numeric values", () => {
    expect(parsePagination(req("?limit=abc&offset=xyz"))).toEqual({
      limit: 50,
      offset: 0,
    });
  });
});
