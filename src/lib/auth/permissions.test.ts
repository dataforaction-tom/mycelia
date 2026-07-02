import { describe, expect, it } from "vitest";
import { hasMinRole, ORG_ROLE_HIERARCHY } from "./permissions";

describe("hasMinRole", () => {
  it("owner has all roles", () => {
    expect(hasMinRole("owner", "owner")).toBe(true);
    expect(hasMinRole("owner", "admin")).toBe(true);
    expect(hasMinRole("owner", "contributor")).toBe(true);
    expect(hasMinRole("owner", "viewer")).toBe(true);
  });

  it("admin has admin and below", () => {
    expect(hasMinRole("admin", "owner")).toBe(false);
    expect(hasMinRole("admin", "admin")).toBe(true);
    expect(hasMinRole("admin", "contributor")).toBe(true);
    expect(hasMinRole("admin", "viewer")).toBe(true);
  });

  it("contributor has contributor and below", () => {
    expect(hasMinRole("contributor", "owner")).toBe(false);
    expect(hasMinRole("contributor", "admin")).toBe(false);
    expect(hasMinRole("contributor", "contributor")).toBe(true);
    expect(hasMinRole("contributor", "viewer")).toBe(true);
  });

  it("viewer only has viewer", () => {
    expect(hasMinRole("viewer", "owner")).toBe(false);
    expect(hasMinRole("viewer", "admin")).toBe(false);
    expect(hasMinRole("viewer", "contributor")).toBe(false);
    expect(hasMinRole("viewer", "viewer")).toBe(true);
  });

  it("returns false for invalid roles", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(hasMinRole("invalid" as any, "viewer")).toBe(false);
  });
});

describe("ORG_ROLE_HIERARCHY", () => {
  it("has 4 roles in correct order", () => {
    expect(ORG_ROLE_HIERARCHY).toEqual([
      "owner",
      "admin",
      "contributor",
      "viewer",
    ]);
  });
});
